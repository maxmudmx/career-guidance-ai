"""ML Service - Kasb bashorat qilish xizmati (15 kasb)."""

import os
import numpy as np
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "career_model.pkl")

SKILLS_LIST = [
    "Python", "JavaScript", "TypeScript", "SQL", "HTML/CSS", "React", "Git",
    "Matematika", "Statistika", "Machine Learning", "Docker",
    "Linux", "Figma", "Dizayn", "Kommunikatsiya", "Boshqaruv",
    "Agile", "Data Visualization", "API Design", "System Design",
    "Kriptografiya", "Tarmoq xavfsizligi", "TensorFlow", "NLP",
    "Node.js", "Vue.js", "AWS", "Kubernetes", "Apache Spark", "Selenium",
]

OCCUPATIONS_META = {
    0: {
        "name": "Data Scientist", "name_uz": "Ma'lumotlar olimi",
        "required_skills": ["Python", "Statistika", "Machine Learning", "SQL", "Matematika", "Data Visualization"],
        "avg_salary": "$120,000", "demand": "Yuqori", "growth": "+35%",
        "description_uz": "Ma'lumotlarni tahlil qilib, biznes qarorlarni qo'llab-quvvatlaydigan modellar yaratish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Python va Statistika asoslari", "resources": ["Coursera: Python for Everybody", "Khan Academy: Statistics"]},
            {"month": "3-4 oy", "title": "Machine Learning asoslari", "resources": ["Coursera: Andrew Ng ML", "Kaggle Learn"]},
            {"month": "5-6 oy", "title": "Deep Learning va Portfolio", "resources": ["Fast.ai", "Kaggle Competitions"]},
        ],
        "riasec": [3, 9, 4, 3, 2, 7],
    },
    1: {
        "name": "Backend Developer", "name_uz": "Backend dasturchi",
        "required_skills": ["Python", "SQL", "API Design", "Docker", "Git", "System Design"],
        "avg_salary": "$110,000", "demand": "Yuqori", "growth": "+25%",
        "description_uz": "Server tomonidagi dasturiy ta'minot va API'lar yaratish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Python va SQL chuqurlashtirilgan", "resources": ["FreeCodeCamp", "SQLBolt"]},
            {"month": "3-4 oy", "title": "FastAPI/Django va Docker", "resources": ["FastAPI Docs", "Docker Tutorial"]},
            {"month": "5-6 oy", "title": "System Design va Deploy", "resources": ["System Design Primer", "AWS Free Tier"]},
        ],
        "riasec": [5, 8, 2, 2, 3, 8],
    },
    2: {
        "name": "UI/UX Designer", "name_uz": "UI/UX dizayner",
        "required_skills": ["Figma", "Dizayn", "Prototiplash", "Foydalanuvchi tadqiqoti", "Rang nazariyasi", "Tipografiya"],
        "avg_salary": "$95,000", "demand": "O'rta", "growth": "+16%",
        "description_uz": "Foydalanuvchi interfeyslarini loyihalash va tajribasini optimallashtirish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Dizayn asoslari va Figma", "resources": ["Google UX Design Certificate", "Figma YouTube"]},
            {"month": "3-4 oy", "title": "UX Research va Prototiplash", "resources": ["Nielsen Norman Group", "Coursera UX"]},
            {"month": "5-6 oy", "title": "Portfolio va Real Projects", "resources": ["Dribbble", "Behance"]},
        ],
        "riasec": [2, 5, 9, 6, 4, 3],
    },
    3: {
        "name": "Project Manager", "name_uz": "Loyiha menejeri",
        "required_skills": ["Boshqaruv", "Kommunikatsiya", "Agile", "Jira", "Risk Analysis", "Budjetlashtirish"],
        "avg_salary": "$100,000", "demand": "Yuqori", "growth": "+20%",
        "description_uz": "IT loyihalarni boshqarish, jamoani muvofiqlashtirish",
        "roadmap": [
            {"month": "1-2 oy", "title": "PM asoslari va Agile/Scrum", "resources": ["Google PM Certificate", "Scrum Guide"]},
            {"month": "3-4 oy", "title": "Jira, Risk va Budget", "resources": ["Atlassian University", "Coursera PM"]},
            {"month": "5-6 oy", "title": "PMP sertifikatsiya tayyorligi", "resources": ["PMI", "Udemy PMP Prep"]},
        ],
        "riasec": [2, 4, 3, 7, 8, 6],
    },
    4: {
        "name": "Cybersecurity Analyst", "name_uz": "Kiberxavfsizlik mutaxassisi",
        "required_skills": ["Tarmoq xavfsizligi", "Linux", "Python", "Penetration Testing", "SIEM", "Kriptografiya"],
        "avg_salary": "$105,000", "demand": "Juda yuqori", "growth": "+40%",
        "description_uz": "Tizim va ma'lumotlarni kiberhujumlardan himoya qilish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Tarmoq va Linux asoslari", "resources": ["CompTIA Network+", "Linux Academy"]},
            {"month": "3-4 oy", "title": "Xavfsizlik vositalari va Python", "resources": ["TryHackMe", "Hack The Box"]},
            {"month": "5-6 oy", "title": "CEH/Security+ tayyorligi", "resources": ["CompTIA Security+", "CEH Prep"]},
        ],
        "riasec": [6, 8, 2, 2, 3, 9],
    },
    5: {
        "name": "Mobile Developer", "name_uz": "Mobil dasturchi",
        "required_skills": ["React Native", "JavaScript", "UI Design", "API Integration", "Git", "Firebase"],
        "avg_salary": "$108,000", "demand": "Yuqori", "growth": "+22%",
        "description_uz": "iOS va Android uchun mobil ilovalar yaratish",
        "roadmap": [
            {"month": "1-2 oy", "title": "JavaScript va React asoslari", "resources": ["FreeCodeCamp React", "JavaScript.info"]},
            {"month": "3-4 oy", "title": "React Native va Firebase", "resources": ["React Native Docs", "Firebase Tutorials"]},
            {"month": "5-6 oy", "title": "App Store deploy va Portfolio", "resources": ["Expo Docs", "Real Projects"]},
        ],
        "riasec": [5, 7, 6, 3, 3, 6],
    },
    6: {
        "name": "DevOps Engineer", "name_uz": "DevOps muhandisi",
        "required_skills": ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS/Cloud", "Terraform"],
        "avg_salary": "$125,000", "demand": "Juda yuqori", "growth": "+45%",
        "description_uz": "Dasturiy ta'minotni avtomatlashtirish va infratuzilmani boshqarish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Linux va Docker chuqurlashtirilgan", "resources": ["Linux Foundation", "Docker Mastery"]},
            {"month": "3-4 oy", "title": "Kubernetes va CI/CD", "resources": ["KodeKloud", "GitHub Actions Docs"]},
            {"month": "5-6 oy", "title": "Cloud va Terraform", "resources": ["AWS Free Tier", "Terraform Tutorials"]},
        ],
        "riasec": [7, 7, 2, 2, 3, 9],
    },
    7: {
        "name": "AI/ML Engineer", "name_uz": "Sun'iy intellekt muhandisi",
        "required_skills": ["Python", "TensorFlow", "PyTorch", "Matematika", "NLP", "Computer Vision"],
        "avg_salary": "$135,000", "demand": "Juda yuqori", "growth": "+55%",
        "description_uz": "Sun'iy intellekt modellari va neural tarmoqlar yaratish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Matematika va Python ML", "resources": ["3Blue1Brown", "Coursera ML Specialization"]},
            {"month": "3-4 oy", "title": "Deep Learning va Frameworks", "resources": ["Fast.ai", "PyTorch Tutorials"]},
            {"month": "5-6 oy", "title": "NLP/CV va Research Papers", "resources": ["Hugging Face", "Papers With Code"]},
        ],
        "riasec": [4, 10, 5, 2, 2, 7],
    },
    # === YANGI KASBLAR ===
    8: {
        "name": "Frontend Developer", "name_uz": "Frontend dasturchi",
        "required_skills": ["JavaScript", "React", "HTML/CSS", "TypeScript", "Git", "Figma"],
        "avg_salary": "$100,000", "demand": "Yuqori", "growth": "+28%",
        "description_uz": "Veb saytlar va ilovalarning foydalanuvchi interfeysini yaratish",
        "roadmap": [
            {"month": "1-2 oy", "title": "HTML/CSS va JavaScript asoslari", "resources": ["The Odin Project", "CSS Tricks"]},
            {"month": "3-4 oy", "title": "React va TypeScript", "resources": ["React.dev", "TypeScript Handbook"]},
            {"month": "5-6 oy", "title": "Portfolio va ishga kirish", "resources": ["Frontend Mentor", "GitHub Portfolio"]},
        ],
        "riasec": [3, 7, 8, 3, 3, 5],
    },
    9: {
        "name": "Full Stack Developer", "name_uz": "Full Stack dasturchi",
        "required_skills": ["JavaScript", "React", "Node.js", "SQL", "Docker", "Git"],
        "avg_salary": "$115,000", "demand": "Juda yuqori", "growth": "+32%",
        "description_uz": "Frontend va backend ikkalasini ham qamrab oluvchi to'liq dasturiy yechimlar yaratish",
        "roadmap": [
            {"month": "1-2 oy", "title": "JavaScript va React asoslari", "resources": ["Full Stack Open", "FreeCodeCamp"]},
            {"month": "3-4 oy", "title": "Node.js, Express va SQL", "resources": ["Node.js Docs", "PostgreSQL Tutorial"]},
            {"month": "5-6 oy", "title": "Docker, Deploy va Portfolio", "resources": ["Docker Docs", "Vercel/Railway"]},
        ],
        "riasec": [4, 8, 5, 3, 3, 7],
    },
    10: {
        "name": "Data Engineer", "name_uz": "Ma'lumotlar muhandisi",
        "required_skills": ["Python", "SQL", "Apache Spark", "Kafka", "AWS", "Docker"],
        "avg_salary": "$118,000", "demand": "Juda yuqori", "growth": "+38%",
        "description_uz": "Katta hajmli ma'lumotlar quvurlarini (pipeline) loyihalash va qurish",
        "roadmap": [
            {"month": "1-2 oy", "title": "SQL va Python ma'lumotlar asoslari", "resources": ["Mode SQL Tutorial", "Python Data Science Handbook"]},
            {"month": "3-4 oy", "title": "Apache Spark va Kafka", "resources": ["Databricks Academy", "Confluent Learn"]},
            {"month": "5-6 oy", "title": "Cloud (AWS/GCP) va Orchestration", "resources": ["AWS Data Analytics", "Apache Airflow Docs"]},
        ],
        "riasec": [4, 9, 3, 2, 2, 9],
    },
    11: {
        "name": "Cloud Engineer", "name_uz": "Bulut muhandisi",
        "required_skills": ["AWS", "Kubernetes", "Terraform", "Linux", "Docker", "Python"],
        "avg_salary": "$122,000", "demand": "Juta yuqori", "growth": "+42%",
        "description_uz": "Bulut infratuzilmasini loyihalash, qurish va boshqarish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Linux va Cloud asoslari", "resources": ["AWS Cloud Practitioner", "Linux Foundation"]},
            {"month": "3-4 oy", "title": "Kubernetes va Terraform", "resources": ["KodeKloud K8s", "HashiCorp Learn"]},
            {"month": "5-6 oy", "title": "AWS Solutions Architect sertifikati", "resources": ["Adrian Cantrill Course", "AWS Practice Exams"]},
        ],
        "riasec": [7, 8, 2, 2, 3, 9],
    },
    12: {
        "name": "QA Engineer", "name_uz": "Sifat nazorati muhandisi",
        "required_skills": ["Selenium", "Python", "Testing", "Agile", "Git", "Jira"],
        "avg_salary": "$88,000", "demand": "O'rta", "growth": "+15%",
        "description_uz": "Dasturiy ta'minotning sifatini tekshirish va avtomatlashtirilgan test yozish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Dasturiy ta'minot testlash asoslari", "resources": ["ISTQB Foundation", "Testing with Python"]},
            {"month": "3-4 oy", "title": "Selenium va API Testing", "resources": ["Selenium WebDriver", "Postman Learning"]},
            {"month": "5-6 oy", "title": "CI/CD integratsiya va ISTQB", "resources": ["GitHub Actions", "ISTQB Certification"]},
        ],
        "riasec": [4, 7, 3, 4, 2, 9],
    },
    13: {
        "name": "Business Analyst", "name_uz": "Biznes tahlilchi",
        "required_skills": ["SQL", "Excel", "Kommunikatsiya", "Agile", "Vizualizatsiya", "Boshqaruv"],
        "avg_salary": "$92,000", "demand": "O'rta", "growth": "+18%",
        "description_uz": "Biznes jarayonlarini tahlil qilib, IT yechimlar orqali muammolarni hal qilish",
        "roadmap": [
            {"month": "1-2 oy", "title": "SQL va Excel chuqurlashtirilgan", "resources": ["Mode SQL", "Excel Jet"]},
            {"month": "3-4 oy", "title": "Biznes talablar va UML", "resources": ["BA Guild", "Lucidchart UML"]},
            {"month": "5-6 oy", "title": "CBAP sertifikati tayyorligi", "resources": ["IIBA", "Udemy BA Course"]},
        ],
        "riasec": [2, 6, 3, 7, 7, 7],
    },
    14: {
        "name": "Blockchain Developer", "name_uz": "Blokcheyn dasturchisi",
        "required_skills": ["Solidity", "JavaScript", "Web3", "Smart Contracts", "Kriptografiya", "Python"],
        "avg_salary": "$130,000", "demand": "O'sib bormoqda", "growth": "+60%",
        "description_uz": "Blokcheyn platformalarda smart kontraktlar va desentrallashgan ilovalar (DApp) yaratish",
        "roadmap": [
            {"month": "1-2 oy", "title": "Blokcheyn asoslari va Solidity", "resources": ["CryptoZombies", "Ethereum.org Learn"]},
            {"month": "3-4 oy", "title": "Smart Kontraktlar va Hardhat", "resources": ["Hardhat Docs", "OpenZeppelin"]},
            {"month": "5-6 oy", "title": "DeFi/NFT loyiha va Audit", "resources": ["Alchemy University", "Code4rena"]},
        ],
        "riasec": [4, 9, 5, 2, 4, 7],
    },
}


def load_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None


def prepare_features(riasec_scores: dict, skills: list, academic_data: dict) -> np.ndarray:
    features = [
        riasec_scores.get("R", 0), riasec_scores.get("I", 0),
        riasec_scores.get("A", 0), riasec_scores.get("S", 0),
        riasec_scores.get("E", 0), riasec_scores.get("C", 0),
        academic_data.get("gpa", 3.0),
        academic_data.get("analytical", 5),
        academic_data.get("communication", 5),
    ]
    for skill in SKILLS_LIST:
        features.append(1 if skill in skills else 0)
    return np.array(features).reshape(1, -1)


def predict_career(riasec_scores: dict, skills: list, academic_data: dict) -> list:
    """Top 3 kasbni bashorat qiladi — 15 ta kasb orasidan."""
    user_vec = np.array([
        riasec_scores.get("R", 0), riasec_scores.get("I", 0),
        riasec_scores.get("A", 0), riasec_scores.get("S", 0),
        riasec_scores.get("E", 0), riasec_scores.get("C", 0),
    ], dtype=float)

    # ML model 0-7 uchun probabilities
    ml_scores = {}
    model_data = load_model()
    if model_data is not None:
        try:
            model = model_data["model"]
            X = prepare_features(riasec_scores, skills, academic_data)
            probas = model.predict_proba(X)[0]
            for i, p in enumerate(probas):
                ml_scores[i] = float(p)
        except Exception:
            pass

    # Cosine similarity barcha 15 kasb uchun
    scores = {}
    for occ_id, occ in OCCUPATIONS_META.items():
        occ_vec = np.array(occ["riasec"], dtype=float)
        norm = np.linalg.norm(user_vec) * np.linalg.norm(occ_vec)
        cosine = float(np.dot(user_vec, occ_vec) / norm) if norm > 0 else 0

        matched = sum(1 for s in skills if s in occ["required_skills"])
        skill_ratio = matched / len(occ["required_skills"]) if occ["required_skills"] else 0

        gpa_bonus = (academic_data.get("gpa", 3.0) / 5.0) * 0.05
        analytical = (academic_data.get("analytical", 5) / 10.0) * 0.05
        comm = (academic_data.get("communication", 5) / 10.0) * 0.03

        if occ_id in ml_scores:
            # ML + cosine hybrid
            combined = (ml_scores[occ_id] * 0.55) + (cosine * 0.28) + (skill_ratio * 0.12) + gpa_bonus + analytical + comm
        else:
            combined = (cosine * 0.55) + (skill_ratio * 0.30) + gpa_bonus + analytical + comm

        scores[occ_id] = combined

    top3 = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]

    results = []
    for occ_id, raw_score in top3:
        occ = OCCUPATIONS_META[occ_id]
        display_score = int(min(max(round(raw_score * 100), 35), 97))
        results.append({
            "id": occ_id,
            "name": occ["name"],
            "name_uz": occ["name_uz"],
            "score": display_score,
            "avg_salary": occ["avg_salary"],
            "demand": occ.get("demand", "O'rta"),
            "growth": occ.get("growth", "+15%"),
            "description_uz": occ["description_uz"],
            "required_skills": occ["required_skills"],
            "roadmap": occ["roadmap"],
        })
    return results


def analyze_skills_gap(user_skills: list, occupation_id: int) -> dict:
    occ = OCCUPATIONS_META.get(occupation_id)
    if not occ:
        return {"error": "Kasb topilmadi"}
    required = occ["required_skills"]
    matched = [s for s in required if s in user_skills]
    missing = [s for s in required if s not in user_skills]
    match_percent = round((len(matched) / len(required)) * 100) if required else 0
    return {
        "occupation": occ["name_uz"],
        "required_skills": required,
        "matched_skills": matched,
        "missing_skills": missing,
        "match_percent": match_percent,
    }


def get_roadmap(occupation_id: int) -> dict:
    occ = OCCUPATIONS_META.get(occupation_id)
    if not occ:
        return {"error": "Kasb topilmadi"}
    return {
        "occupation": occ["name_uz"],
        "duration": "6 oy",
        "phases": occ["roadmap"],
    }
