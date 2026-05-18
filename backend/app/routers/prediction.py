"""
Recommender API — kasb tavsiya endpointlari.

ML pipeline:
    1. O'qitilgan model `app/ml/saved/` dan yuklanadi (lazy init)
    2. Foydalanuvchi profili (RIASEC + qiziqishlar + fanlar) → feature vector
    3. Model top-K kasb tavsiya qiladi (cosine similarity asosida)
    4. Har tavsiya uchun "nima uchun" izoh beriladi

Model holati:
    - content_based.pkl — joriy production model
    - hybrid.pkl       — kelajakda (real foydalanuvchi interactions yig'ilgach)

Modelni yangilash:
    cd backend && python -m app.ml.train
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import joblib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.ml.content_based import ContentBasedRecommender
from app.ml.dataset import user_profile_to_vector
from app.routers.auth import require_auth, optional_auth
from app.models.user import User
from app.models.test_result import TestResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/predict", tags=["Recommender"])


# ============================================================
# Lazy model loader (faqat birinchi so'rovda yuklanadi)
# ============================================================

_MODEL_PATH = Path(__file__).resolve().parents[1] / "ml" / "saved" / "content_based.pkl"
_model_cache: Optional[ContentBasedRecommender] = None


def _get_model() -> ContentBasedRecommender:
    """O'qitilgan modelni yuklash (singleton)."""
    global _model_cache
    if _model_cache is None:
        if not _MODEL_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Model fayli topilmadi: {_MODEL_PATH}. "
                    "Avval `python -m app.ml.train` ishga tushiring."
                ),
            )
        logger.info("ML model yuklanmoqda: %s", _MODEL_PATH)
        _model_cache = joblib.load(_MODEL_PATH)
        logger.info("Model yuklandi: %d kasb", len(_model_cache.careers_df_))
    return _model_cache


# ============================================================
# Sxemalar
# ============================================================

class RecommendRequest(BaseModel):
    """Tavsiya so'rovi."""
    riasec_scores: dict[str, float] = Field(
        ...,
        description="6-dim psixometrik vektor: {R, I, A, S, E, C} qiymatlari 0-10",
        examples=[{"R": 4, "I": 9, "A": 4, "S": 3, "E": 3, "C": 7}],
    )
    interests: list[str] = Field(
        default_factory=list,
        description="Foydalanuvchining qiziqishlari (taxonomies.INTERESTS kalitlari)",
        examples=[["it", "fan", "musiqa"]],
    )
    subjects: list[str] = Field(
        default_factory=list,
        description="Yaxshi fanlar (taxonomies.SUBJECTS kalitlari)",
        examples=[["matematika", "fizika", "informatika"]],
    )
    top_k: int = Field(default=5, ge=1, le=20)
    category_filter: Optional[str] = Field(
        default=None,
        description="Faqat shu kategoriyadan tavsiya (masalan 'it', 'tibbiyot')",
    )


class RecommendedCareer(BaseModel):
    id: int
    name: str
    name_uz: str
    category: str
    score: float = Field(..., description="Cosine similarity (0-1)")
    explanation: list[str]
    # To'liq kasb ma'lumotlari
    description_uz: Optional[str] = ""
    avg_salary: Optional[str] = ""
    demand: Optional[str] = ""
    growth: Optional[str] = ""
    required_skills: list[str] = []
    subjects: list[str] = []
    interests: list[str] = []
    roadmap: list[dict] = []
    riasec_career: dict[str, int] = {}


class RecommendResponse(BaseModel):
    recommendations: list[RecommendedCareer]
    method: str
    total_careers: int


# ============================================================
# Endpointlar
# ============================================================

@router.post("/recommend", response_model=RecommendResponse)
def recommend(
    data: RecommendRequest,
    current_user: User | None = Depends(optional_auth),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi profili asosida top-K kasb tavsiya qilish.

    Algoritm: Content-Based Filtering (Cosine similarity).

    Misol:
        ```json
        {
          "riasec_scores": {"R":4,"I":9,"A":4,"S":3,"E":3,"C":7},
          "interests": ["it", "fan"],
          "subjects": ["matematika", "fizika", "informatika"],
          "top_k": 5
        }
        ```
    """
    model = _get_model()

    # Profile validation
    required_riasec = {"R", "I", "A", "S", "E", "C"}
    if not required_riasec.issubset(data.riasec_scores.keys()):
        raise HTTPException(
            status_code=400,
            detail=f"RIASEC scores'da quyidagi kalitlar bo'lishi shart: {required_riasec}",
        )

    # Profile → vector
    user_vec = user_profile_to_vector(
        riasec_scores=data.riasec_scores,
        interests=data.interests,
        subjects=data.subjects,
    )

    # Predict
    results = model.predict(
        user_vec,
        k=data.top_k,
        category_filter=data.category_filter,
    )

    # DB ga saqlash (tarix uchun) — faqat tizimga kirgan foydalanuvchilar uchun
    if current_user is not None:
        try:
            test_result = TestResult(
                user_id=current_user.id,
                riasec_scores=data.riasec_scores,
                academic_data={
                    "interests": data.interests,
                    "subjects": data.subjects,
                },
                user_skills=[],
                recommendations=results,
            )
            db.add(test_result)
            db.commit()
        except Exception as e:
            logger.exception("TestResult saqlashda xato: %s", e)
            db.rollback()

    return RecommendResponse(
        recommendations=[RecommendedCareer(**r) for r in results],
        method="content-based (cosine similarity)",
        total_careers=len(model.careers_df_),
    )


@router.get("/metadata")
def get_metadata():
    """Forma uchun barcha taxonomiyalar bir so'rovda."""
    from app.data.taxonomies import (
        CATEGORIES, INTERESTS, SUBJECTS,
        SKILL_CATEGORIES, SKILL_LEVELS, RIASEC_NAMES,
    )
    return {
        "categories": [{"key": k, "label": v, "name": v} for k, v in CATEGORIES.items()],
        "interests": [{"key": k, "label": v, "name": v} for k, v in INTERESTS.items()],
        "subjects": [{"key": k, "label": v, "name": v} for k, v in SUBJECTS.items()],
        "skill_categories": SKILL_CATEGORIES,
        "skill_levels": SKILL_LEVELS,
        "riasec_names": RIASEC_NAMES,
    }


@router.get("/categories")
def list_categories():
    """Mavjud kasb kategoriyalari (filter uchun foydali)."""
    from app.data.taxonomies import CATEGORIES
    return {"categories": CATEGORIES}


@router.get("/interests")
def list_interests():
    """Mavjud qiziqishlar."""
    from app.data.taxonomies import INTERESTS
    return {"interests": INTERESTS}


@router.get("/subjects")
def list_subjects():
    """Mavjud o'quv fanlari."""
    from app.data.taxonomies import SUBJECTS
    return {"subjects": SUBJECTS}


@router.get("/model-info")
def model_info():
    """Model haqida texnik ma'lumot (himoyaga foydali)."""
    model = _get_model()
    careers_df = model.careers_df_
    return {
        "algorithm": "Content-Based Filtering (Cosine Similarity)",
        "feature_dim": int(model.X_careers_.shape[1]),
        "total_careers": int(len(careers_df)),
        "total_categories": int(careers_df["category"].nunique()),
        "feature_breakdown": {
            "riasec": 6,
            "categories": 30,
            "interests": 33,
            "subjects": 32,
        },
    }
