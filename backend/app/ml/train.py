"""
Modellarni o'qitish va baholash skripti (end-to-end pipeline).

Bajariladigan amallar:
    1. Sintetik dataset yaratish (~1500 user × 303 kasb)
    2. Train/val/test split (60/20/20, stratified by career)
    3. 5 ta modelni o'qitish va taqqoslash:
        - Random baseline
        - Popularity baseline
        - Content-Based (cosine similarity)
        - Collaborative Filtering (NMF/SVD)
        - Hybrid (Content + CF, α tunelangan)
    4. K = 1, 3, 5, 10 uchun barcha metrikalar
    5. Alpha-tuning (gibrid uchun)
    6. Eng yaxshi model `saved/hybrid.pkl` ga saqlanadi

Ishga tushirish (backend/ dan):
    python -m app.ml.train

Diplom himoyasida ko'rsatiladigan jadval shu skript natijasi.
"""

from __future__ import annotations

import sys
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.ml.dataset import generate_synthetic_users, build_career_feature_matrix
from app.ml.content_based import ContentBasedRecommender
from app.ml.collaborative import CollaborativeRecommender
from app.ml.hybrid import HybridRecommender, alpha_sweep
from app.ml.evaluation import (
    evaluate_all, random_baseline, popularity_baseline, metrics_table,
)


# ============================================================
# Konfiguratsiya
# ============================================================
CONFIG = {
    "n_users": 1500,
    "noise": 0.15,
    "val_size": 0.2,
    "test_size": 0.2,
    "k_values": [1, 3, 5, 10],
    "cf_n_components": 30,
    "cf_n_neighbors": 10,
    "seed": 42,
    "saved_dir": Path(__file__).parent / "saved",
}


def stratified_split(X, y, test_size=0.2, seed=42):
    """Har kasbdan teng nisbatda train/test ga bo'lish."""
    rng = np.random.default_rng(seed)
    train_idx, test_idx = [], []
    for cid in np.unique(y):
        idx = np.where(y == cid)[0]
        rng.shuffle(idx)
        n_test = max(1, int(len(idx) * test_size))
        test_idx.extend(idx[:n_test])
        train_idx.extend(idx[n_test:])
    return np.array(train_idx), np.array(test_idx)


def main():
    print("=" * 78)
    print("ML Recommender System - o'qitish va baholash pipeline")
    print("=" * 78)

    # 1. Dataset
    print("\n[1/5] Sintetik dataset yaratilmoqda...")
    users_df, X_users, y = generate_synthetic_users(
        n_users=CONFIG["n_users"],
        noise=CONFIG["noise"],
        seed=CONFIG["seed"],
    )
    print(f"      Foydalanuvchilar: {len(X_users)}")
    print(f"      Feature dim:      {X_users.shape[1]}")
    print(f"      Unique careers:   {len(np.unique(y))}")

    # 2. Train / Val / Test split
    print("\n[2/5] Train / Val / Test split (60/20/20, stratified)...")
    train_idx, test_idx = stratified_split(
        X_users, y, test_size=CONFIG["test_size"], seed=CONFIG["seed"]
    )
    X_trainval, X_test = X_users[train_idx], X_users[test_idx]
    y_trainval, y_test = y[train_idx], y[test_idx]

    trainval_train_idx, val_idx = stratified_split(
        X_trainval, y_trainval, test_size=CONFIG["val_size"] / (1 - CONFIG["test_size"]),
        seed=CONFIG["seed"] + 1,
    )
    X_train, X_val = X_trainval[trainval_train_idx], X_trainval[val_idx]
    y_train, y_val = y_trainval[trainval_train_idx], y_trainval[val_idx]
    print(f"      Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")

    # 3. Kasblar (item) matritsasi
    X_careers, careers_df = build_career_feature_matrix()
    n_items = len(careers_df)
    max_k = max(CONFIG["k_values"])

    # 4. Modellarni o'qitish va test'da baholash
    print("\n[3/5] Modellarni o'qitish va baholash...\n")
    results = {}

    # Random
    print("  -> Random baseline...")
    pred = random_baseline(len(X_test), n_items, k=max_k, seed=CONFIG["seed"])
    results["Random"] = evaluate_all(pred, y_test, n_items, X_careers, CONFIG["k_values"])

    # Popularity
    print("  -> Popularity baseline...")
    pred = popularity_baseline(len(X_test), y_train, n_items, k=max_k)
    results["Popularity"] = evaluate_all(pred, y_test, n_items, X_careers, CONFIG["k_values"])

    # Content-Based
    print("  -> Content-Based (cosine similarity)...")
    cb = ContentBasedRecommender().fit(careers_df=careers_df, X_careers=X_careers)
    pred = cb.predict_batch(X_test, k=max_k)
    results["Content-Based"] = evaluate_all(pred, y_test, n_items, X_careers, CONFIG["k_values"])

    # Collaborative (NMF)
    print("  -> Collaborative (NMF)...")
    cf_nmf = CollaborativeRecommender(
        n_components=CONFIG["cf_n_components"],
        method="nmf",
        n_neighbors=CONFIG["cf_n_neighbors"],
    ).fit(X_train, y_train, n_items=n_items)
    pred = cf_nmf.predict_batch(X_test, k=max_k)
    results["CF-NMF"] = evaluate_all(pred, y_test, n_items, X_careers, CONFIG["k_values"])

    # Collaborative (SVD)
    print("  -> Collaborative (SVD)...")
    cf_svd = CollaborativeRecommender(
        n_components=CONFIG["cf_n_components"],
        method="svd",
        n_neighbors=CONFIG["cf_n_neighbors"],
    ).fit(X_train, y_train, n_items=n_items)
    pred = cf_svd.predict_batch(X_test, k=max_k)
    results["CF-SVD"] = evaluate_all(pred, y_test, n_items, X_careers, CONFIG["k_values"])

    # 5. Alpha tuning (validation to'plamida)
    print("\n[4/5] Hybrid alpha tuning (validation to'plamida)...")
    alphas = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    alpha_df = alpha_sweep(
        careers_df, X_careers, X_train, y_train, X_val, y_val,
        alphas=alphas, k=5, metric="ndcg@5",
    )
    print(alpha_df.to_string(index=False))
    best_alpha = alpha_df.loc[alpha_df["ndcg@5"].idxmax(), "alpha"]
    print(f"\n      Best alpha: {best_alpha}")

    # Hybrid (eng yaxshi alpha bilan)
    print(f"\n  -> Hybrid (alpha={best_alpha})...")
    hybrid = HybridRecommender(
        alpha=best_alpha,
        cf_n_components=CONFIG["cf_n_components"],
    ).fit(careers_df, X_careers, X_train, y_train)
    pred = hybrid.predict_batch(X_test, k=max_k)
    results["Hybrid"] = evaluate_all(pred, y_test, n_items, X_careers, CONFIG["k_values"])

    # 6. Yakuniy jadval
    print("\n[5/5] Yakuniy natijalar:\n")
    table = metrics_table(results)
    print(table.to_string())

    # Modelni saqlash
    CONFIG["saved_dir"].mkdir(parents=True, exist_ok=True)
    joblib.dump(cb, CONFIG["saved_dir"] / "content_based.pkl")
    joblib.dump(hybrid, CONFIG["saved_dir"] / "hybrid.pkl")
    print(f"\nModellar saqlandi: {CONFIG['saved_dir']}")

    # Diplom uchun xulosa
    print("\n" + "=" * 78)
    print("XULOSA (diplom himoyasi uchun):")
    print("=" * 78)
    for k in [1, 5, 10]:
        print(f"\n  Top-{k} natijalar:")
        for name, r in results.items():
            print(f"    {name:18s}  P@{k}={r[f'precision@{k}']:.4f}  "
                  f"NDCG@{k}={r[f'ndcg@{k}']:.4f}  Hit={r[f'hit_rate@{k}']:.4f}")

    print(f"\n  Coverage (model qancha kasbni tavsiya qila oladi):")
    for name, r in results.items():
        print(f"    {name:18s}  {r['coverage']:.2%}")

    print(f"\n  MRR (birinchi to'g'ri javob pozitsiyasi):")
    for name, r in results.items():
        print(f"    {name:18s}  {r['mrr']:.4f}")

    print(f"\n  Diversity@5 (tavsiyalar xilma-xilligi):")
    for name, r in results.items():
        if "diversity@5" in r:
            print(f"    {name:18s}  {r['diversity@5']:.4f}")

    return results, table, alpha_df


if __name__ == "__main__":
    main()
