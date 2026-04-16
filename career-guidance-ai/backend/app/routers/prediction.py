"""ML Bashorat API endpointlari."""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.test_result import TestResult
from app.services.ml_service import predict_career, analyze_skills_gap, get_roadmap

router = APIRouter(prefix="/api/predict", tags=["ML Bashorat"])

# Optional auth — token bo'lsa saqlaydi, bo'lmasa ham ishlaydi
_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


class PredictionRequest(BaseModel):
    """Bashorat uchun kiruvchi ma'lumotlar."""
    riasec_scores: dict[str, float]
    skills: list[str]
    academic_data: dict


class SkillsGapRequest(BaseModel):
    user_skills: list[str]
    occupation_id: int


@router.post("/career")
def predict(
    data: PredictionRequest,
    token: Optional[str] = Depends(_oauth2),
    db: Session = Depends(get_db),
):
    """
    ML model yordamida foydalanuvchiga mos top 3 kasbni bashorat qiladi.
    Token mavjud bo'lsa natija DB ga saqlanadi (tarix uchun).
    """
    predictions = predict_career(
        riasec_scores=data.riasec_scores,
        skills=data.skills,
        academic_data=data.academic_data,
    )

    # Autentifikatsiya qilingan bo'lsa DB ga saqlash
    if token:
        try:
            from app.routers.auth import verify_token
            payload = verify_token(token)
            if payload and payload.get("user_id"):
                record = TestResult(
                    user_id=payload["user_id"],
                    riasec_scores=data.riasec_scores,
                    academic_data=data.academic_data,
                    user_skills=data.skills,
                    predictions={"top3": predictions},
                )
                db.add(record)
                db.commit()
        except Exception:
            db.rollback()  # Saqlash xato bo'lsa ham natija qaytariladi

    return {
        "predictions": predictions,
        "model_type": "RandomForestClassifier",
        "top_career": predictions[0] if predictions else None,
    }


@router.post("/skills-gap")
def skills_gap(data: SkillsGapRequest):
    """
    Tanlangan kasb uchun ko'nikmalar farqini tahlil qiladi.

    - Mavjud va yetishmayotgan ko'nikmalarni aniqlaydi
    - Moslik foizini hisoblaydi
    """
    result = analyze_skills_gap(
        user_skills=data.user_skills,
        occupation_id=data.occupation_id,
    )
    return result


@router.get("/roadmap/{occupation_id}")
def roadmap(occupation_id: int):
    """
    Tanlangan kasb uchun 6 oylik yo'l xaritasini qaytaradi.

    Har bir bosqich uchun:
    - Davomiyligi
    - O'quv mavzusi
    - Ochiq manbalardan resurslar (Coursera, YouTube, va h.k.)
    """
    result = get_roadmap(occupation_id)
    return result
