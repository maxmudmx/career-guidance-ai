"""Recommender API — kasb tavsiya endpointlari.

NOTE: Hozircha skeleton. Keyingi sessiyada quyidagilar qo'shiladi:
  - Content-Based Filtering (cosine similarity)
  - Collaborative Filtering (SVD/NMF/ALS)
  - Hybrid Recommender
  - Evaluation metrikalar (Precision@K, Recall@K, NDCG)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.routers.auth import require_auth
from app.models.user import User

router = APIRouter(prefix="/api/predict", tags=["Recommender"])


class RecommendRequest(BaseModel):
    """Tavsiya so'rovi — foydalanuvchi profili."""
    riasec_scores: dict[str, float] = Field(
        ...,
        description="6-dim psixometrik vektor: {R, I, A, S, E, C → 0-100}",
    )
    academic_data: dict = Field(
        default_factory=dict,
        description="Akademik baholar: {math, physics, ... → 1-5}",
    )
    skills: list[str] = Field(
        default_factory=list,
        description="Foydalanuvchining ko'nikmalari",
    )
    age: Optional[int] = Field(default=None, ge=10, le=100)
    top_k: int = Field(default=5, ge=1, le=20, description="Tavsiya qilinadigan kasblar soni")


class RecommendedCareer(BaseModel):
    """Bitta tavsiya etilgan kasb."""
    id: int
    name: str
    name_uz: str
    category: str
    confidence: float  # 0-1
    explanation: list[str]  # nima uchun shu kasb (top features)


class RecommendResponse(BaseModel):
    recommendations: list[RecommendedCareer]
    method: str  # "content-based" | "collaborative" | "hybrid"


@router.post("/recommend", response_model=RecommendResponse)
def recommend(
    data: RecommendRequest,
    current_user: User = Depends(require_auth),
):
    """Foydalanuvchi profili asosida top-K kasb tavsiya qilish.

    TODO (keyingi sessiya):
      1. Content-Based: user vector ↔ career feature vectors (cosine similarity)
      2. Collaborative Filtering: SVD/NMF matritsa parchalash
      3. Hybrid: ikkalasini birlashtirish
      4. Explainability: SHAP/Feature Importance
    """
    raise HTTPException(
        status_code=501,
        detail="Recommender model hali tayyor emas. Keyingi sessiyada qo'shiladi.",
    )
