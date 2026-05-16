"""
Modellarni o'qitish va baholash skripti (end-to-end pipeline).

Bajariladigan amallar:
    1. Sintetik dataset yaratish (500 user × 305 kasb)
    2. Train/test split (80/20, stratified by career)
    3. 3 ta modelni o'qitish:
        - Random baseline
        - Popularity baseline
        - Content-Based (cosine similarity)
    4. K = 1, 3, 5, 10 uchun metrikalarni hisoblash
    5. Natijalarni taqqoslab jadvalda chiqarish
    6. Eng yaxshi modelni `career_recommender.pkl` ga saqlash

Ishga tushirish (backend/ dan):
    python -m app.ml.train

Diplom uchun:
    - Bu jadval himoyada to'g'ridan-to'g'ri ko'rsatiladi
    - Har metrika ma'nosini tushuntirish
    - Content-Based vs baseline farqini ko'rsatish
"""

from __future__ import annotations

import os
import sys
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

# Path setup — backend/ dan import qilish uchun
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.ml.dataset import (
    generate_synthetic_users,
    build_career_feature_matrix,
    load_careers,
)
from app.ml.content_based import ContentBasedRecommender
from app.ml.evaluation import (
    evaluate_all,
    random_baseline,
    popularity_baseline,
    metrics_table,
)


# ============================================================
# Konfiguratsiya
# ============================================================
CONFIG = {
    "n_users": 1500,        # sintetik foydalanuvchilar
    "noise": 0.15,          # ideal kasb vektoriga shovqin
    "test_size": 0.2,       # 20% test uchun
    "k_values": [1, 3, 5, 10],
    "seed": 42,
    "model_path": Path(__file__).parent / "saved" / "content_based.pkl",
}


# ============================================================
# Train/test split — stratified by career
# ============================================================

def stratified_split(X, y, test_size=0.2, seed=42):
    """Har kasbdan teng nisbatda train/test ga bo'lish."""
    rng = np.random.default_rng(seed)
    train_idx, test_idx = [], []

    for career_id in np.unique(y):
        idx = np.where(y == career_id)[0]
        rng.shuffle(idx)
        n_test = max(1, int(len(idx) * test_size))
        test_idx.extend(idx[:n_test])
        train_idx.extend(idx[n_test:])

    train_idx = np.array(train_idx)
    test_idx = np.array(test_idx)
    return X[train_idx], X[test_idx], y[train_idx], y[test_idx]


# ============================================================
# Asosiy pipeline
# ============================================================

def main():
    print("=" * 70)
    print("ML Recommender System — o'qitish va baholash pipeline")
    print("=" * 70)

    # 1. Dataset
    print("\n[1/4] Sintetik dataset yaratilmoqda...")
    users_df, X_users, y = generate_synthetic_users(
        n_users=CONFIG["n_users"],
        noise=CONFIG["noise"],
        seed=CONFIG["seed"],
    )
    print(f"      Foydalanuvchilar: {len(X_users)}")
    print(f"      Feature dim:      {X_users.shape[1]}")
    print(f"      Unique careers:   {len(np.unique(y))}")

    # 2. Train/test split
    print("\n[2/4] Train/test split (stratified)...")
    X_train, X_test, y_train, y_test = stratified_split(
        X_users, y, test_size=CONFIG["test_size"], seed=CONFIG["seed"]
    )
    print(f"      Train: {len(X_train)} | Test: {len(X_test)}")

    # 3. Kasblar (item) matritsasi
    X_careers, careers_df = build_career_feature_matrix()
    n_items = len(careers_df)
    max_k = max(CONFIG["k_values"])

    # 4. Modellarni o'qitish va baholash
    print("\n[3/4] Modellarni o'qitish va test'da baholash...\n")
    results = {}

    # 4.1 Random baseline
    print("  ->Random baseline...")
    pred_random = random_baseline(
        n_users=len(X_test), n_items=n_items, k=max_k, seed=CONFIG["seed"]
    )
    results["Random"] = evaluate_all(
        pred_random, y_test, n_items=n_items, X_items=X_careers, k_values=CONFIG["k_values"]
    )

    # 4.2 Popularity baseline
    print("  ->Popularity baseline...")
    pred_pop = popularity_baseline(
        n_users=len(X_test), y_train=y_train, n_items=n_items, k=max_k
    )
    results["Popularity"] = evaluate_all(
        pred_pop, y_test, n_items=n_items, X_items=X_careers, k_values=CONFIG["k_values"]
    )

    # 4.3 Content-Based (asosiy model)
    print("  ->Content-Based (cosine similarity)...")
    cb = ContentBasedRecommender()
    cb.fit(careers_df=careers_df, X_careers=X_careers)
    pred_cb = cb.predict_batch(X_test, k=max_k)
    results["Content-Based"] = evaluate_all(
        pred_cb, y_test, n_items=n_items, X_items=X_careers, k_values=CONFIG["k_values"]
    )

    # 5. Jadval
    print("\n[4/4] Natijalar:\n")
    table = metrics_table(results)
    print(table.to_string())

    # Eng yaxshi modelni saqlash
    CONFIG["model_path"].parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(cb, CONFIG["model_path"])
    print(f"\nModel saqlandi: {CONFIG['model_path']}")

    # Diplom uchun qisqacha xulosa
    print("\n" + "=" * 70)
    print("XULOSA (diplom uchun):")
    print("=" * 70)
    p5_random = results["Random"]["precision@5"]
    p5_pop = results["Popularity"]["precision@5"]
    p5_cb = results["Content-Based"]["precision@5"]
    print(f"  Precision@5:")
    print(f"    Random:        {p5_random:.4f}  (taxminan 1/N)")
    print(f"    Popularity:    {p5_pop:.4f}")
    print(f"    Content-Based: {p5_cb:.4f}  <- {p5_cb/max(p5_random, 1e-6):.1f}x random'dan yaxshi")
    print()
    h5_cb = results["Content-Based"]["hit_rate@5"]
    print(f"  Hit Rate@5: {h5_cb:.2%}")
    print(f"    Ya'ni: 100 foydalanuvchidan {int(h5_cb*100)} tasiga to'g'ri kasb top-5'da bor")
    print()
    print(f"  NDCG@5 (tartib sifati):")
    for name, r in results.items():
        print(f"    {name:15s} {r['ndcg@5']:.4f}")

    return results, table


if __name__ == "__main__":
    main()
