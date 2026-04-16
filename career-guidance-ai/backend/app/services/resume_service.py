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


def calculate_match(extracted_keywords: dict, occupation_skills: list) -> dict:
    """
    Rezumedagi kalit so'zlar va kasb talablarini solishtiradi.

    Returns:
        {"match_percent": 75, "matched": [...], "missing": [...]}
    """
    # Barcha topilgan kalit so'zlarni tekis ro'yxatga aylantirish
    all_found = set()
    for keywords in extracted_keywords.values():
        all_found.update(k.lower() for k in keywords)

    # Kasb ko'nikmalari bilan solishtirish
    occ_skills_lower = [s.lower() for s in occupation_skills]
    matched = [s for s in occupation_skills if s.lower() in all_found]
    missing = [s for s in occupation_skills if s.lower() not in all_found]

    match_percent = round((len(matched) / len(occ_skills_lower)) * 100) if occ_skills_lower else 0

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
        return {"error": "PDF'dan matn ajratib bo'lmadi. Skaner qilingan PDF bo'lishi mumkin."}

    keywords = extract_keywords(text)
    match_result = calculate_match(keywords, occupation_skills)

    return {
        "extracted_text_length": len(text),
        "keywords": keywords,
        "match_analysis": match_result,
    }
