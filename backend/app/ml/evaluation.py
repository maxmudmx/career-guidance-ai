"""
Recommender System uchun baholash metrikalari.

Metrikalar:
    - precision_at_k    — Top-K dagi to'g'ri tavsiyalar foizi
    - recall_at_k       — Mos kasblarning qancha qismi top-K'ga tushdi
    - hit_rate_at_k     — Top-K da kamida 1 ta to'g'ri tavsiya bormi
    - mrr               — Mean Reciprocal Rank (birinchi to'g'ri tavsiya pozitsiyasi)
    - ndcg_at_k         — Normalized Discounted Cumulative Gain (tartib sifati)
    - coverage          — Modelning qancha kasbni tavsiya qila olishi
    - diversity         — Tavsiyalar xilma-xilligi (intra-list distance)

Diplom himoyasida ko'rsatish uchun:
    - 4-5 ta modelni bir xil metrikalar bo'yicha taqqoslash
    - K = 1, 3, 5, 10 uchun grafik
    - Train/test split bo'yicha cross-validation

Manbalar:
    - Cremonesi et al. (2010) — Performance of Recommender Algorithms on Top-N Recommendation Tasks
    - Jarvelin & Kekalainen (2002) — Cumulated Gain-Based Evaluation of IR Techniques
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Dict, List


# ============================================================
# Asosiy metrikalar
# ============================================================

def precision_at_k(
    recommended: np.ndarray,
    relevant: np.ndarray,
    k: int = 5,
) -> float:
    """Precision@K — top-K tavsiyalardan qanchasi mos.

    Args:
        recommended: shape (N_users, k) — har user uchun top-k tavsiya id'lari
        relevant:    shape (N_users,) yoki (N_users, M) — to'g'ri kasblar
                     1D bo'lsa — har user bitta to'g'ri javob (sintetik holat)
                     2D bo'lsa — har user bir nechta to'g'ri kasblar (real holat)
        k: nechta top tavsiya hisobga olinadi

    Returns:
        O'rtacha precision (0-1).
    """
    recommended = recommended[:, :k]
    if relevant.ndim == 1:
        # Sintetik: har user — 1 ta to'g'ri javob
        hits = (recommended == relevant[:, None]).any(axis=1)
        return float(hits.mean()) / k * k  # = hits.mean() (faqat 0/1)
    else:
        # Real: har user — bir nechta to'g'ri javob
        hits = np.array([
            len(set(rec).intersection(set(rel[rel >= 0])))
            for rec, rel in zip(recommended, relevant)
        ])
        return float((hits / k).mean())


def recall_at_k(
    recommended: np.ndarray,
    relevant: np.ndarray,
    k: int = 5,
) -> float:
    """Recall@K — mos kasblarning qancha qismi top-K'ga tushdi."""
    recommended = recommended[:, :k]
    if relevant.ndim == 1:
        hits = (recommended == relevant[:, None]).any(axis=1)
        return float(hits.mean())  # 1 ta relevant → recall = hit rate
    else:
        recalls = []
        for rec, rel in zip(recommended, relevant):
            rel_set = set(rel[rel >= 0])
            if not rel_set:
                continue
            hits = len(rel_set.intersection(set(rec)))
            recalls.append(hits / len(rel_set))
        return float(np.mean(recalls)) if recalls else 0.0


def hit_rate_at_k(
    recommended: np.ndarray,
    relevant: np.ndarray,
    k: int = 5,
) -> float:
    """Hit Rate@K — top-K da kamida 1 ta to'g'ri tavsiya bo'lgan userlar foizi."""
    recommended = recommended[:, :k]
    if relevant.ndim == 1:
        hits = (recommended == relevant[:, None]).any(axis=1)
    else:
        hits = np.array([
            len(set(rec).intersection(set(rel[rel >= 0]))) > 0
            for rec, rel in zip(recommended, relevant)
        ])
    return float(hits.mean())


def mean_reciprocal_rank(
    recommended: np.ndarray,
    relevant: np.ndarray,
) -> float:
    """MRR — birinchi to'g'ri tavsiyaning teskari pozitsiyasi o'rtachasi.

    Formula: MRR = mean(1 / rank_of_first_relevant)
    Agar top-K da to'g'ri javob bo'lmasa → 0.
    """
    rrs = []
    if relevant.ndim == 1:
        for rec, rel in zip(recommended, relevant):
            positions = np.where(rec == rel)[0]
            rrs.append(1.0 / (positions[0] + 1) if len(positions) else 0.0)
    else:
        for rec, rel in zip(recommended, relevant):
            rel_set = set(rel[rel >= 0])
            for pos, item in enumerate(rec):
                if item in rel_set:
                    rrs.append(1.0 / (pos + 1))
                    break
            else:
                rrs.append(0.0)
    return float(np.mean(rrs))


def ndcg_at_k(
    recommended: np.ndarray,
    relevant: np.ndarray,
    k: int = 5,
) -> float:
    """NDCG@K — Normalized Discounted Cumulative Gain.

    Tartib sifatini o'lchaydi: yuqori pozitsiyadagi to'g'ri javob ko'proq baholanadi.

    Formula:
        DCG@K = sum_i rel_i / log2(i + 2)
        IDCG@K = max possible DCG (ideal tartib)
        NDCG@K = DCG@K / IDCG@K
    """
    recommended = recommended[:, :k]
    ndcgs = []

    for rec, rel in zip(recommended, relevant):
        if np.isscalar(rel) or (hasattr(rel, "ndim") and rel.ndim == 0):
            rel_set = {int(rel)}
        else:
            rel_set = set(rel[rel >= 0]) if hasattr(rel, "__iter__") else {int(rel)}

        # DCG
        gains = np.array([1.0 if item in rel_set else 0.0 for item in rec])
        discounts = 1.0 / np.log2(np.arange(len(gains)) + 2)
        dcg = (gains * discounts).sum()

        # IDCG (ideal — barcha to'g'ri javoblar boshda)
        n_rel = min(len(rel_set), k)
        if n_rel == 0:
            ndcgs.append(0.0)
            continue
        ideal_gains = np.array([1.0] * n_rel + [0.0] * (k - n_rel))
        idcg = (ideal_gains * discounts).sum()

        ndcgs.append(dcg / idcg if idcg > 0 else 0.0)

    return float(np.mean(ndcgs))


# ============================================================
# Qo'shimcha metrikalar
# ============================================================

def coverage(recommended: np.ndarray, n_items: int) -> float:
    """Coverage — barcha kasblardan qanchasi hech bo'lmaganda 1 marta tavsiya qilingan.

    Returns: 0-1 oraliqda.
    """
    unique_items = np.unique(recommended)
    return len(unique_items) / n_items


def diversity(
    recommended: np.ndarray,
    X_items: np.ndarray,
    k: int = 5,
) -> float:
    """Diversity — har user uchun top-K tavsiyalar orasidagi o'rtacha masofa.

    Yuqoriroq qiymat — xilma-xil tavsiyalar.
    """
    diversities = []
    for rec in recommended[:, :k]:
        vecs = X_items[rec]
        # Pairwise cosine distance = 1 - similarity
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        vecs_norm = vecs / norms
        sim_matrix = vecs_norm @ vecs_norm.T
        # Faqat upper triangle (i < j)
        n = len(rec)
        if n < 2:
            continue
        i, j = np.triu_indices(n, k=1)
        avg_dist = float((1.0 - sim_matrix[i, j]).mean())
        diversities.append(avg_dist)
    return float(np.mean(diversities)) if diversities else 0.0


# ============================================================
# Hammasini birga — diplom hisoboti uchun
# ============================================================

def evaluate_all(
    recommended: np.ndarray,
    relevant: np.ndarray,
    n_items: int,
    X_items: np.ndarray | None = None,
    k_values: List[int] = (1, 3, 5, 10),
) -> Dict[str, float]:
    """Barcha metrikalarni bir necha K qiymati uchun hisoblaydi.

    Returns:
        Dict, masalan:
            {
                'precision@1': 0.42, 'precision@3': 0.61, ...,
                'recall@5':    0.68, 'ndcg@5':      0.71,
                'mrr':         0.55, 'coverage':    0.83,
                'diversity@5': 0.42,
            }
    """
    metrics = {}
    max_k = max(k_values)

    for k in k_values:
        metrics[f"precision@{k}"] = precision_at_k(recommended, relevant, k=k)
        metrics[f"recall@{k}"] = recall_at_k(recommended, relevant, k=k)
        metrics[f"hit_rate@{k}"] = hit_rate_at_k(recommended, relevant, k=k)
        metrics[f"ndcg@{k}"] = ndcg_at_k(recommended, relevant, k=k)

    metrics["mrr"] = mean_reciprocal_rank(recommended[:, :max_k], relevant)
    metrics["coverage"] = coverage(recommended[:, :max_k], n_items)

    if X_items is not None:
        metrics["diversity@5"] = diversity(recommended, X_items, k=5)

    return metrics


# ============================================================
# Baseline'lar — solishtirish uchun
# ============================================================

def random_baseline(n_users: int, n_items: int, k: int, seed: int = 42) -> np.ndarray:
    """Tasodifiy tavsiya (eng past baseline)."""
    rng = np.random.default_rng(seed)
    return np.array([rng.choice(n_items, size=k, replace=False) for _ in range(n_users)])


def popularity_baseline(
    n_users: int, y_train: np.ndarray, n_items: int, k: int,
) -> np.ndarray:
    """Eng mashhur k kasbni hammaga tavsiya qilish."""
    counts = np.bincount(y_train, minlength=n_items)
    top_k = np.argsort(-counts)[:k]
    return np.tile(top_k, (n_users, 1))


# ============================================================
# Hisobot jadval
# ============================================================

def metrics_table(
    results: Dict[str, Dict[str, float]],
) -> pd.DataFrame:
    """Bir nechta modelning natijalarini taqqoslash jadvalini qaytaradi.

    Args:
        results: {'Random': {...}, 'Content-Based': {...}, 'CF': {...}}

    Returns:
        DataFrame, satrlar = metrikalar, ustunlar = modellar.
    """
    return pd.DataFrame(results).round(4)
