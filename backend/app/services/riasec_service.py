"""RIASEC Test xizmati - skorlarni hisoblash."""


RIASEC_QUESTIONS = [
    {"id": 1, "text_uz": "Men asbob-uskunalar bilan ishlashni yoqtiraman", "category": "R"},
    {"id": 2, "text_uz": "Qo'lim bilan biror narsa yasash menga zavq beradi", "category": "R"},
    {"id": 3, "text_uz": "Texnik muammolarni hal qilish menga qiziq", "category": "R"},
    {"id": 4, "text_uz": "Kompyuter qurilmalarini yig'ish/ta'mirlash men uchun qiziqarli", "category": "R"},
    {"id": 5, "text_uz": "Men amaliy, qo'lga ko'rinadigan natijalarni afzal ko'raman", "category": "R"},
    {"id": 6, "text_uz": "Men ilmiy maqolalar o'qishni yoqtiraman", "category": "I"},
    {"id": 7, "text_uz": "Murakkab masalalarni yechish menga qiziq", "category": "I"},
    {"id": 8, "text_uz": "Men narsalarning ichki tuzilishini tushunishga intilaman", "category": "I"},
    {"id": 9, "text_uz": "Tadqiqot va tahlil qilish menga yoqadi", "category": "I"},
    {"id": 10, "text_uz": "Mantiqiy fikrlash mening kuchli tomonim", "category": "I"},
    {"id": 11, "text_uz": "Ijodiy loyihalar menga ilhom beradi", "category": "A"},
    {"id": 12, "text_uz": "Men o'zimni badiiy tomondan ifoda etishni yoqtiraman", "category": "A"},
    {"id": 13, "text_uz": "Dizayn va estetika menga muhim", "category": "A"},
    {"id": 14, "text_uz": "Men yangi g'oyalar yaratishda faolman", "category": "A"},
    {"id": 15, "text_uz": "Musiqa, san'at yoki yozuv bilan shug'ullanaman", "category": "A"},
    {"id": 16, "text_uz": "Odamlarga yordam berish menga zavq beradi", "category": "S"},
    {"id": 17, "text_uz": "Men jamoada ishlashni afzal ko'raman", "category": "S"},
    {"id": 18, "text_uz": "Boshqalarni o'qitish yoki maslahat berish menga yoqadi", "category": "S"},
    {"id": 19, "text_uz": "Muloqot qilish mening kuchli tomonim", "category": "S"},
    {"id": 20, "text_uz": "Men boshqalarning muammolarini hal qilishga tayyor", "category": "S"},
    {"id": 21, "text_uz": "Men rahbarlik qilishni yoqtiraman", "category": "E"},
    {"id": 22, "text_uz": "Biznes va tadbirkorlik menga qiziq", "category": "E"},
    {"id": 23, "text_uz": "Men boshqalarni ishontira olaman", "category": "E"},
    {"id": 24, "text_uz": "Qaror qabul qilishda tashabbuskor bo'laman", "category": "E"},
    {"id": 25, "text_uz": "Raqobat va muvaffaqiyat menga motivatsiya beradi", "category": "E"},
    {"id": 26, "text_uz": "Tartibli va tizimli ishlashni afzal ko'raman", "category": "C"},
    {"id": 27, "text_uz": "Ma'lumotlarni tartibga solish menga yoqadi", "category": "C"},
    {"id": 28, "text_uz": "Men qoidalarga rioya qilishni muhim deb bilaman", "category": "C"},
    {"id": 29, "text_uz": "Detallarga e'tibor berish mening kuchli tomonim", "category": "C"},
    {"id": 30, "text_uz": "Aniq ko'rsatmalar bo'yicha ishlash menga qulay", "category": "C"},
]

CATEGORY_NAMES = {
    "R": "Realistik",
    "I": "Tadqiqotchi",
    "A": "Ijodkor",
    "S": "Ijtimoiy",
    "E": "Tadbirkor",
    "C": "Konvensional",
}


def get_questions() -> list:
    """Barcha RIASEC savollarini qaytaradi."""
    return RIASEC_QUESTIONS


def calculate_riasec_scores(answers: dict[int, int]) -> dict:
    """
    Javoblardan RIASEC skorlarini hisoblaydi.

    Args:
        answers: {question_id: score(1-5)} lug'ati

    Returns:
        {"R": 7.2, "I": 8.5, ...} - 0-10 oralig'ida normallashtirilgan
    """
    scores = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
    counts = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}

    for q in RIASEC_QUESTIONS:
        qid = q["id"]
        if qid in answers:
            cat = q["category"]
            scores[cat] += answers[qid]
            counts[cat] += 1

    # Normallash: 0-10 oralig'iga
    normalized = {}
    for cat in scores:
        max_possible = counts[cat] * 5 if counts[cat] > 0 else 1
        normalized[cat] = round((scores[cat] / max_possible) * 10, 1)

    return normalized


def get_dominant_types(scores: dict, top_n: int = 3) -> list:
    """Eng yuqori RIASEC turlarini qaytaradi."""
    sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [
        {"code": cat, "name": CATEGORY_NAMES[cat], "score": score}
        for cat, score in sorted_cats[:top_n]
    ]
