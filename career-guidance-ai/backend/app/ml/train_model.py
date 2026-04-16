"""
RandomForestClassifier yordamida kasb bashorat modelini o'qitish.

Bu skript sintetik dataset yaratadi va modelni o'qitib,
career_model.pkl fayliga saqlaydi.
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib

# ============================================================
# 1. Sintetik dataset yaratish
# ============================================================

OCCUPATIONS = {
    0: {"name": "Data Scientist", "riasec": [3, 9, 4, 3, 2, 7]},
    1: {"name": "Backend Developer", "riasec": [5, 8, 2, 2, 3, 8]},
    2: {"name": "UI/UX Designer", "riasec": [2, 5, 9, 6, 4, 3]},
    3: {"name": "Project Manager", "riasec": [2, 4, 3, 7, 8, 6]},
    4: {"name": "Cybersecurity Analyst", "riasec": [6, 8, 2, 2, 3, 9]},
    5: {"name": "Mobile Developer", "riasec": [5, 7, 6, 3, 3, 6]},
    6: {"name": "DevOps Engineer", "riasec": [7, 7, 2, 2, 3, 9]},
    7: {"name": "AI/ML Engineer", "riasec": [4, 10, 5, 2, 2, 7]},
}

SKILLS_LIST = [
    "Python", "JavaScript", "SQL", "HTML/CSS", "React", "Git",
    "Matematika", "Statistika", "Machine Learning", "Docker",
    "Linux", "Figma", "Dizayn", "Kommunikatsiya", "Boshqaruv",
    "Agile", "Data Visualization", "API Design", "System Design",
    "Kriptografiya", "Tarmoq xavfsizligi", "TensorFlow", "NLP"
]

OCCUPATION_SKILL_MAP = {
    0: ["Python", "Statistika", "Machine Learning", "SQL", "Matematika", "Data Visualization"],
    1: ["Python", "SQL", "API Design", "Docker", "Git", "System Design"],
    2: ["Figma", "Dizayn", "HTML/CSS", "React", "JavaScript"],
    3: ["Kommunikatsiya", "Boshqaruv", "Agile"],
    4: ["Linux", "Python", "Kriptografiya", "Tarmoq xavfsizligi"],
    5: ["JavaScript", "React", "HTML/CSS", "Git", "API Design"],
    6: ["Linux", "Docker", "Git", "Python", "System Design"],
    7: ["Python", "TensorFlow", "Matematika", "Machine Learning", "NLP"],
}


def generate_sample(occupation_id: int) -> dict:
    """Bitta kasb uchun sintetik namuna yaratadi."""
    occ = OCCUPATIONS[occupation_id]
    base_riasec = np.array(occ["riasec"], dtype=float)

    # RIASEC skorlariga shovqin qo'shish
    noise = np.random.normal(0, 1.5, 6)
    riasec = np.clip(base_riasec + noise, 0, 10).round(1)

    # GPA - kasb bilan korrelyatsiya
    gpa = np.clip(np.random.normal(3.5, 0.8), 0, 5)

    # Analitik va kommunikatsiya
    analytical = np.clip(np.random.normal(base_riasec[1] * 0.8, 1.5), 1, 10)
    communication = np.clip(np.random.normal(base_riasec[3] * 0.9, 1.5), 1, 10)

    # Ko'nikmalar - kasb uchun mos ko'nikmalarni yuqori ehtimollikda tanlash
    skills_vector = []
    relevant_skills = OCCUPATION_SKILL_MAP.get(occupation_id, [])
    for skill in SKILLS_LIST:
        if skill in relevant_skills:
            skills_vector.append(1 if np.random.random() > 0.25 else 0)
        else:
            skills_vector.append(1 if np.random.random() > 0.8 else 0)

    return {
        "R": riasec[0], "I": riasec[1], "A": riasec[2],
        "S": riasec[3], "E": riasec[4], "C": riasec[5],
        "gpa": round(gpa, 1),
        "analytical": round(analytical, 1),
        "communication": round(communication, 1),
        **{f"skill_{i}": v for i, v in enumerate(skills_vector)},
        "occupation": occupation_id
    }


def create_dataset(n_per_class: int = 500) -> pd.DataFrame:
    """Barcha kasblar uchun sintetik dataset yaratadi."""
    samples = []
    for occ_id in OCCUPATIONS:
        for _ in range(n_per_class):
            samples.append(generate_sample(occ_id))
    df = pd.DataFrame(samples)
    return df.sample(frac=1, random_state=42).reset_index(drop=True)


# ============================================================
# 2. Modelni o'qitish
# ============================================================

def train_model():
    """RandomForestClassifier modelni o'qitib saqlaydi."""
    print("=" * 60)
    print("KasbYo'lAI - ML Model Training")
    print("=" * 60)

    # Dataset yaratish
    print("\n[1/4] Sintetik dataset yaratilmoqda...")
    df = create_dataset(n_per_class=500)
    print(f"  -> Jami {len(df)} ta namuna, {df['occupation'].nunique()} ta kasb")

    # Feature va targetni ajratish
    feature_cols = [c for c in df.columns if c != "occupation"]
    X = df[feature_cols].values
    y = df["occupation"].values

    # Train/test split
    print("\n[2/4] Ma'lumotlar train/test ga bo'linmoqda...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  -> Train: {len(X_train)}, Test: {len(X_test)}")

    # Model o'qitish
    print("\n[3/4] RandomForestClassifier o'qitilmoqda...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Baholash
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n  -> Accuracy: {accuracy:.4f} ({accuracy * 100:.1f}%)")
    print("\n  Classification Report:")
    target_names = [OCCUPATIONS[i]["name"] for i in range(len(OCCUPATIONS))]
    print(classification_report(y_test, y_pred, target_names=target_names))

    # Feature importance
    print("  Top 10 Feature Importance:")
    importances = model.feature_importances_
    feat_imp = sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
    for feat, imp in feat_imp[:10]:
        print(f"    {feat:25s} -> {imp:.4f}")

    # Modelni saqlash
    print("\n[4/4] Model saqlanmoqda...")
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "career_model.pkl")

    model_data = {
        "model": model,
        "feature_cols": feature_cols,
        "skills_list": SKILLS_LIST,
        "occupations": OCCUPATIONS,
    }
    joblib.dump(model_data, model_path)
    print(f"  -> Saqlandi: {model_path}")
    print("\n" + "=" * 60)
    print("Model muvaffaqiyatli o'qitildi!")
    print("=" * 60)

    return model_data


if __name__ == "__main__":
    train_model()
