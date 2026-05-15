"""RIASEC Test API endpointlari."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.riasec_service import get_questions, calculate_riasec_scores, get_dominant_types

router = APIRouter(prefix="/api/test", tags=["RIASEC Test"])


class RiasecAnswers(BaseModel):
    """Foydalanuvchi javoblari - {question_id: score(1-5)}."""
    answers: dict[int, int]


class RiasecResult(BaseModel):
    scores: dict[str, float]
    dominant_types: list[dict]


@router.get("/questions")
def list_questions():
    """Barcha RIASEC savollarini qaytaradi."""
    return {"questions": get_questions(), "total": len(get_questions())}


@router.post("/calculate", response_model=RiasecResult)
def calculate_scores(data: RiasecAnswers):
    """
    Javoblardan RIASEC skorlarini hisoblaydi.

    - 30 ta savolga 1-5 orasida javob berish kerak
    - Natija: R, I, A, S, E, C skorlari (0-10)
    """
    # Validatsiya
    for qid, score in data.answers.items():
        if score < 1 or score > 5:
            return {"error": f"Savol {qid}: baho 1-5 orasida bo'lishi kerak"}

    scores = calculate_riasec_scores(data.answers)
    dominant = get_dominant_types(scores)

    return RiasecResult(scores=scores, dominant_types=dominant)
