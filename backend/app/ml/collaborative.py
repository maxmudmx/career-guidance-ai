"""
Collaborative Filtering Recommender — NMF (Non-negative Matrix Factorization).

Algoritm:
    1. Train foydalanuvchilarning preferences user-item matritsasi quriladi
       M[i, j] = 1 agar user i kasb j ni tanlagan, aks holda 0
    2. NMF (yoki TruncatedSVD) bilan past o'lchamga proyeksiya:
       M ≈ U × V^T,   U: (N_users, k),   V: (N_items, k)
    3. Yangi (cold-start) foydalanuvchi uchun:
       - Profile vektoridan eng yaqin k ta train userni topish (content cosine)
       - Ularning U faktorlarini o'rtachalash → test user U faktori
       - Score = U_test @ V^T

Cold-start muammosi:
    Collaborative Filtering yangi foydalanuvchilar uchun ishlamaydi
    (chunki ular hali biror kasb tanlamagan). Bu joyda content profilini
    ishlatib "fold-in" qilamiz — bu CF + Content gibridining birinchi qadami.

Manbalar:
    - Koren, Bell, Volinsky (2009) — Matrix Factorization Techniques for Recommender Systems
    - Lee & Seung (1999) — Algorithms for Non-negative Matrix Factorization
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Optional, List, Dict
from sklearn.decomposition import NMF, TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

from app.ml.dataset import FEATURE_DIM, build_career_feature_matrix


class CollaborativeRecommender:
    """NMF/SVD asosli kollaborativ tavsiya tizimi.

    Atributlar:
        method               — "nmf" yoki "svd"
        n_components         — yashirin (latent) faktorlar soni
        U_                   — train user faktorlari, shape (N_train_users, k)
        V_                   — item faktorlari, shape (N_items, k)
        X_train_content_     — train userlarning content vektorlari (fold-in uchun)
        n_neighbors_         — cold-start uchun nechta qo'shni olinadi
    """

    def __init__(
        self,
        n_components: int = 20,
        method: str = "nmf",
        n_neighbors: int = 10,
        random_state: int = 42,
    ):
        if method not in ("nmf", "svd"):
            raise ValueError(f"method must be 'nmf' or 'svd', got {method}")
        self.n_components = n_components
        self.method = method
        self.n_neighbors_ = n_neighbors
        self.random_state = random_state

        self.U_: Optional[np.ndarray] = None
        self.V_: Optional[np.ndarray] = None
        self.X_train_content_: Optional[np.ndarray] = None
        self.n_items_: Optional[int] = None
        self.is_fitted_: bool = False

    # ------------------------------------------------------------
    # Fit
    # ------------------------------------------------------------
    def fit(
        self,
        X_train_content: np.ndarray,
        y_train: np.ndarray,
        n_items: int,
    ) -> "CollaborativeRecommender":
        """Modelni o'qitish.

        Args:
            X_train_content: shape (N_train, D) — train user content vektorlari
                             (cold-start fold-in uchun saqlanadi)
            y_train:         shape (N_train,) — har user uchun ideal kasb id
            n_items:         barcha kasblar soni (matritsa kengligi)
        """
        n_users = len(y_train)
        self.n_items_ = n_items

        # User-item matritsani qurish (one-hot interactions)
        # M[i, y[i]] = 1, qolgan 0
        M = np.zeros((n_users, n_items), dtype=np.float32)
        M[np.arange(n_users), y_train] = 1.0

        # Past o'lchamga proyeksiya
        if self.method == "nmf":
            model = NMF(
                n_components=self.n_components,
                init="nndsvd",
                max_iter=300,
                random_state=self.random_state,
            )
            self.U_ = model.fit_transform(M)        # (N_users, k)
            self.V_ = model.components_.T           # (N_items, k)
        else:  # svd
            model = TruncatedSVD(
                n_components=self.n_components,
                random_state=self.random_state,
            )
            self.U_ = model.fit_transform(M)        # (N_users, k)
            self.V_ = model.components_.T           # (N_items, k)

        # Cold-start fold-in uchun train content vektorlarini saqlash
        self.X_train_content_ = X_train_content.astype(np.float32)

        self.is_fitted_ = True
        return self

    # ------------------------------------------------------------
    # Cold-start: yangi user uchun U faktorini fold-in qilish
    # ------------------------------------------------------------
    def _fold_in_new_user(self, x_user_content: np.ndarray) -> np.ndarray:
        """Yangi foydalanuvchi uchun yashirin faktor vektorini hisoblash.

        Strategiya: content bo'yicha eng yaqin k ta train userni topish
        va ularning U faktorlarini cosine similarity bilan tortish.

        Args:
            x_user_content: shape (D,) — yangi user content vektori

        Returns:
            shape (k,) — yashirin faktor vektor
        """
        # Cosine similarity train userlar bilan
        sims = cosine_similarity(
            x_user_content.reshape(1, -1),
            self.X_train_content_,
        )[0]  # shape (N_train,)

        # Top-k qo'shnilar
        top_idx = np.argsort(-sims)[: self.n_neighbors_]
        top_sims = sims[top_idx]

        # Salbiy o'xshashlikni 0 ga tushirish (NMF uchun)
        weights = np.clip(top_sims, 0, None)
        if weights.sum() == 0:
            weights = np.ones_like(weights)

        # Tortilgan o'rtacha
        u_new = (weights[:, None] * self.U_[top_idx]).sum(axis=0) / weights.sum()
        return u_new

    # ------------------------------------------------------------
    # Predict
    # ------------------------------------------------------------
    def predict_scores(self, x_user_content: np.ndarray) -> np.ndarray:
        """Bitta yangi foydalanuvchi uchun barcha kasblar scorelarini hisoblash.

        Returns:
            shape (N_items,) — har kasb uchun preference score
        """
        self._check_fitted()
        u_new = self._fold_in_new_user(x_user_content)
        scores = u_new @ self.V_.T
        return scores

    def predict_batch(
        self, X_test_content: np.ndarray, k: int = 5,
    ) -> np.ndarray:
        """Bir nechta foydalanuvchi uchun top-k kasb id'lari.

        Returns:
            shape (N_test, k)
        """
        self._check_fitted()
        results = []
        for x in X_test_content:
            scores = self.predict_scores(x)
            top_k = np.argsort(-scores)[:k]
            results.append(top_k)
        return np.array(results)

    def score_matrix(self, X_test_content: np.ndarray) -> np.ndarray:
        """Test userlar uchun to'liq (N_test, N_items) score matritsasi.

        Hybrid modelda ishlatish uchun foydali.
        """
        self._check_fitted()
        scores = np.zeros((len(X_test_content), self.n_items_), dtype=np.float32)
        for i, x in enumerate(X_test_content):
            scores[i] = self.predict_scores(x)
        return scores

    # ------------------------------------------------------------
    # Yordamchi
    # ------------------------------------------------------------
    def _check_fitted(self):
        if not self.is_fitted_:
            raise RuntimeError("Model fit() qilinmagan.")


# ============================================================
# Tezkor diagnostika
# ============================================================

def quick_demo():
    """Modelni sinash uchun."""
    from app.ml.dataset import generate_synthetic_users

    print("Collaborative Filtering (NMF) — quick demo\n")

    # Dataset
    users_df, X_users, y = generate_synthetic_users(n_users=500, seed=42)
    _, careers_df = build_career_feature_matrix()
    n_items = len(careers_df)

    # 80/20 split (oddiy)
    n = len(X_users)
    n_train = int(n * 0.8)
    rng = np.random.default_rng(42)
    idx = rng.permutation(n)
    train_idx, test_idx = idx[:n_train], idx[n_train:]

    X_train, X_test = X_users[train_idx], X_users[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]

    print(f"Train: {len(X_train)}, Test: {len(X_test)}")
    print(f"Items: {n_items}\n")

    # NMF
    cf_nmf = CollaborativeRecommender(n_components=30, method="nmf", n_neighbors=10)
    cf_nmf.fit(X_train, y_train, n_items=n_items)

    # SVD
    cf_svd = CollaborativeRecommender(n_components=30, method="svd", n_neighbors=10)
    cf_svd.fit(X_train, y_train, n_items=n_items)

    # Sinov: birinchi 3 ta test user
    print("Misol bashoratlar (birinchi 3 ta test user):\n")
    for i in range(3):
        true_career = careers_df.iloc[int(y_test[i])]
        print(f"  Test user #{i}")
        print(f"    Haqiqiy kasb: {true_career['name_uz']}")

        for name, cf in [("NMF", cf_nmf), ("SVD", cf_svd)]:
            top5 = cf.predict_batch(X_test[i:i+1], k=5)[0]
            hit = "OK" if y_test[i] in top5 else "X"
            print(f"    {name} top-5:")
            for j, item_id in enumerate(top5, 1):
                marker = " <-- TO'G'RI" if item_id == y_test[i] else ""
                print(f"       {j}. {careers_df.iloc[int(item_id)]['name_uz']}{marker}")
            print(f"    [{hit}]")
        print()


if __name__ == "__main__":
    quick_demo()
