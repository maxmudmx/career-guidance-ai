"""
Content-Based Recommender System.

Mazmun:
    ContentBasedRecommender — kasb feature vektorlari va foydalanuvchi profilini
    cosine similarity bilan taqqoslab top-K kasb tavsiya qiluvchi model.

Algoritm:
    1. fit(careers_matrix): kasblar feature matritsasini saqlash + normalize
    2. predict(user_vector, k=5):
        - user_vector ni normalize qilish
        - har kasb bilan cosine similarity hisoblash
        - top-K kasbni ranking bo'yicha qaytarish

Cosine similarity formulasi:
    sim(u, c) = (u · c) / (||u|| · ||c||)

L2-normalize qilingan vektorlar uchun:
    sim(u, c) = u · c   (dot product)

Diplom uchun:
    - Asoslangan: oddiy lekin samarali algoritm
    - Cold-start muammosini hal qiladi (yangi foydalanuvchi uchun ham ishlaydi)
    - Interpretable: nima uchun shu kasb (top feature'lar ko'rsatiladi)
    - Baseline sifatida xizmat qiladi (collaborative filtering bilan taqqoslash)
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional

from app.ml.dataset import (
    FEATURE_DIM,
    IDX_RIASEC, IDX_CATEGORY, IDX_INTERESTS, IDX_SUBJECTS,
    RIASEC_KEYS, CATEGORY_KEYS, INTEREST_KEYS, SUBJECT_KEYS,
    build_career_feature_matrix, user_profile_to_vector,
)


# ============================================================
# Model
# ============================================================

class ContentBasedRecommender:
    """Cosine similarity asosli kasb tavsiya tizimi.

    Atributlar:
        careers_df_      — Kasblar DataFrame (fit'dan keyin)
        X_careers_       — Kasblar feature matrix, shape (N_careers, D)
        X_careers_norm_  — L2-normalized versiya (tezroq dot product uchun)
        is_fitted_       — Modelning o'qitilgan-o'qitilmaganligi
    """

    def __init__(self):
        self.careers_df_: Optional[pd.DataFrame] = None
        self.X_careers_: Optional[np.ndarray] = None
        self.X_careers_norm_: Optional[np.ndarray] = None
        self.is_fitted_: bool = False

    # ------------------------------------------------------------
    # Fit
    # ------------------------------------------------------------
    def fit(
        self,
        careers_df: Optional[pd.DataFrame] = None,
        X_careers: Optional[np.ndarray] = None,
    ) -> "ContentBasedRecommender":
        """Modelni kasblar feature matritsasiga moslash.

        Args:
            careers_df: Kasblar DataFrame (None bo'lsa load_careers() ishlatiladi)
            X_careers: Feature matrix (None bo'lsa build_career_feature_matrix())

        Returns:
            self (chaining uchun)
        """
        if X_careers is None or careers_df is None:
            X_careers, careers_df = build_career_feature_matrix(careers_df)

        if X_careers.shape[1] != FEATURE_DIM:
            raise ValueError(
                f"X_careers feature dim {X_careers.shape[1]} != expected {FEATURE_DIM}"
            )

        self.careers_df_ = careers_df.reset_index(drop=True)
        self.X_careers_ = X_careers.astype(np.float32)
        self.X_careers_norm_ = self._l2_normalize(self.X_careers_)
        self.is_fitted_ = True
        return self

    # ------------------------------------------------------------
    # Predict
    # ------------------------------------------------------------
    def predict(
        self,
        user_vector: np.ndarray,
        k: int = 5,
        category_filter: Optional[str] = None,
    ) -> List[Dict]:
        """Foydalanuvchi profili uchun top-K kasb tavsiya qiladi.

        Args:
            user_vector: Foydalanuvchi feature vector (shape D)
            k: Tavsiya qilinadigan kasblar soni
            category_filter: Faqat shu kategoriyadan tavsiya (masalan "it")

        Returns:
            List of dicts: [{id, name, name_uz, category, score, explanation}, ...]
        """
        self._check_fitted()

        if user_vector.shape != (FEATURE_DIM,):
            raise ValueError(
                f"user_vector shape {user_vector.shape} != ({FEATURE_DIM},)"
            )

        # Foydalanuvchi vektorini normalize qilish
        user_norm = self._l2_normalize(user_vector.reshape(1, -1))[0]

        # Cosine similarity = dot product (normalize qilingan vektorlar uchun)
        scores = self.X_careers_norm_ @ user_norm  # shape (N_careers,)

        # Kategoriya filteri
        candidate_indices = np.arange(len(scores))
        if category_filter:
            cat_mask = self.careers_df_["category"].values == category_filter
            candidate_indices = candidate_indices[cat_mask]
            if len(candidate_indices) == 0:
                return []

        # Top-K
        cand_scores = scores[candidate_indices]
        top_k_idx_in_cand = np.argsort(-cand_scores)[:k]
        top_k_indices = candidate_indices[top_k_idx_in_cand]

        results = []
        for idx in top_k_indices:
            row = self.careers_df_.iloc[int(idx)]
            results.append({
                "id": int(row["id"]),
                "name": row["name"],
                "name_uz": row["name_uz"],
                "category": row["category"],
                "score": float(scores[idx]),
                "explanation": self._explain(user_vector, int(idx)),
            })
        return results

    def predict_for_profile(
        self,
        riasec_scores: dict,
        interests: list[str] | None = None,
        subjects: list[str] | None = None,
        k: int = 5,
        category_filter: Optional[str] = None,
    ) -> List[Dict]:
        """Yuqori darajadagi convenience metod: profile dict → tavsiyalar."""
        user_vec = user_profile_to_vector(
            riasec_scores=riasec_scores,
            interests=interests,
            subjects=subjects,
        )
        return self.predict(user_vec, k=k, category_filter=category_filter)

    # ------------------------------------------------------------
    # Score matrix (evaluation uchun)
    # ------------------------------------------------------------
    def score_matrix(self, X_users: np.ndarray) -> np.ndarray:
        """Foydalanuvchilar guruhi uchun barcha kasblar similarity matritsasi.

        Args:
            X_users: shape (N_users, D)

        Returns:
            shape (N_users, N_careers) — har juftlik uchun similarity score
        """
        self._check_fitted()
        X_users_norm = self._l2_normalize(X_users.astype(np.float32))
        return X_users_norm @ self.X_careers_norm_.T

    def predict_batch(
        self, X_users: np.ndarray, k: int = 5
    ) -> np.ndarray:
        """Bir nechta foydalanuvchi uchun top-K kasb id'lari.

        Returns:
            shape (N_users, k) — har qator: top-k kasb id'lari (tartibda)
        """
        self._check_fitted()
        scores = self.score_matrix(X_users)
        # argsort descending, top-k
        top_k = np.argsort(-scores, axis=1)[:, :k]
        return top_k

    # ------------------------------------------------------------
    # Explainability — nima uchun shu kasb tavsiya qilindi
    # ------------------------------------------------------------
    def _explain(self, user_vector: np.ndarray, career_idx: int) -> List[str]:
        """Foydalanuvchi va kasb o'rtasidagi eng kuchli umumiy xususiyatlar."""
        career_vec = self.X_careers_[career_idx]

        # Har feature uchun "umumiylik" = user * career (element-wise)
        common = user_vector * career_vec

        explanations = []

        # RIASEC
        riasec_common = common[IDX_RIASEC[0]:IDX_RIASEC[1]]
        top_riasec_idx = np.argsort(-riasec_common)[:2]
        for i in top_riasec_idx:
            if riasec_common[i] > 0.1:
                from app.data.taxonomies import RIASEC_NAMES
                explanations.append(
                    f"{RIASEC_NAMES[RIASEC_KEYS[i]]} moyilligi mos keldi"
                )

        # Qiziqishlar
        interest_common = common[IDX_INTERESTS[0]:IDX_INTERESTS[1]]
        matched_interests = [
            INTEREST_KEYS[i]
            for i in range(len(interest_common))
            if interest_common[i] > 0
        ]
        if matched_interests:
            from app.data.taxonomies import INTERESTS
            names = [INTERESTS.get(k, k) for k in matched_interests[:3]]
            explanations.append(f"Qiziqishlar mos: {', '.join(names)}")

        # Fanlar
        subject_common = common[IDX_SUBJECTS[0]:IDX_SUBJECTS[1]]
        matched_subjects = [
            SUBJECT_KEYS[i]
            for i in range(len(subject_common))
            if subject_common[i] > 0
        ]
        if matched_subjects:
            from app.data.taxonomies import SUBJECTS
            names = [SUBJECTS.get(k, k) for k in matched_subjects[:3]]
            explanations.append(f"Yaxshi fanlar: {', '.join(names)}")

        return explanations or ["Umumiy profil mos keldi"]

    # ------------------------------------------------------------
    # Yordamchi metodlar
    # ------------------------------------------------------------
    @staticmethod
    def _l2_normalize(X: np.ndarray) -> np.ndarray:
        """L2-normalize qatorlar bo'yicha."""
        norms = np.linalg.norm(X, axis=1, keepdims=True)
        norms[norms == 0] = 1.0  # 0-bo'lim oldini olish
        return X / norms

    def _check_fitted(self):
        if not self.is_fitted_:
            raise RuntimeError(
                "Model fit() qilinmagan. Avval `recommender.fit()` chaqiring."
            )


# ============================================================
# Tezkor diagnostika
# ============================================================

def quick_demo():
    """Modelni sinov uchun ishga tushiradi va misol natija chiqaradi."""
    print("Content-Based Recommender — quick demo\n")

    recommender = ContentBasedRecommender()
    recommender.fit()

    print(f"Kasblar yuklandi: {len(recommender.careers_df_)}")
    print(f"Feature dim: {recommender.X_careers_.shape[1]}\n")

    # Misol foydalanuvchi: IT'ga moyil, matematika va fizika yaxshi
    sample_profile = {
        "riasec_scores": {"R": 4, "I": 9, "A": 4, "S": 3, "E": 3, "C": 7},
        "interests": ["it", "fan", "musiqa"],
        "subjects": ["matematika", "informatika", "fizika"],
    }

    print(f"Foydalanuvchi profili:")
    print(f"  RIASEC: {sample_profile['riasec_scores']}")
    print(f"  Qiziqishlar: {sample_profile['interests']}")
    print(f"  Fanlar: {sample_profile['subjects']}\n")

    results = recommender.predict_for_profile(**sample_profile, k=5)

    print("Top 5 tavsiya:")
    for i, r in enumerate(results, 1):
        print(f"  {i}. {r['name_uz']} ({r['category']})")
        print(f"     Score: {r['score']:.3f}")
        for ex in r["explanation"]:
            print(f"     - {ex}")
        print()


if __name__ == "__main__":
    quick_demo()
