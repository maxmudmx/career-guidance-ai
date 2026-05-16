"""
Diplom uchun analiz va vizualizatsiya skripti.

Ishlatadi:
    python -m app.ml.analysis

Yaratadigan fayllar (notebooks/figures/):
    01_riasec_distribution.png    — kasblar bo'yicha RIASEC profili
    02_category_counts.png        — har kategoriyada kasblar soni
    03_models_comparison.png      — barcha modellar metrikalari
    04_precision_at_k_curve.png   — Precision@K egri chizig'i
    05_alpha_tuning.png           — Hybrid alpha sweep
    06_career_umap.png            — UMAP 2D vizualizatsiyasi
    07_confusion_matrix.png       — top-1 confusion (kategoriya bo'yicha)
    08_explanation_examples.png   — explainability vizualizatsiyasi

Diplomda foydalaning:
    - 2-bob (Metodologiya) — RIASEC distribution, category counts
    - 3-bob (Eksperimentlar) — models comparison, Precision@K, alpha tuning
    - 3-bob (Tahlil) — UMAP, confusion matrix
    - Ilovalar — explanation examples
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import TruncatedSVD

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.ml.dataset import (
    load_careers, build_career_feature_matrix,
    generate_synthetic_users,
    RIASEC_KEYS,
)
from app.ml.content_based import ContentBasedRecommender
from app.ml.collaborative import CollaborativeRecommender
from app.ml.hybrid import HybridRecommender, alpha_sweep
from app.ml.evaluation import (
    evaluate_all, random_baseline, popularity_baseline,
    precision_at_k, recall_at_k, ndcg_at_k,
)
from app.ml.train import stratified_split


# ============================================================
# Sozlamalar
# ============================================================
FIG_DIR = Path(__file__).resolve().parents[3] / "notebooks" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

sns.set_theme(style="whitegrid", context="notebook", font_scale=1.05)
plt.rcParams["figure.dpi"] = 100
plt.rcParams["savefig.dpi"] = 150
plt.rcParams["savefig.bbox"] = "tight"
plt.rcParams["font.family"] = "DejaVu Sans"

PALETTE = {
    "Random": "#94a3b8",
    "Popularity": "#cbd5e1",
    "Content-Based": "#3b82f6",
    "CF-NMF": "#a855f7",
    "CF-SVD": "#06b6d4",
    "Hybrid": "#10b981",
}


def save_fig(name: str):
    """Joriy figure'ni FIG_DIR ga saqlash."""
    path = FIG_DIR / name
    plt.savefig(path)
    plt.close()
    print(f"  saved: {path.relative_to(FIG_DIR.parents[1])}")


# ============================================================
# 1. RIASEC distribution
# ============================================================

def fig_riasec_distribution(careers: pd.DataFrame):
    """Har RIASEC tipi bo'yicha kasblar soni va o'rtacha qiymat."""
    fig, axes = plt.subplots(1, 2, figsize=(13, 4.5))

    # Chap: RIASEC o'rtacha qiymatlar boxplot
    riasec_long = pd.melt(
        careers[[f"riasec_{k}" for k in RIASEC_KEYS]],
        var_name="type", value_name="score",
    )
    riasec_long["type"] = riasec_long["type"].str.replace("riasec_", "")
    sns.boxplot(
        data=riasec_long, x="type", y="score",
        order=RIASEC_KEYS, palette="Blues", ax=axes[0],
    )
    axes[0].set_title("RIASEC qiymatlarining barcha kasblar bo'yicha tarqalishi")
    axes[0].set_xlabel("RIASEC tipi")
    axes[0].set_ylabel("Qiymat (0-10)")

    # O'ng: har kasb uchun dominant tip
    dominant = careers[[f"riasec_{k}" for k in RIASEC_KEYS]].idxmax(axis=1)
    dominant = dominant.str.replace("riasec_", "")
    counts = dominant.value_counts().reindex(RIASEC_KEYS, fill_value=0)
    sns.barplot(x=counts.index, y=counts.values, palette="Blues_r", ax=axes[1])
    axes[1].set_title("Kasblarning dominant RIASEC tipi bo'yicha taqsimoti")
    axes[1].set_xlabel("Dominant RIASEC tipi")
    axes[1].set_ylabel("Kasblar soni")
    for i, v in enumerate(counts.values):
        axes[1].text(i, v + 1, str(int(v)), ha="center", fontsize=9)

    plt.tight_layout()
    save_fig("01_riasec_distribution.png")


# ============================================================
# 2. Kategoriyalar bo'yicha kasblar soni
# ============================================================

def fig_category_counts(careers: pd.DataFrame):
    """Har kategoriyada kasblar soni."""
    from app.data.taxonomies import CATEGORIES

    counts = careers["category"].value_counts()
    cat_names = [CATEGORIES.get(c, c) for c in counts.index]

    fig, ax = plt.subplots(figsize=(10, 8))
    sns.barplot(x=counts.values, y=cat_names, palette="viridis", ax=ax)
    ax.set_title(f"Kasblar 30 ta soha bo'yicha taqsimoti (jami {len(careers)} ta)")
    ax.set_xlabel("Kasblar soni")
    ax.set_ylabel("")
    for i, v in enumerate(counts.values):
        ax.text(v + 0.2, i, str(int(v)), va="center", fontsize=9)
    plt.tight_layout()
    save_fig("02_category_counts.png")


# ============================================================
# 3. Modellar taqqoslash (bar chart)
# ============================================================

def fig_models_comparison(results: dict):
    """5 ta modelni asosiy metrikalar bo'yicha taqqoslash."""
    metrics_to_show = ["precision@5", "ndcg@5", "hit_rate@5", "coverage", "mrr"]
    metric_names = ["Precision@5", "NDCG@5", "Hit Rate@5", "Coverage", "MRR"]

    df = pd.DataFrame({
        m: [results[model][m] for model in results]
        for m in metrics_to_show
    }, index=list(results.keys()))

    fig, axes = plt.subplots(1, len(metrics_to_show), figsize=(18, 4.5))
    for ax, m, mn in zip(axes, metrics_to_show, metric_names):
        colors = [PALETTE.get(model, "#6b7280") for model in df.index]
        bars = ax.bar(range(len(df)), df[m].values, color=colors)
        ax.set_xticks(range(len(df)))
        ax.set_xticklabels(df.index, rotation=35, ha="right", fontsize=9)
        ax.set_title(mn, fontsize=11)
        ax.set_ylim(0, max(df[m].max() * 1.15, 0.05))
        for bar, val in zip(bars, df[m].values):
            ax.text(bar.get_x() + bar.get_width() / 2, val + 0.01,
                    f"{val:.3f}", ha="center", fontsize=8)

    plt.suptitle("5 ta modelni taqqoslash (cold-start senarisi, 303 kasb)",
                 fontsize=13, y=1.02)
    plt.tight_layout()
    save_fig("03_models_comparison.png")


# ============================================================
# 4. Precision@K egri chizig'i
# ============================================================

def fig_precision_at_k_curve(results: dict):
    """K = 1, 3, 5, 10 uchun Precision@K va NDCG@K dinamikasi."""
    ks = [1, 3, 5, 10]

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    for model_name, metrics in results.items():
        prec = [metrics[f"precision@{k}"] for k in ks]
        ndcg = [metrics[f"ndcg@{k}"] for k in ks]
        color = PALETTE.get(model_name, "#6b7280")
        axes[0].plot(ks, prec, marker="o", label=model_name, color=color, linewidth=2)
        axes[1].plot(ks, ndcg, marker="o", label=model_name, color=color, linewidth=2)

    for ax, title, ylabel in zip(
        axes,
        ["Precision@K modellar bo'yicha", "NDCG@K modellar bo'yicha"],
        ["Precision@K", "NDCG@K"],
    ):
        ax.set_xlabel("K (top-K tavsiyalar)")
        ax.set_ylabel(ylabel)
        ax.set_title(title)
        ax.set_xticks(ks)
        ax.legend(loc="best", fontsize=9)
        ax.set_ylim(0, 1.05)

    plt.tight_layout()
    save_fig("04_precision_at_k_curve.png")


# ============================================================
# 5. Hybrid alpha tuning
# ============================================================

def fig_alpha_tuning(alpha_df: pd.DataFrame):
    """Alpha qiymati bo'yicha gibrid modelning sifati."""
    fig, ax = plt.subplots(figsize=(10, 5.5))

    for metric, color in [
        ("precision@5", "#3b82f6"),
        ("recall@5", "#06b6d4"),
        ("ndcg@5", "#10b981"),
    ]:
        ax.plot(alpha_df["alpha"], alpha_df[metric],
                marker="o", linewidth=2, label=metric, color=color)

    best_alpha = alpha_df.loc[alpha_df["ndcg@5"].idxmax(), "alpha"]
    ax.axvline(best_alpha, ls="--", color="#ef4444", alpha=0.7,
               label=f"Eng yaxshi α = {best_alpha}")

    ax.set_xlabel("α (content vs collaborative og'irligi)")
    ax.set_ylabel("Metrika qiymati")
    ax.set_title(
        "Hybrid modelda α qiymatining tanlanishi (α=0 — toza CF, α=1 — toza Content)"
    )
    ax.legend(loc="best")
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(0, 1.0)
    plt.tight_layout()
    save_fig("05_alpha_tuning.png")


# ============================================================
# 6. UMAP / SVD 2D vizualizatsiya
# ============================================================

def fig_career_2d(X_careers: np.ndarray, careers: pd.DataFrame):
    """Kasblarni 2D'ga proyeksiya (TruncatedSVD) — kategoriyalar bo'yicha."""
    svd = TruncatedSVD(n_components=2, random_state=42)
    X_2d = svd.fit_transform(X_careers)

    fig, ax = plt.subplots(figsize=(11, 8))

    # Top 15 kategoriya
    top_cats = careers["category"].value_counts().head(15).index.tolist()
    plot_df = pd.DataFrame({
        "x": X_2d[:, 0], "y": X_2d[:, 1],
        "category": careers["category"].values,
        "name": careers["name_uz"].values,
    })

    other_mask = ~plot_df["category"].isin(top_cats)
    if other_mask.any():
        ax.scatter(
            plot_df.loc[other_mask, "x"], plot_df.loc[other_mask, "y"],
            s=20, alpha=0.25, color="#cbd5e1", label="boshqa",
        )

    palette = sns.color_palette("tab20", n_colors=len(top_cats))
    for cat, color in zip(top_cats, palette):
        sub = plot_df[plot_df["category"] == cat]
        ax.scatter(sub["x"], sub["y"], s=45, alpha=0.75, color=color, label=cat)

    ax.set_title("Kasblarning 2D vizualizatsiyasi (TruncatedSVD)\n"
                 "Yaqin nuqtalar — o'xshash feature profillariga ega kasblar")
    ax.set_xlabel("1-komponenta")
    ax.set_ylabel("2-komponenta")
    ax.legend(loc="upper left", bbox_to_anchor=(1.02, 1.0), fontsize=8)
    plt.tight_layout()
    save_fig("06_career_2d.png")


# ============================================================
# 7. Confusion matrix (kategoriya bo'yicha)
# ============================================================

def fig_confusion_matrix(
    careers: pd.DataFrame,
    y_test: np.ndarray,
    pred_top1: np.ndarray,
):
    """Top-1 confusion matrix — kategoriya darajasida."""
    from app.data.taxonomies import CATEGORIES

    true_cat = careers.iloc[y_test]["category"].values
    pred_cat = careers.iloc[pred_top1]["category"].values

    all_cats = sorted(set(careers["category"].unique()))
    n_cats = len(all_cats)
    cm = np.zeros((n_cats, n_cats), dtype=int)
    cat_to_idx = {c: i for i, c in enumerate(all_cats)}

    for t, p in zip(true_cat, pred_cat):
        cm[cat_to_idx[t], cat_to_idx[p]] += 1

    # Normalize qatorlar bo'yicha (true bo'yicha)
    row_sums = cm.sum(axis=1, keepdims=True)
    cm_norm = np.where(row_sums > 0, cm / row_sums, 0)

    fig, ax = plt.subplots(figsize=(11, 9))
    cat_labels = [CATEGORIES.get(c, c)[:25] for c in all_cats]
    sns.heatmap(
        cm_norm, annot=False, fmt=".2f",
        xticklabels=cat_labels, yticklabels=cat_labels,
        cmap="Blues", cbar_kws={"label": "Aniqlik (qator bo'yicha normalize)"},
        ax=ax, square=True,
    )
    ax.set_title("Content-Based modelining kategoriya bo'yicha aniqligi\n"
                 "(Diagonal qiymat = to'g'ri kategoriyadagi top-1 tavsiya)")
    ax.set_xlabel("Tavsiya qilingan kategoriya")
    ax.set_ylabel("Haqiqiy kategoriya")
    plt.xticks(rotation=45, ha="right", fontsize=7)
    plt.yticks(rotation=0, fontsize=7)
    plt.tight_layout()
    save_fig("07_confusion_matrix.png")


# ============================================================
# 8. Explanation example (sample inference)
# ============================================================

def fig_explanation_example(model: ContentBasedRecommender):
    """3 ta turli xil profile uchun model tavsiyalari va izohlari."""
    profiles = [
        {
            "name": "IT-yo'naltirilgan talaba",
            "riasec": {"R": 3, "I": 9, "A": 5, "S": 3, "E": 3, "C": 8},
            "interests": ["it", "fan"],
            "subjects": ["matematika", "informatika", "fizika"],
        },
        {
            "name": "Tibbiy yo'nalishga moyil",
            "riasec": {"R": 6, "I": 8, "A": 3, "S": 9, "E": 4, "C": 6},
            "interests": ["tibbiyot", "fan"],
            "subjects": ["biologiya", "kimyo", "anatomiya"],
        },
        {
            "name": "Ijodkor / san'at",
            "riasec": {"R": 4, "I": 4, "A": 9, "S": 6, "E": 6, "C": 3},
            "interests": ["sanat", "dizayn", "musiqa"],
            "subjects": ["rasm", "musiqa", "adabiyot"],
        },
    ]

    fig, axes = plt.subplots(len(profiles), 1, figsize=(11, 11))

    for ax, profile in zip(axes, profiles):
        recs = model.predict_for_profile(
            riasec_scores=profile["riasec"],
            interests=profile["interests"],
            subjects=profile["subjects"],
            k=5,
        )
        names = [r["name_uz"][:35] for r in recs]
        scores = [r["score"] for r in recs]
        colors = sns.color_palette("Blues_r", n_colors=len(recs))
        ax.barh(range(len(recs)), scores, color=colors)
        ax.set_yticks(range(len(recs)))
        ax.set_yticklabels(names, fontsize=10)
        ax.invert_yaxis()
        ax.set_xlim(0, 1.0)
        ax.set_xlabel("Cosine similarity")
        ax.set_title(
            f"{profile['name']}  |  RIASEC: {profile['riasec']}\n"
            f"Qiziqishlar: {profile['interests']}  |  Fanlar: {profile['subjects']}",
            fontsize=10, loc="left",
        )
        for i, s in enumerate(scores):
            ax.text(s + 0.01, i, f"{s:.3f}", va="center", fontsize=9)

    plt.suptitle("Modelning 3 ta turli xil profile uchun tavsiyalari",
                 fontsize=13, y=1.005)
    plt.tight_layout()
    save_fig("08_explanation_examples.png")


# ============================================================
# Asosiy pipeline
# ============================================================

def main():
    print("=" * 78)
    print("Diplom uchun analiz va vizualizatsiyalarni yaratish")
    print("=" * 78)

    # 1. Dataset
    print("\n[1/8] Dataset yuklanmoqda...")
    careers = load_careers()
    X_careers, _ = build_career_feature_matrix(careers)
    print(f"      Kasblar: {len(careers)}, Feature dim: {X_careers.shape[1]}")

    # Sintetik foydalanuvchilar
    users_df, X_users, y = generate_synthetic_users(n_users=1500, noise=0.15, seed=42)

    # Train / Val / Test split
    train_idx, test_idx = stratified_split(X_users, y, test_size=0.2, seed=42)
    X_trainval, X_test = X_users[train_idx], X_users[test_idx]
    y_trainval, y_test = y[train_idx], y[test_idx]

    sub_train_idx, val_idx = stratified_split(X_trainval, y_trainval, test_size=0.25, seed=43)
    X_train, X_val = X_trainval[sub_train_idx], X_trainval[val_idx]
    y_train, y_val = y_trainval[sub_train_idx], y_trainval[val_idx]

    n_items = len(careers)
    max_k = 10
    k_values = [1, 3, 5, 10]

    # 2. RIASEC distribution
    print("\n[2/8] RIASEC distribution grafigi...")
    fig_riasec_distribution(careers)

    # 3. Category counts
    print("\n[3/8] Kategoriyalar grafigi...")
    fig_category_counts(careers)

    # 4. Modellarni o'qitish va metrikalar
    print("\n[4/8] 5 ta modelni o'qitish va metrikalarni hisoblash...")
    results = {}

    pred = random_baseline(len(X_test), n_items, max_k, seed=42)
    results["Random"] = evaluate_all(pred, y_test, n_items, X_careers, k_values)

    pred = popularity_baseline(len(X_test), y_train, n_items, max_k)
    results["Popularity"] = evaluate_all(pred, y_test, n_items, X_careers, k_values)

    cb = ContentBasedRecommender().fit(careers_df=careers, X_careers=X_careers)
    pred_cb = cb.predict_batch(X_test, k=max_k)
    results["Content-Based"] = evaluate_all(pred_cb, y_test, n_items, X_careers, k_values)

    cf_nmf = CollaborativeRecommender(n_components=30, method="nmf").fit(X_train, y_train, n_items)
    pred = cf_nmf.predict_batch(X_test, k=max_k)
    results["CF-NMF"] = evaluate_all(pred, y_test, n_items, X_careers, k_values)

    cf_svd = CollaborativeRecommender(n_components=30, method="svd").fit(X_train, y_train, n_items)
    pred = cf_svd.predict_batch(X_test, k=max_k)
    results["CF-SVD"] = evaluate_all(pred, y_test, n_items, X_careers, k_values)

    # 5. Alpha tuning
    print("\n[5/8] Hybrid alpha tuning (validation)...")
    alphas = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    alpha_df = alpha_sweep(careers, X_careers, X_train, y_train, X_val, y_val,
                           alphas=alphas, k=5)
    best_alpha = alpha_df.loc[alpha_df["ndcg@5"].idxmax(), "alpha"]
    hybrid = HybridRecommender(alpha=best_alpha).fit(careers, X_careers, X_train, y_train)
    pred = hybrid.predict_batch(X_test, k=max_k)
    results["Hybrid"] = evaluate_all(pred, y_test, n_items, X_careers, k_values)

    # 6. Models comparison
    print("\n[6/8] Modellar taqqoslash grafigi...")
    fig_models_comparison(results)
    fig_precision_at_k_curve(results)
    fig_alpha_tuning(alpha_df)

    # 7. 2D vizualizatsiya
    print("\n[7/8] Kasblarning 2D vizualizatsiyasi...")
    fig_career_2d(X_careers, careers)

    # 8. Confusion matrix + explanations
    print("\n[8/8] Confusion matrix va misol bashoratlar...")
    pred_top1 = pred_cb[:, 0]
    fig_confusion_matrix(careers, y_test, pred_top1)
    fig_explanation_example(cb)

    # Natijalar jadval
    print("\n" + "=" * 78)
    print("BARCHA NATIJALAR JADVAL:")
    print("=" * 78)
    metrics_df = pd.DataFrame(results).round(4)
    print(metrics_df.to_string())

    # CSV ga saqlash
    csv_path = FIG_DIR.parent / "results.csv"
    metrics_df.to_csv(csv_path)
    print(f"\nJadval saqlandi: {csv_path.relative_to(csv_path.parents[1])}")

    alpha_csv = FIG_DIR.parent / "alpha_tuning.csv"
    alpha_df.to_csv(alpha_csv, index=False)
    print(f"Alpha tuning saqlandi: {alpha_csv.relative_to(alpha_csv.parents[1])}")

    print(f"\nBarcha grafiklar saqlandi: {FIG_DIR}")
    print(f"Jami {len(list(FIG_DIR.glob('*.png')))} ta png fayli yaratildi.")


if __name__ == "__main__":
    main()
