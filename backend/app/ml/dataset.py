"""
Dataset moduli — Recommender System uchun ma'lumotlar tayyorlash.

Mazmun:
    1. load_careers()                    — occupations.py dan kasblarni yuklash
    2. build_career_feature_matrix(...)  — har kasb uchun feature vector qurish
    3. generate_synthetic_users(n, ...)  — n ta sintetik foydalanuvchi yaratish
    4. user_profile_to_vector(...)       — foydalanuvchi profilini vector ga aylantirish

Feature vector tuzilishi (D=100 atrofida):
    - 6 dim: RIASEC (R, I, A, S, E, C) → 0-1
    - K dim: CATEGORIES one-hot (30) → har kasb bitta kategoriyada
    - I dim: INTERESTS multi-hot (33)
    - S dim: SUBJECTS multi-hot (31)

Diplom uchun bu modul:
    - Aniq, takrorlanuvchan natija beradi (random seed)
    - Test va validatsiya uchun foydalaniladi
    - Sintetik datasetni keshlab saqlaydi
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Tuple, Optional

from app.data.occupations import _RAW_OCCUPATIONS as RAW_OCCUPATIONS
from app.data.taxonomies import CATEGORIES, INTERESTS, SUBJECTS, RIASEC_NAMES


# ============================================================
# Konstantalar
# ============================================================
RIASEC_KEYS = list(RIASEC_NAMES.keys())  # ['R', 'I', 'A', 'S', 'E', 'C']
CATEGORY_KEYS = list(CATEGORIES.keys())  # 30 ta
INTEREST_KEYS = list(INTERESTS.keys())  # 33 ta
SUBJECT_KEYS = list(SUBJECTS.keys())  # 31 ta

# Feature vector o'lchamlari
N_RIASEC = len(RIASEC_KEYS)
N_CATEGORIES = len(CATEGORY_KEYS)
N_INTERESTS = len(INTEREST_KEYS)
N_SUBJECTS = len(SUBJECT_KEYS)
FEATURE_DIM = N_RIASEC + N_CATEGORIES + N_INTERESTS + N_SUBJECTS

# Index'lar (feature vector ichida qaerdan-qaergacha qaysi qism)
IDX_RIASEC = (0, N_RIASEC)
IDX_CATEGORY = (N_RIASEC, N_RIASEC + N_CATEGORIES)
IDX_INTERESTS = (
    N_RIASEC + N_CATEGORIES,
    N_RIASEC + N_CATEGORIES + N_INTERESTS,
)
IDX_SUBJECTS = (
    N_RIASEC + N_CATEGORIES + N_INTERESTS,
    FEATURE_DIM,
)


# ============================================================
# 1. Kasblarni yuklash
# ============================================================

def load_careers() -> pd.DataFrame:
    """occupations.py dan kasblarni DataFrame sifatida qaytaradi.

    Returns:
        DataFrame, ustunlar: id, name, name_uz, category, riasec_R..C,
        interests (list), subjects (list), required_skills (list).
    """
    rows = []
    for idx, occ in enumerate(RAW_OCCUPATIONS):
        row = {
            "id": idx,
            "name": occ["name"],
            "name_uz": occ["name_uz"],
            "category": occ["category"],
            "description_uz": occ.get("description_uz", ""),
            "interests": occ.get("interests", []),
            "subjects": occ.get("subjects", []),
            "required_skills": occ.get("required_skills", []),
            "avg_salary": occ.get("avg_salary", ""),
            "demand": occ.get("demand", ""),
        }
        # RIASEC ni alohida ustunlarga ajratamiz: riasec_R, riasec_I, ...
        riasec = occ.get("riasec", [0] * 6)
        for i, key in enumerate(RIASEC_KEYS):
            row[f"riasec_{key}"] = riasec[i] if i < len(riasec) else 0
        rows.append(row)
    return pd.DataFrame(rows)


# ============================================================
# 2. Feature vector qurish
# ============================================================

def career_to_vector(career_row: pd.Series) -> np.ndarray:
    """Bitta kasbni feature vector ga aylantiradi.

    Args:
        career_row: load_careers() DataFrame qatori.

    Returns:
        D-dim numpy array (RIASEC + category + interests + subjects).
    """
    vec = np.zeros(FEATURE_DIM, dtype=np.float32)

    # RIASEC (0-10 → 0-1)
    for i, key in enumerate(RIASEC_KEYS):
        vec[i] = career_row[f"riasec_{key}"] / 10.0

    # Kategoriya (one-hot)
    cat = career_row["category"]
    if cat in CATEGORY_KEYS:
        vec[IDX_CATEGORY[0] + CATEGORY_KEYS.index(cat)] = 1.0

    # Qiziqishlar (multi-hot)
    for interest in career_row["interests"]:
        if interest in INTEREST_KEYS:
            vec[IDX_INTERESTS[0] + INTEREST_KEYS.index(interest)] = 1.0

    # Fanlar (multi-hot)
    for subject in career_row["subjects"]:
        if subject in SUBJECT_KEYS:
            vec[IDX_SUBJECTS[0] + SUBJECT_KEYS.index(subject)] = 1.0

    return vec


def build_career_feature_matrix(
    careers: Optional[pd.DataFrame] = None,
) -> Tuple[np.ndarray, pd.DataFrame]:
    """Barcha kasblar uchun feature matritsa quradi.

    Args:
        careers: Kasblar DataFrame'i (None bo'lsa load_careers() ishlatiladi).

    Returns:
        (X, careers_df):
            X — shape (N_careers, FEATURE_DIM) numpy array
            careers_df — kasblar DataFrame'i (id ustun bilan)
    """
    if careers is None:
        careers = load_careers()
    X = np.stack([career_to_vector(row) for _, row in careers.iterrows()])
    return X, careers


# ============================================================
# 3. Foydalanuvchi profilini vector ga aylantirish
# ============================================================

def user_profile_to_vector(
    riasec_scores: dict[str, float],
    interests: list[str] | None = None,
    subjects: list[str] | None = None,
    target_category: str | None = None,
) -> np.ndarray:
    """Foydalanuvchi profilini feature vector ga aylantirish.

    Args:
        riasec_scores: {'R': 7.5, 'I': 8.0, ...} (0-10 oraliqda)
        interests: foydalanuvchi tanlagan qiziqishlar (INTERESTS kalitlari)
        subjects: foydalanuvchining yaxshi fanlari (SUBJECTS kalitlari)
        target_category: agar bor bo'lsa, kategoriya one-hot ham qo'shiladi

    Returns:
        D-dim feature vector (kasb vector'lari bilan bir formatda).
    """
    vec = np.zeros(FEATURE_DIM, dtype=np.float32)

    # RIASEC
    for i, key in enumerate(RIASEC_KEYS):
        vec[i] = riasec_scores.get(key, 0.0) / 10.0

    # Kategoriya — foydalanuvchi profilida odatda bo'lmaydi (model topadi)
    if target_category and target_category in CATEGORY_KEYS:
        vec[IDX_CATEGORY[0] + CATEGORY_KEYS.index(target_category)] = 1.0

    # Qiziqishlar
    for interest in interests or []:
        if interest in INTEREST_KEYS:
            vec[IDX_INTERESTS[0] + INTEREST_KEYS.index(interest)] = 1.0

    # Fanlar
    for subject in subjects or []:
        if subject in SUBJECT_KEYS:
            vec[IDX_SUBJECTS[0] + SUBJECT_KEYS.index(subject)] = 1.0

    return vec


# ============================================================
# 4. Sintetik foydalanuvchilar
# ============================================================

def generate_synthetic_users(
    n_users: int = 500,
    users_per_career: int | None = None,
    noise: float = 0.15,
    seed: int = 42,
) -> Tuple[pd.DataFrame, np.ndarray, np.ndarray]:
    """Sintetik foydalanuvchilar yaratadi (har biri uchun ideal kasb ma'lum).

    Algoritm:
        1. Har kasb uchun K ta "ideal foydalanuvchi" yaratiladi
        2. Ideal foydalanuvchi = kasb feature vektorining shovqinli (noisy) versiyasi
        3. Noise — Gaussian, std=noise
        4. RIASEC va kategoriya saqlanadi, qiziqishlar/fanlardan ba'zilari tushirib qoldiriladi

    Args:
        n_users: Jami foydalanuvchilar soni (taxminan)
        users_per_career: Har kasbga necha foydalanuvchi (None bo'lsa n_users dan hisoblanadi)
        noise: Shovqin darajasi (0.0 — toza, 0.3 — kuchli shovqin)
        seed: Random seed (qayta ishlab chiqarish uchun)

    Returns:
        (users_df, X_users, y_careers):
            users_df  — DataFrame foydalanuvchi ma'lumotlari bilan
            X_users   — shape (n_users, FEATURE_DIM) feature matrix
            y_careers — shape (n_users,) ideal kasb id (target)
    """
    rng = np.random.default_rng(seed)
    careers = load_careers()
    n_careers = len(careers)

    if users_per_career is None:
        users_per_career = max(1, n_users // n_careers)

    rows = []
    X_rows = []
    y_list = []

    for _, career in careers.iterrows():
        career_vec = career_to_vector(career)

        for _ in range(users_per_career):
            # Shovqinli versiya
            user_vec = career_vec.copy()

            # RIASEC ga Gaussian noise
            riasec_noise = rng.normal(0, noise, size=N_RIASEC)
            user_vec[:N_RIASEC] = np.clip(
                user_vec[:N_RIASEC] + riasec_noise, 0.0, 1.0
            )

            # Foydalanuvchi profilida kategoriya bo'lmaydi (model uni topishi kerak)
            user_vec[IDX_CATEGORY[0]:IDX_CATEGORY[1]] = 0.0

            # Qiziqishlardan random 30%'ini olib tashlash (har inson hammasini tanlamaydi)
            interest_slice = user_vec[IDX_INTERESTS[0]:IDX_INTERESTS[1]]
            mask = rng.random(N_INTERESTS) > 0.3
            user_vec[IDX_INTERESTS[0]:IDX_INTERESTS[1]] = interest_slice * mask

            # Fanlardan ba'zilarini ham olib tashlash
            subj_slice = user_vec[IDX_SUBJECTS[0]:IDX_SUBJECTS[1]]
            mask = rng.random(N_SUBJECTS) > 0.3
            user_vec[IDX_SUBJECTS[0]:IDX_SUBJECTS[1]] = subj_slice * mask

            X_rows.append(user_vec)
            y_list.append(int(career["id"]))

            # DataFrame uchun yozuv
            riasec_dict = {
                key: round(user_vec[i] * 10, 2)
                for i, key in enumerate(RIASEC_KEYS)
            }
            user_interests = [
                INTEREST_KEYS[i]
                for i in range(N_INTERESTS)
                if user_vec[IDX_INTERESTS[0] + i] > 0
            ]
            user_subjects = [
                SUBJECT_KEYS[i]
                for i in range(N_SUBJECTS)
                if user_vec[IDX_SUBJECTS[0] + i] > 0
            ]
            rows.append({
                "user_id": len(rows),
                "riasec": riasec_dict,
                "interests": user_interests,
                "subjects": user_subjects,
                "target_career_id": int(career["id"]),
                "target_career_name": career["name_uz"],
            })

    users_df = pd.DataFrame(rows)
    X_users = np.stack(X_rows)
    y_careers = np.array(y_list)

    return users_df, X_users, y_careers


# ============================================================
# 5. Tezkor diagnostika (debug uchun)
# ============================================================

def summary():
    """Dataset haqida qisqacha hisobot chiqaradi."""
    careers = load_careers()
    X_careers, _ = build_career_feature_matrix(careers)

    print(f"Kasblar soni:           {len(careers)}")
    print(f"Kategoriyalar:          {careers['category'].nunique()}")
    print(f"Feature dim:            {FEATURE_DIM}")
    print(f"  - RIASEC:             {N_RIASEC}")
    print(f"  - Kategoriyalar:      {N_CATEGORIES}")
    print(f"  - Qiziqishlar:        {N_INTERESTS}")
    print(f"  - Fanlar:             {N_SUBJECTS}")
    print(f"Career matrix shape:    {X_careers.shape}")

    users_df, X_users, y = generate_synthetic_users(n_users=300, seed=42)
    print(f"\nSintetik foydalanuvchilar: {len(users_df)}")
    print(f"User matrix shape:      {X_users.shape}")
    print(f"Unique target careers:  {len(np.unique(y))}")


if __name__ == "__main__":
    summary()
