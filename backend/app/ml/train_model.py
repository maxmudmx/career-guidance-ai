"""RandomForestClassifier yordamida kasb bashorat modelini o'qitish.

270+ kasb uchun sintetik dataset yaratadi va modelni o'qitib
career_model.pkl fayliga saqlaydi.

Xususiyatlar:
  - RIASEC (R, I, A, S, E, C)
  - Akademik (gpa, analytical, communication)
  - Yosh
  - Qiziqishlar (INTERESTS bo'yicha 0/1)
  - Fanlar (SUBJECTS bo'yicha 0/1)
  - Ko'nikmalar darajasi (SKILLS_LIST bo'yicha 0-4)

Ishga tushirish (backend/ ichidan):
    python -m app.ml.train_model
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

from app.data.taxonomies import SKILLS_LIST, INTERESTS, SUBJECTS
from app.data.occupations import OCCUPATIONS_META


# Har bir kasb uchun necha ta sintetik namuna
# 303 kasb × 80 = 24,240 namuna (xotira sig'imiga moslashtirilgan)
N_PER_CLASS = 80


def _sample_age(age_range: list[int]) -> int:
    """Yosh diapazonidan tasodifiy yosh tanlaydi (markazga moyil)."""
    low, high = age_range[0], age_range[1]
    mu = (low + high) / 2.0
    sigma = max(2.0, (high - low) / 6.0)
    return int(np.clip(np.random.normal(mu, sigma), low, high))


def generate_sample(occupation_id: int) -> dict:
    """Bitta kasb uchun sintetik namuna yaratadi."""
    occ = OCCUPATIONS_META[occupation_id]
    base_riasec = np.array(occ["riasec"], dtype=float)

    # 1) RIASEC + Gauss shovqin
    riasec = np.clip(base_riasec + np.random.normal(0, 1.5, 6), 0, 10).round(1)

    # 2) GPA, analytical, communication
    gpa = float(np.clip(np.random.normal(3.5, 0.8), 0, 5))
    analytical = float(np.clip(np.random.normal(base_riasec[1] * 0.8, 1.5), 1, 10))
    communication = float(np.clip(np.random.normal(base_riasec[3] * 0.9, 1.5), 1, 10))

    # 3) Yosh
    age = _sample_age(occ.get("age_range") or [16, 65])

    # 4) Qiziqishlar — kasb interestlari 80%, boshqa interest 8%
    occ_interests = set(occ.get("interests", []))
    interest_vec = {}
    for key in INTERESTS:
        if key in occ_interests:
            interest_vec[key] = 1 if np.random.random() > 0.20 else 0
        else:
            interest_vec[key] = 1 if np.random.random() > 0.92 else 0

    # 5) Fanlar — kasb subjectlari 75%, boshqa fan 10%
    occ_subjects = set(occ.get("subjects", []))
    subject_vec = {}
    for key in SUBJECTS:
        if key in occ_subjects:
            subject_vec[key] = 1 if np.random.random() > 0.25 else 0
        else:
            subject_vec[key] = 1 if np.random.random() > 0.90 else 0

    # 6) Ko'nikmalar darajasi (0-4)
    required = set(occ.get("required_skills", []))
    skills_vec = {}
    for skill in SKILLS_LIST:
        if skill in required:
            # Required: o'rta-yuqori daraja taqsimoti
            lvl = np.random.choice([0, 1, 2, 3, 4], p=[0.05, 0.10, 0.30, 0.35, 0.20])
        else:
            # Boshqa: ko'pchilik 0, ba'zilari past daraja
            lvl = np.random.choice([0, 1, 2, 3, 4], p=[0.78, 0.12, 0.07, 0.02, 0.01])
        skills_vec[skill] = int(lvl)

    sample = {
        "R": riasec[0], "I": riasec[1], "A": riasec[2],
        "S": riasec[3], "E": riasec[4], "C": riasec[5],
        "gpa": round(gpa, 1),
        "analytical": round(analytical, 1),
        "communication": round(communication, 1),
        "age": age,
    }
    for k, v in interest_vec.items():
        sample[f"int_{k}"] = v
    for k, v in subject_vec.items():
        sample[f"subj_{k}"] = v
    for i, skill in enumerate(SKILLS_LIST):
        sample[f"skill_{i}"] = skills_vec[skill]

    sample["occupation"] = occupation_id
    return sample


def create_dataset(n_per_class: int = N_PER_CLASS) -> pd.DataFrame:
    """Barcha kasblar uchun sintetik dataset yaratadi."""
    samples = []
    for occ_id in OCCUPATIONS_META:
        for _ in range(n_per_class):
            samples.append(generate_sample(occ_id))
    df = pd.DataFrame(samples)
    return df.sample(frac=1, random_state=42).reset_index(drop=True)


def train_model():
    """RandomForestClassifier modelni o'qitib saqlaydi."""
    np.random.seed(42)

    print("=" * 60)
    print(f"Kasbim - ML Model Training ({len(OCCUPATIONS_META)} kasb)")
    print("=" * 60)
    print(
        f"Kasblar: {len(OCCUPATIONS_META)} | "
        f"Ko'nikmalar: {len(SKILLS_LIST)} | "
        f"Qiziqishlar: {len(INTERESTS)} | "
        f"Fanlar: {len(SUBJECTS)}"
    )

    # Dataset
    print(f"\n[1/4] Sintetik dataset yaratilmoqda ({N_PER_CLASS}/kasb)...")
    df = create_dataset()
    print(f"  -> Jami {len(df)} ta namuna, {df['occupation'].nunique()} ta kasb")

    feature_cols = [c for c in df.columns if c != "occupation"]
    X = df[feature_cols].values
    y = df["occupation"].values
    print(f"  -> Xususiyatlar: {len(feature_cols)} ta")

    # Train/test split
    print("\n[2/4] Train/test bo'linmoqda...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  -> Train: {len(X_train)}, Test: {len(X_test)}")

    # Model — sinflar ko'payganligi sababli kattaroq forest
    print("\n[3/4] RandomForestClassifier o'qitilmoqda...")
    model = RandomForestClassifier(
        n_estimators=80,
        max_depth=14,
        min_samples_split=6,
        min_samples_leaf=3,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=2,  # xotira chegarasi uchun
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n  -> Test accuracy: {accuracy:.4f} ({accuracy * 100:.1f}%)")

    # Top-3 accuracy
    proba = model.predict_proba(X_test)
    classes = model.classes_
    top3_correct = 0
    for i, true_y in enumerate(y_test):
        top3 = classes[np.argsort(proba[i])[::-1][:3]]
        if true_y in top3:
            top3_correct += 1
    print(f"  -> Top-3 accuracy: {top3_correct / len(y_test):.4f}")

    # Feature importance — top 15
    print("\n  Top 15 Feature Importance:")
    importances = model.feature_importances_
    feat_imp = sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
    for feat, imp in feat_imp[:15]:
        print(f"    {feat:30s} -> {imp:.4f}")

    # Saqlash
    print("\n[4/4] Model saqlanmoqda...")
    # Windows konsolda Cyrillic yo'l xatosini oldini olish
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "career_model.pkl")

    model_data = {
        "model": model,
        "feature_cols": feature_cols,
        "skills_list": SKILLS_LIST,
        "interests_keys": list(INTERESTS.keys()),
        "subjects_keys": list(SUBJECTS.keys()),
        "n_occupations": len(OCCUPATIONS_META),
        "test_accuracy": float(accuracy),
        "top3_accuracy": top3_correct / len(y_test),
    }
    joblib.dump(model_data, model_path)
    print(f"  -> Saqlandi: {model_path}")
    print("\n" + "=" * 60)
    print(f"Model muvaffaqiyatli o'qitildi! ({len(OCCUPATIONS_META)} kasb)")
    print("=" * 60)

    return model_data


if __name__ == "__main__":
    train_model()
