"""
Hybrid Recommender — Content-Based + Collaborative Filtering kombinatsiyasi.

Asosiy g'oya:
    Final_score(u, i) = α · ContentScore(u, i) + (1 - α) · CollaborativeScore(u, i)

α ∈ [0, 1] gibridlash koeffitsienti:
    α = 1.0  → faqat Content-Based (yangi user'lar uchun yaxshi)
    α = 0.0  → faqat Collaborative (ko'p ma'lumotli user'lar uchun yaxshi)
    α = 0.5  → teng kombinatsiya

Diplom uchun nuqtai nazar:
    Content-Based cold-start muammosini hal qiladi, lekin "filter bubble" yaratadi
    (faqat profile'ga juda mos kasblar tavsiya qilinadi).
    Collaborative xilma-xil tavsiyalar beradi, lekin yangi user uchun ishlashi qiyin.
    Hybrid har ikkisining afzalliklarini birlashtiradi.

Adaptiv α (kelajakda):
    α = f(user_interaction_count)
    α = 1.0 (yangi user) → 0.5 (10+ fikr) → 0.3 (50+ fikr)
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import List, Dict, Optional

from app.ml.content_based import ContentBasedRecommender
from app.ml.collaborative import CollaborativeRecommender


class HybridRecommender:
    """Content-Based + Collaborative weighted ensemble.

    Atributlar:
        alpha           — content vs collaborative og'irligi (0-1)
        normalize       — score'larni normalize qilishmi (min-max yoki z-score)
        content_model   — ContentBasedRecommender
        cf_model        — CollaborativeRecommender
    """

    def __init__(
        self,
        alpha: float = 0.5,
        normalize: str = "minmax",  # "minmax" | "zscore" | "none"
        content_model: Optional[ContentBasedRecommender] = None,
        cf_model: Optional[CollaborativeRecommender] = None,
        cf_n_components: int = 20,
        cf_method: str = "nmf",
    ):
        if not 0 <= alpha <= 1:
            raise ValueError(f"alpha 0-1 oraliqda bo'lishi kerak, got {alpha}")
        if normalize not in ("minmax", "zscore", "none"):
            raise ValueError(f"normalize: minmax/zscore/none, got {normalize}")

        self.alpha = alpha
        self.normalize = normalize
        self.content_model = content_model or ContentBasedRecommender()
        self.cf_model = cf_model or CollaborativeRecommender(
            n_components=cf_n_components, method=cf_method,
        )
        self.is_fitted_: bool = False

    # ------------------------------------------------------------
    # Fit
    # ------------------------------------------------------------
    def fit(
        self,
        careers_df: pd.DataFrame,
        X_careers: np.ndarray,
        X_train_content: np.ndarray,
        y_train: np.ndarray,
    ) -> "HybridRecommender":
        """Ikkala modelni o'qitish."""
        self.content_model.fit(careers_df=careers_df, X_careers=X_careers)
        self.cf_model.fit(
            X_train_content=X_train_content,
            y_train=y_train,
            n_items=len(careers_df),
        )
        self.is_fitted_ = True
        return self

    # ------------------------------------------------------------
    # Predict
    # ------------------------------------------------------------
    def score_matrix(self, X_test_content: np.ndarray) -> np.ndarray:
        """Test userlar uchun gibrid score matritsasi.

        Returns:
            shape (N_test, N_items)
        """
        self._check_fitted()

        # Har ikkala modelning score matritsasi
        content_scores = self.content_model.score_matrix(X_test_content)
        cf_scores = self.cf_model.score_matrix(X_test_content)

        # Score'larni bir xil shkalada keltirish
        c_norm = self._normalize_scores(content_scores)
        cf_norm = self._normalize_scores(cf_scores)

        # Hybrid
        return self.alpha * c_norm + (1.0 - self.alpha) * cf_norm

    def predict_batch(
        self, X_test_content: np.ndarray, k: int = 5,
    ) -> np.ndarray:
        """Bir nechta foydalanuvchi uchun top-k tavsiyalar."""
        scores = self.score_matrix(X_test_content)
        return np.argsort(-scores, axis=1)[:, :k]

    def predict_for_user(
        self,
        x_user_content: np.ndarray,
        k: int = 5,
    ) -> List[Dict]:
        """Bitta user uchun batafsil tavsiyalar (explanation bilan)."""
        self._check_fitted()
        scores = self.score_matrix(x_user_content.reshape(1, -1))[0]
        top_k = np.argsort(-scores)[:k]

        results = []
        for idx in top_k:
            row = self.content_model.careers_df_.iloc[int(idx)]
            results.append({
                "id": int(row["id"]),
                "name": row["name"],
                "name_uz": row["name_uz"],
                "category": row["category"],
                "score": float(scores[idx]),
                "explanation": self.content_model._explain(x_user_content, int(idx)),
                "method": f"hybrid (α={self.alpha})",
            })
        return results

    # ------------------------------------------------------------
    # Yordamchi
    # ------------------------------------------------------------
    def _normalize_scores(self, S: np.ndarray) -> np.ndarray:
        """Score matritsasini normalize qilish (har qator alohida)."""
        if self.normalize == "none":
            return S
        if self.normalize == "minmax":
            mn = S.min(axis=1, keepdims=True)
            mx = S.max(axis=1, keepdims=True)
            rng = np.where(mx - mn > 1e-9, mx - mn, 1.0)
            return (S - mn) / rng
        # zscore
        mu = S.mean(axis=1, keepdims=True)
        sd = S.std(axis=1, keepdims=True)
        sd = np.where(sd > 1e-9, sd, 1.0)
        return (S - mu) / sd

    def _check_fitted(self):
        if not self.is_fitted_:
            raise RuntimeError("Model fit() qilinmagan.")


# ============================================================
# Alpha-tuning yordamchisi (diplom uchun grafik)
# ============================================================

def alpha_sweep(
    careers_df: pd.DataFrame,
    X_careers: np.ndarray,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    alphas: List[float] = (0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0),
    k: int = 5,
    metric: str = "ndcg@5",
) -> pd.DataFrame:
    """Validatsiya to'plamida turli α qiymatlarini sinash.

    Returns:
        DataFrame, ustunlar: alpha, precision@k, recall@k, ndcg@k
    """
    from app.ml.evaluation import precision_at_k, recall_at_k, ndcg_at_k

    rows = []
    for alpha in alphas:
        hybrid = HybridRecommender(alpha=alpha)
        hybrid.fit(careers_df, X_careers, X_train, y_train)
        pred = hybrid.predict_batch(X_val, k=k)
        rows.append({
            "alpha": alpha,
            f"precision@{k}": precision_at_k(pred, y_val, k=k),
            f"recall@{k}": recall_at_k(pred, y_val, k=k),
            f"ndcg@{k}": ndcg_at_k(pred, y_val, k=k),
        })
    return pd.DataFrame(rows)
