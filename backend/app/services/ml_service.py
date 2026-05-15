"""ML Service — kasb bashorat qilish (270+ kasb, hamma sohalar).

Xususiyatlar:
  - RIASEC ballari (6 ta)
  - Akademik ko'rsatkichlar (GPA, analytical, communication)
  - Yosh
  - Qiziqishlar (interests)
  - Fanlarga qiziqish (subjects)
  - Ko'nikmalar va ularning darajasi (0-4)

Ma'lumotlar `app/data/` dan import qilinadi — bu fayl modeldan foydalanish va
hisoblash logikasiga e'tibor qaratadi.
"""

from __future__ import annotations
import os
import numpy as np
import joblib

from app.data.taxonomies import (
    SKILLS_LIST,
    SKILL_CATEGORIES,
    INTERESTS,
    SUBJECTS,
    SKILL_LEVELS,
    CATEGORIES,
    RIASEC_NAMES,
)
from app.data.occupations import OCCUPATIONS_META


MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "career_model.pkl")


# Boshqa modullar import qilishi uchun re-export
__all__ = [
    "SKILLS_LIST", "SKILL_CATEGORIES", "INTERESTS", "SUBJECTS", "SKILL_LEVELS",
    "CATEGORIES", "RIASEC_NAMES", "OCCUPATIONS_META",
    "load_model", "prepare_features", "predict_career",
    "analyze_skills_gap", "get_roadmap",
]


# ============================================================
# Model yuklash
# ============================================================
def load_model():
    """O'qitilgan RandomForest modelni yuklaydi (yo'q bo'lsa None)."""
    if os.path.exists(MODEL_PATH):
        try:
            return joblib.load(MODEL_PATH)
        except Exception:
            return None
    return None


# ============================================================
# Yordamchi: skill_levels normalizatsiyasi
# ============================================================
def _normalize_skill_levels(skills: list[str], skill_levels: dict | None) -> dict[str, int]:
    """Foydalanuvchi skillariga 0-4 oralig'ida daraja qaytaradi.

    - skill_levels dict bo'lsa, undan oladi (0-4 oralig'ida).
    - dict bermagan bo'lsa, mavjud skillarga 2 (o'rta) beradi.
    """
    out: dict[str, int] = {}
    skill_levels = skill_levels or {}
    for s in skills:
        lvl = skill_levels.get(s, 2)
        try:
            lvl = int(lvl)
        except (TypeError, ValueError):
            lvl = 2
        out[s] = max(0, min(4, lvl))
    return out


# ============================================================
# Xususiyatlar vektori (model uchun)
# ============================================================
def prepare_features(
    riasec_scores: dict,
    skills: list[str],
    academic_data: dict,
    age: int | None = None,
    interests: list[str] | None = None,
    subjects: list[str] | None = None,
    skill_levels: dict | None = None,
) -> np.ndarray:
    """Modelga beriladigan xususiyat vektorini quradi.

    Vektor tartibi (train_model.py shu tartibda generatsiya qiladi):
      [R, I, A, S, E, C, gpa, analytical, communication, age,
       interest_<key>... (INTERESTS bo'yicha 0/1),
       subject_<key>... (SUBJECTS bo'yicha 0/1),
       skill_<i> ... (SKILLS_LIST bo'yicha 0-4 daraja)]
    """
    interests = interests or []
    subjects = subjects or []
    levels = _normalize_skill_levels(skills, skill_levels)

    parts: list[float] = [
        float(riasec_scores.get("R", 0)),
        float(riasec_scores.get("I", 0)),
        float(riasec_scores.get("A", 0)),
        float(riasec_scores.get("S", 0)),
        float(riasec_scores.get("E", 0)),
        float(riasec_scores.get("C", 0)),
        float(academic_data.get("gpa", 3.0)),
        float(academic_data.get("analytical", 5)),
        float(academic_data.get("communication", 5)),
        float(age) if age is not None else 22.0,
    ]

    # Qiziqishlar (0/1)
    for key in INTERESTS.keys():
        parts.append(1.0 if key in interests else 0.0)

    # Fanlar (0/1)
    for key in SUBJECTS.keys():
        parts.append(1.0 if key in subjects else 0.0)

    # Ko'nikmalar — 0-4 daraja
    for skill in SKILLS_LIST:
        parts.append(float(levels.get(skill, 0)))

    return np.array(parts, dtype=float).reshape(1, -1)


# ============================================================
# Sabablar va ball tarkibi
# ============================================================
def _generate_reasons(
    occ: dict,
    riasec_scores: dict,
    skills: list[str],
    academic_data: dict,
    cosine: float,
    skill_ratio: float,
    age: int | None,
    interests: list[str],
    subjects: list[str],
    skill_levels: dict,
) -> list[str]:
    """Kasb uchun moslik sabablarini matn ko'rinishida tayyorlaydi."""
    reasons: list[str] = []

    # 1) RIASEC dominant types
    sorted_riasec = sorted(riasec_scores.items(), key=lambda x: x[1], reverse=True)
    occ_riasec = dict(zip(["R", "I", "A", "S", "E", "C"], occ["riasec"]))
    for code, score in sorted_riasec[:3]:
        if score >= 5 and occ_riasec.get(code, 0) >= 5:
            reasons.append(
                f"{RIASEC_NAMES.get(code, code)} shaxsiyat turi mos ({score:.0f}/10)"
            )

    # 2) Mos kelgan ko'nikmalar (yuqori daraja bilan)
    matched = [s for s in skills if s in occ.get("required_skills", [])]
    strong = [s for s in matched if skill_levels.get(s, 0) >= 3]
    if strong:
        s_str = ", ".join(strong[:3])
        suffix = f" va yana {len(strong)-3} ta" if len(strong) > 3 else ""
        reasons.append(f"Yuqori darajada bilgan ko'nikmalar: {s_str}{suffix}")
    elif matched:
        m_str = ", ".join(matched[:3])
        suffix = f" va yana {len(matched)-3} ta" if len(matched) > 3 else ""
        reasons.append(f"{m_str}{suffix} ko'nikmalari mavjud")

    # 3) Qiziqishlar uyg'unligi
    occ_interests = set(occ.get("interests", []))
    matched_int = [INTERESTS.get(k, k) for k in interests if k in occ_interests]
    if matched_int:
        reasons.append(f"Qiziqishlaringiz mos: {', '.join(matched_int[:3])}")

    # 4) Fanlar uyg'unligi
    occ_subjects = set(occ.get("subjects", []))
    matched_subj = [SUBJECTS.get(k, k) for k in subjects if k in occ_subjects]
    if matched_subj:
        reasons.append(f"Fanlardagi qiziqish mos: {', '.join(matched_subj[:3])}")

    # 5) Akademik bonuslar
    gpa = academic_data.get("gpa", 0)
    analytical = academic_data.get("analytical", 0)
    if gpa >= 4.0:
        reasons.append(f"Yuqori akademik ko'rsatkich (GPA: {gpa:.1f})")
    if analytical >= 7:
        reasons.append(f"Kuchli analitik fikrlash ({analytical}/10)")

    # 6) Yosh muvofiqligi
    if age is not None:
        rng = occ.get("age_range") or [16, 65]
        if rng[0] <= age <= rng[1]:
            ideal_low = rng[0] + 2
            ideal_high = max(ideal_low, rng[1] - 5)
            if ideal_low <= age <= ideal_high:
                reasons.append(f"Yoshingiz ({age}) ushbu kasb uchun ideal davrda")

    # 7) RIASEC kosinus sifati
    if cosine >= 0.85:
        reasons.append("RIASEC profili juda yuqori uyg'unlik ko'rsatdi")
    elif cosine >= 0.70:
        reasons.append("RIASEC profili yaxshi uyg'unlik ko'rsatdi")

    if not reasons:
        reasons.append(f"Umumiy profil {occ['name_uz']} kasbiga mos keladi")

    return reasons[:6]


def _score_breakdown(
    cosine: float,
    skill_ratio: float,
    academic_data: dict,
    has_ml: bool,
    interest_match: float,
    subject_match: float,
) -> dict:
    """Ball tarkibini foiz va og'irliklarda ko'rsatadi."""
    gpa_b = (academic_data.get("gpa", 3.0) / 5.0) * 5
    anal_b = (academic_data.get("analytical", 5) / 10.0) * 5
    comm_b = (academic_data.get("communication", 5) / 10.0) * 3
    academic_total = min(round(gpa_b + anal_b + comm_b), 13)

    return {
        "riasec_fit":      round(cosine * 100),
        "skills_match":    round(skill_ratio * 100),
        "interest_match":  round(interest_match * 100),
        "subject_match":   round(subject_match * 100),
        "academic":        academic_total,
        "riasec_weight":   45 if has_ml else 50,
        "skills_weight":   12 if has_ml else 25,
        "interest_weight": 8,
        "subject_weight":  7,
        "academic_weight": 13,
    }


# ============================================================
# Asosiy bashorat funksiyasi
# ============================================================
def predict_career(
    riasec_scores: dict,
    skills: list[str],
    academic_data: dict,
    age: int | None = None,
    interests: list[str] | None = None,
    subjects: list[str] | None = None,
    skill_levels: dict | None = None,
) -> list[dict]:
    """Top 5 kasbni bashorat qiladi — 270+ kasb orasidan."""
    interests = interests or []
    subjects = subjects or []
    levels = _normalize_skill_levels(skills, skill_levels)

    user_vec = np.array([
        riasec_scores.get("R", 0), riasec_scores.get("I", 0),
        riasec_scores.get("A", 0), riasec_scores.get("S", 0),
        riasec_scores.get("E", 0), riasec_scores.get("C", 0),
    ], dtype=float)

    # 1) ML model probalari
    ml_scores: dict[int, float] = {}
    model_data = load_model()
    if model_data is not None:
        try:
            model = model_data["model"]
            X = prepare_features(
                riasec_scores, skills, academic_data,
                age=age, interests=interests, subjects=subjects,
                skill_levels=levels,
            )
            probas = model.predict_proba(X)[0]
            classes = list(model.classes_)
            for cls, p in zip(classes, probas):
                ml_scores[int(cls)] = float(p)
        except Exception:
            ml_scores = {}

    has_ml = bool(ml_scores)

    scores: dict[int, float] = {}
    cosine_map: dict[int, float] = {}
    skill_ratio_map: dict[int, float] = {}
    interest_match_map: dict[int, float] = {}
    subject_match_map: dict[int, float] = {}

    for occ_id, occ in OCCUPATIONS_META.items():
        # RIASEC kosinus
        occ_vec = np.array(occ["riasec"], dtype=float)
        norm = np.linalg.norm(user_vec) * np.linalg.norm(occ_vec)
        cosine = float(np.dot(user_vec, occ_vec) / norm) if norm > 0 else 0.0

        # Ko'nikma moslik (daraja bilan vaznlangan)
        required = occ.get("required_skills", [])
        if required:
            total_w = 0.0
            max_w = 0.0
            for s in required:
                lvl = levels.get(s, 0)
                total_w += lvl
                max_w += 4  # ekspert darajasi
            skill_ratio = total_w / max_w if max_w > 0 else 0.0
        else:
            skill_ratio = 0.0

        # Qiziqish moslik
        occ_int = set(occ.get("interests", []))
        if occ_int:
            int_match = len([k for k in interests if k in occ_int]) / len(occ_int)
            int_match = min(1.0, int_match)
        else:
            int_match = 0.0

        # Fan moslik
        occ_subj = set(occ.get("subjects", []))
        if occ_subj:
            subj_match = len([k for k in subjects if k in occ_subj]) / len(occ_subj)
            subj_match = min(1.0, subj_match)
        else:
            subj_match = 0.0

        # Yosh penalty: agar yosh diapazon tashqarisida bo'lsa, jazo
        age_factor = 1.0
        if age is not None:
            rng = occ.get("age_range") or [16, 65]
            if age < rng[0]:
                age_factor = 0.6 - min(0.4, (rng[0] - age) * 0.05)
            elif age > rng[1]:
                age_factor = 0.6 - min(0.4, (age - rng[1]) * 0.03)
            age_factor = max(0.2, age_factor)

        # Akademik bonuslar
        gpa_bonus = (academic_data.get("gpa", 3.0) / 5.0) * 0.05
        analytical = (academic_data.get("analytical", 5) / 10.0) * 0.05
        comm = (academic_data.get("communication", 5) / 10.0) * 0.03

        if occ_id in ml_scores:
            combined = (
                ml_scores[occ_id] * 0.45 +
                cosine * 0.20 +
                skill_ratio * 0.12 +
                int_match * 0.08 +
                subj_match * 0.07 +
                gpa_bonus + analytical + comm
            )
        else:
            combined = (
                cosine * 0.45 +
                skill_ratio * 0.25 +
                int_match * 0.10 +
                subj_match * 0.08 +
                gpa_bonus + analytical + comm
            )

        combined *= age_factor

        scores[occ_id] = combined
        cosine_map[occ_id] = cosine
        skill_ratio_map[occ_id] = skill_ratio
        interest_match_map[occ_id] = int_match
        subject_match_map[occ_id] = subj_match

    # Top 5 (oldin 3 edi — endi tanlov ko'p)
    top = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:5]

    results: list[dict] = []
    for occ_id, raw_score in top:
        occ = OCCUPATIONS_META[occ_id]
        display_score = int(min(max(round(raw_score * 100), 30), 97))
        cosine = cosine_map[occ_id]
        skill_ratio = skill_ratio_map[occ_id]
        int_m = interest_match_map[occ_id]
        subj_m = subject_match_map[occ_id]

        reasons = _generate_reasons(
            occ, riasec_scores, skills, academic_data,
            cosine, skill_ratio, age, interests, subjects, levels,
        )
        breakdown = _score_breakdown(
            cosine, skill_ratio, academic_data, has_ml, int_m, subj_m,
        )

        required = occ.get("required_skills", [])
        matched_skills = [s for s in skills if s in required]
        missing_skills = [s for s in required if s not in skills]

        results.append({
            "id": occ_id,
            "name": occ["name"],
            "name_uz": occ["name_uz"],
            "category": occ.get("category"),
            "category_uz": CATEGORIES.get(occ.get("category", ""), ""),
            "score": display_score,
            "avg_salary": occ["avg_salary"],
            "demand": occ.get("demand", "O'rta"),
            "growth": occ.get("growth", "+10%"),
            "description_uz": occ["description_uz"],
            "required_skills": required,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "skills_match_percent": round(skill_ratio * 100),
            "interests": [INTERESTS.get(k, k) for k in occ.get("interests", [])],
            "subjects": [SUBJECTS.get(k, k) for k in occ.get("subjects", [])],
            "age_range": occ.get("age_range", [16, 65]),
            "roadmap": occ.get("roadmap", []),
            "reasons": reasons,
            "score_breakdown": breakdown,
        })
    return results


# ============================================================
# Skills gap va roadmap
# ============================================================
def analyze_skills_gap(user_skills: list[str], occupation_id: int) -> dict:
    occ = OCCUPATIONS_META.get(occupation_id)
    if not occ:
        return {"error": "Kasb topilmadi"}
    required = occ.get("required_skills", [])
    matched = [s for s in required if s in user_skills]
    missing = [s for s in required if s not in user_skills]
    match_percent = round((len(matched) / len(required)) * 100) if required else 0
    return {
        "occupation": occ["name_uz"],
        "category": CATEGORIES.get(occ.get("category", ""), ""),
        "required_skills": required,
        "matched_skills": matched,
        "missing_skills": missing,
        "match_percent": match_percent,
    }


def get_roadmap(occupation_id: int, user_skills: list[str] | None = None) -> dict:
    """6 oylik o'rganish rejasi (foydalanuvchi skillariga moslashtirilgan)."""
    occ = OCCUPATIONS_META.get(occupation_id)
    if not occ:
        return {"error": "Kasb topilmadi"}

    user_skills = user_skills or []
    phases = []
    for phase in occ.get("roadmap", []):
        phase_skills = phase.get("skills", []) or []
        already_known = [s for s in phase_skills if s in user_skills]
        needs_learning = [s for s in phase_skills if s not in user_skills]
        phases.append({
            "month": phase.get("month", ""),
            "title": phase.get("title", ""),
            "resources": phase.get("resources", []),
            "skills": phase_skills,
            "already_known": already_known,
            "needs_learning": needs_learning,
            "is_completed": (len(needs_learning) == 0 and len(already_known) > 0),
        })

    completed = sum(1 for p in phases if p["is_completed"])
    total = len(phases) or 1
    return {
        "occupation": occ["name_uz"],
        "category": CATEGORIES.get(occ.get("category", ""), ""),
        "duration": "6 oy",
        "phases": phases,
        "progress_percent": round(completed / total * 100),
        "completed_phases": completed,
        "total_phases": len(phases),
    }
