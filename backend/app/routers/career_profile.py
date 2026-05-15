"""
Karyera profili — har foydalanuvchi uchun yagona, tahrirlanadigan profil.

Maqsad: foydalanuvchi test'ni qayta-qayta o'tirmasdan,
ma'lumotlarini istalgan paytda yangilashi → predictionlar qayta hisoblanadi.

Texnik tafsil: TestResult jadvali asos qilib olinadi, har userda eng so'nggi
yozuv "joriy profil" deb hisoblanadi. PATCH qilingan vaqtda eski yozuv
yangilanadi (yangi tarix qatori yaratilmaydi).
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.routers.auth import require_auth
from app.services.ml_service import predict_career, OCCUPATIONS_META

router = APIRouter(prefix="/api/career-profile", tags=["Career Profile"])


class CareerProfileUpdate(BaseModel):
    riasec_scores: Optional[dict] = None
    skills: Optional[list[str]] = None
    gpa: Optional[float] = None
    age: Optional[int] = None
    analytical: Optional[int] = None
    communication: Optional[int] = None
    interests: Optional[list[str]] = None
    subjects: Optional[list[str]] = None
    skill_levels: Optional[dict] = None


def _get_latest(db: Session, user_id: int) -> Optional[TestResult]:
    return (
        db.query(TestResult)
        .filter(TestResult.user_id == user_id)
        .order_by(TestResult.created_at.desc())
        .first()
    )


def _serialize(record: TestResult) -> dict:
    """TestResult → karyera profili formati (flat ko'rinishda)."""
    academic = dict(record.academic_data or {})
    top = (record.predictions or {}).get("top") or (record.predictions or {}).get("top3") or []
    return {
        "exists": True,
        "id": record.id,
        "updated_at": record.created_at.isoformat() if record.created_at else None,
        "riasec_scores": record.riasec_scores or {},
        "skills": list(record.user_skills or []),
        "skill_scores": academic.get("skill_scores", {}),  # {skill: percent}
        "gpa": academic.get("gpa"),
        "age": academic.get("age"),
        "analytical": academic.get("analytical"),
        "communication": academic.get("communication"),
        "interests": academic.get("interests", []),
        "subjects": academic.get("subjects", []),
        "skill_levels": academic.get("skill_levels", {}),
        "predictions": top,
        "top_career": top[0] if top else None,
    }


@router.get("")
def get_career_profile(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Joriy karyera profilini qaytaradi (yo'q bo'lsa exists=False)."""
    record = _get_latest(db, current_user.id)
    if not record:
        return {"exists": False}
    return _serialize(record)


@router.patch("")
def update_career_profile(
    data: CareerProfileUpdate,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Profilning bir qismini yangilash. Ma'lumotlar yetarli bo'lsa,
    prediction qayta hisoblanadi va saqlanadi.
    """
    record = _get_latest(db, current_user.id)

    # Mavjud qiymatlarni o'qib olamiz
    if record:
        riasec_scores = dict(record.riasec_scores or {})
        skills = list(record.user_skills or [])
        academic = dict(record.academic_data or {})
    else:
        riasec_scores = {}
        skills = []
        academic = {}

    # Yangi qiymatlarni qo'llaymiz
    if data.riasec_scores is not None:
        riasec_scores = dict(data.riasec_scores)
    if data.skills is not None:
        skills = list(data.skills)
    if data.gpa is not None:
        academic["gpa"] = data.gpa
    if data.age is not None:
        academic["age"] = data.age
    if data.analytical is not None:
        academic["analytical"] = data.analytical
    if data.communication is not None:
        academic["communication"] = data.communication
    if data.interests is not None:
        academic["interests"] = list(data.interests)
    if data.subjects is not None:
        academic["subjects"] = list(data.subjects)
    if data.skill_levels is not None:
        academic["skill_levels"] = dict(data.skill_levels)

    # Prediction faqat RIASEC scores mavjud bo'lsa hisoblanadi
    predictions = None
    if riasec_scores:
        try:
            predictions = predict_career(
                riasec_scores=riasec_scores,
                skills=skills,
                academic_data={
                    "gpa": academic.get("gpa"),
                    "analytical": academic.get("analytical"),
                    "communication": academic.get("communication"),
                },
                age=academic.get("age"),
                interests=academic.get("interests"),
                subjects=academic.get("subjects"),
                skill_levels=academic.get("skill_levels"),
            )
        except Exception as e:
            # Prediction xato bo'lsa, ma'lumotlarni baribir saqlaymiz
            predictions = None

    # DB ga yozish: mavjud yozuvni yangilaymiz yoki yangi yaratamiz
    if record:
        record.riasec_scores = riasec_scores
        record.user_skills = skills
        record.academic_data = academic
        if predictions is not None:
            record.predictions = {"top": predictions}
        record.created_at = datetime.utcnow()
        db.commit()
        db.refresh(record)
    else:
        record = TestResult(
            user_id=current_user.id,
            riasec_scores=riasec_scores,
            user_skills=skills,
            academic_data=academic,
            predictions={"top": predictions} if predictions else None,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return {
        **_serialize(record),
        "recomputed": predictions is not None,
    }
