"""ML Bashorat API endpointlari."""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.test_result import TestResult
from app.services.ml_service import (
    predict_career,
    analyze_skills_gap,
    get_roadmap,
    OCCUPATIONS_META,
    CATEGORIES,
    INTERESTS,
    SUBJECTS,
    SKILL_CATEGORIES,
    SKILL_LEVELS,
)
from app.services.course_catalog import build_learning_path

router = APIRouter(prefix="/api/predict", tags=["ML Bashorat"])

# Optional auth — token bo'lsa saqlaydi, bo'lmasa ham ishlaydi
_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ============================================================
# Pydantic schemas
# ============================================================
class PredictionRequest(BaseModel):
    """Bashorat uchun kiruvchi ma'lumotlar (yangi format)."""
    riasec_scores: dict[str, float]
    skills: list[str]
    academic_data: dict
    age: Optional[int] = Field(default=None, ge=10, le=100)
    interests: list[str] = Field(default_factory=list)
    subjects: list[str] = Field(default_factory=list)
    skill_levels: dict[str, int] = Field(default_factory=dict)


class SkillsGapRequest(BaseModel):
    user_skills: list[str]
    occupation_id: int


class LearningPathPostRequest(BaseModel):
    user_skills: list[str]
    occupation_id: int


# ============================================================
# Bashorat endpointi
# ============================================================
@router.post("/career")
def predict(
    data: PredictionRequest,
    token: Optional[str] = Depends(_oauth2),
    db: Session = Depends(get_db),
):
    """ML model yordamida foydalanuvchiga mos top 5 kasbni bashorat qiladi.

    Token mavjud bo'lsa natija DB ga saqlanadi (tarix uchun).
    """
    predictions = predict_career(
        riasec_scores=data.riasec_scores,
        skills=data.skills,
        academic_data=data.academic_data,
        age=data.age,
        interests=data.interests,
        subjects=data.subjects,
        skill_levels=data.skill_levels,
    )

    # Autentifikatsiya qilingan bo'lsa DB ga saqlash
    if token:
        try:
            from app.routers.auth import verify_token
            payload = verify_token(token)
            if payload and payload.get("user_id"):
                # Yangi maydonlarni academic_data ichiga qo'shamiz
                # (modelni o'zgartirmasdan saqlash uchun)
                extended_academic = dict(data.academic_data or {})
                if data.age is not None:
                    extended_academic["age"] = data.age
                if data.interests:
                    extended_academic["interests"] = data.interests
                if data.subjects:
                    extended_academic["subjects"] = data.subjects
                if data.skill_levels:
                    extended_academic["skill_levels"] = data.skill_levels

                record = TestResult(
                    user_id=payload["user_id"],
                    riasec_scores=data.riasec_scores,
                    academic_data=extended_academic,
                    user_skills=data.skills,
                    predictions={"top": predictions},
                )
                db.add(record)
                db.commit()
        except Exception:
            db.rollback()  # Saqlash xato bo'lsa ham natija qaytariladi

    return {
        "predictions": predictions,
        "model_type": "RandomForestClassifier",
        "total_occupations": len(OCCUPATIONS_META),
        "top_career": predictions[0] if predictions else None,
    }


# ============================================================
# Skills gap
# ============================================================
@router.post("/skills-gap")
def skills_gap(data: SkillsGapRequest):
    """Tanlangan kasb uchun ko'nikmalar farqini tahlil qiladi."""
    return analyze_skills_gap(
        user_skills=data.user_skills,
        occupation_id=data.occupation_id,
    )


# ============================================================
# Learning path
# ============================================================
@router.get("/learning-path/{occupation_id}")
def learning_path(
    occupation_id: int,
    token: Optional[str] = Depends(_oauth2),
    db: Session = Depends(get_db),
):
    """Tanlangan kasb uchun kurslar tavsiyasi."""
    occ = OCCUPATIONS_META.get(occupation_id)
    if not occ:
        return {"error": "Kasb topilmadi"}

    user_skills: list[str] = []
    if token:
        try:
            from app.routers.auth import verify_token
            payload = verify_token(token)
            if payload and payload.get("user_id"):
                latest = (
                    db.query(TestResult)
                    .filter(TestResult.user_id == payload["user_id"])
                    .order_by(TestResult.created_at.desc())
                    .first()
                )
                if latest and latest.user_skills:
                    user_skills = list(latest.user_skills)
        except Exception:
            pass

    required = occ["required_skills"]
    matched = [s for s in required if s in user_skills]
    missing = [s for s in required if s not in user_skills]
    path = build_learning_path(missing, required_order=required)

    return {
        "occupation": occ["name_uz"],
        "occupation_en": occ["name"],
        "category": CATEGORIES.get(occ.get("category", ""), ""),
        "required_skills": required,
        "matched_skills": matched,
        "match_percent": round((len(matched) / len(required)) * 100) if required else 0,
        **path,
    }


@router.post("/learning-path")
def learning_path_post(data: LearningPathPostRequest):
    """Token bermagan foydalanuvchilar uchun: skillarni body orqali yuborish."""
    occ = OCCUPATIONS_META.get(data.occupation_id)
    if not occ:
        return {"error": "Kasb topilmadi"}

    required = occ["required_skills"]
    matched = [s for s in required if s in data.user_skills]
    missing = [s for s in required if s not in data.user_skills]
    path = build_learning_path(missing, required_order=required)

    return {
        "occupation": occ["name_uz"],
        "occupation_en": occ["name"],
        "category": CATEGORIES.get(occ.get("category", ""), ""),
        "required_skills": required,
        "matched_skills": matched,
        "match_percent": round((len(matched) / len(required)) * 100) if required else 0,
        **path,
    }


# ============================================================
# Roadmap
# ============================================================
@router.get("/roadmap/{occupation_id}")
def roadmap(
    occupation_id: int,
    token: Optional[str] = Depends(_oauth2),
    db: Session = Depends(get_db),
):
    """Tanlangan kasb uchun 6 oylik personallashtirilgan yo'l xaritasi."""
    user_skills = []
    if token:
        try:
            from app.routers.auth import verify_token
            payload = verify_token(token)
            if payload and payload.get("user_id"):
                latest = (
                    db.query(TestResult)
                    .filter(TestResult.user_id == payload["user_id"])
                    .order_by(TestResult.created_at.desc())
                    .first()
                )
                if latest and latest.user_skills:
                    user_skills = list(latest.user_skills)
        except Exception:
            pass

    return get_roadmap(occupation_id, user_skills)


# ============================================================
# Yangi: Metadata endpoint — frontend formani to'ldirishi uchun
# ============================================================
@router.get("/metadata")
def metadata():
    """Frontend uchun barcha taksonomiyalar va kasblar ro'yxati.

    Frontendda yosh, qiziqishlar, fanlar, ko'nikmalar va kategoriyalarni
    chizish uchun ishlatiladi.
    """
    return {
        "categories": [
            {"key": k, "label": v} for k, v in CATEGORIES.items()
        ],
        "interests": [
            {"key": k, "label": v} for k, v in INTERESTS.items()
        ],
        "subjects": [
            {"key": k, "label": v} for k, v in SUBJECTS.items()
        ],
        "skill_categories": SKILL_CATEGORIES,
        "skill_levels": [
            {"value": k, "label": v} for k, v in SKILL_LEVELS.items()
        ],
        "total_occupations": len(OCCUPATIONS_META),
    }


# ============================================================
# Yangi: Kasblar ro'yxati (filtrlash uchun)
# ============================================================
@router.get("/occupations")
def list_occupations(category: Optional[str] = None):
    """Barcha (yoki kategoriya bo'yicha) kasblarni qaytaradi."""
    items = []
    for occ_id, occ in OCCUPATIONS_META.items():
        if category and occ.get("category") != category:
            continue
        items.append({
            "id": occ_id,
            "name": occ["name"],
            "name_uz": occ["name_uz"],
            "category": occ.get("category"),
            "category_uz": CATEGORIES.get(occ.get("category", ""), ""),
            "avg_salary": occ["avg_salary"],
            "demand": occ.get("demand"),
            "growth": occ.get("growth"),
            "description_uz": occ["description_uz"],
            "required_skills": occ.get("required_skills", []),
            "age_range": occ.get("age_range", [16, 65]),
        })
    return {"total": len(items), "occupations": items}
