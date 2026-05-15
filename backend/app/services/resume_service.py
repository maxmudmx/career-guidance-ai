"""Rezume tahlil xizmati - PDF'dan kalit so'zlarni ajratib olish."""

import re
from io import BytesIO

import pdfplumber


# IT sohasidagi kalit so'zlar bazasi
TECH_KEYWORDS = {
    "programming": [
        "python", "javascript", "java", "c++", "c#", "go", "rust", "typescript",
        "php", "ruby", "swift", "kotlin", "scala", "r", "matlab"
    ],
    "frameworks": [
        "react", "angular", "vue", "django", "flask", "fastapi", "spring",
        "express", "next.js", "nuxt", "svelte", "tailwind", "bootstrap"
    ],
    "databases": [
        "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
        "firebase", "dynamodb", "oracle", "sqlite"
    ],
    "devops": [
        "docker", "kubernetes", "aws", "azure", "gcp", "terraform",
        "jenkins", "github actions", "ci/cd", "nginx", "linux"
    ],
    "data_science": [
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "pandas", "numpy", "scikit-learn", "nlp", "computer vision",
        "data analysis", "statistics", "tableau", "power bi"
    ],
    "design": [
        "figma", "sketch", "adobe xd", "photoshop", "illustrator",
        "ui/ux", "wireframe", "prototype", "user research"
    ],
    "management": [
        "agile", "scrum", "jira", "project management", "leadership",
        "communication", "risk management", "budget", "stakeholder"
    ],
    "security": [
        "cybersecurity", "penetration testing", "firewall", "encryption",
        "siem", "vulnerability", "compliance", "iso 27001"
    ],
    "soft_skills": [
        "teamwork", "problem solving", "critical thinking", "communication",
        "leadership", "time management", "adaptability", "creativity"
    ],
}


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """PDF fayldan matn ajratib oladi."""
    text = ""
    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise ValueError(f"PDF o'qishda xatolik: {str(e)}")
    return text


def extract_keywords(text: str) -> dict:
    """Matndan kalit so'zlarni ajratib oladi."""
    text_lower = text.lower()
    found_keywords = {}

    for category, keywords in TECH_KEYWORDS.items():
        matches = []
        for keyword in keywords:
            # So'z chegaralari bilan qidirish
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text_lower):
                matches.append(keyword)
        if matches:
            found_keywords[category] = matches

    return found_keywords


def calculate_match(extracted_keywords: dict, occupation_skills: list, raw_text: str = "") -> dict:
    """
    Rezumedagi kalit so'zlar va kasb talablarini solishtiradi.

    Returns:
        {"match_percent": 75, "matched": [...], "missing": [...]}
    """
    # Barcha topilgan kalit so'zlarni tekis ro'yxatga aylantirish
    all_found = set()
    for keywords in extracted_keywords.values():
        all_found.update(k.lower() for k in keywords)

    text_lower = raw_text.lower()

    # Kasb ko'nikmalari bilan solishtirish
    # 1) TECH_KEYWORDS orqali topilgan kalit so'zlar ichida qidirish
    # 2) Bevosita PDF matnida qidirish (aniqroq moslik uchun)
    matched = []
    missing = []
    for skill in occupation_skills:
        skill_lower = skill.lower()
        if skill_lower in all_found:
            matched.append(skill)
        elif text_lower and re.search(r'\b' + re.escape(skill_lower) + r'\b', text_lower):
            matched.append(skill)
        else:
            missing.append(skill)

    match_percent = round((len(matched) / len(occupation_skills)) * 100) if occupation_skills else 0

    return {
        "match_percent": match_percent,
        "matched_skills": matched,
        "missing_skills": missing,
        "all_extracted_keywords": {cat: kws for cat, kws in extracted_keywords.items()},
        "total_keywords_found": sum(len(v) for v in extracted_keywords.values()),
    }


def analyze_resume(pdf_bytes: bytes, occupation_skills: list) -> dict:
    """To'liq rezume tahlili - PDF'ni o'qish, kalit so'zlar, moslik."""
    text = extract_text_from_pdf(pdf_bytes)
    if not text.strip():
        return {
            "extracted_text_length": 0,
            "keywords": {},
            "match_analysis": {
                "match_percent": 0,
                "matched_skills": [],
                "missing_skills": occupation_skills,
                "all_extracted_keywords": {},
                "total_keywords_found": 0,
            },
            "warning": "PDF'dan matn ajratib bo'lmadi. Skaner qilingan PDF bo'lishi mumkin.",
        }

    keywords = extract_keywords(text)
    match_result = calculate_match(keywords, occupation_skills, raw_text=text)

    return {
        "extracted_text_length": len(text),
        "keywords": keywords,
        "match_analysis": match_result,
    }
