"""Rezume Tahlili API endpointlari."""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.resume_service import analyze_resume
from app.services.ml_service import OCCUPATIONS_META

router = APIRouter(prefix="/api/resume", tags=["Rezume Tahlili"])


@router.post("/analyze")
async def analyze(
    file: UploadFile = File(..., description="PDF rezume fayli"),
    occupation_id: int = 0,
):
    """
    Yuklangan PDF rezumeni tahlil qiladi.

    1. PDF'dan matnni ajratib oladi
    2. Kalit so'zlarni aniqlaydi (dasturlash tillari, frameworklar, va h.k.)
    3. Tanlangan kasb bilan moslik foizini hisoblaydi

    - file: PDF formatdagi rezume
    - occupation_id: Solishtiriladigan kasb ID'si (0-7)
    """
    # Fayl turini tekshirish
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Faqat PDF fayllar qabul qilinadi")

    # Fayl hajmini tekshirish (5 MB limit)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fayl hajmi 5 MB dan oshmasligi kerak")

    # Kasb ma'lumotlarini olish
    occ = OCCUPATIONS_META.get(occupation_id)
    if not occ:
        raise HTTPException(status_code=400, detail=f"Kasb ID {occupation_id} topilmadi")

    # Tahlil qilish
    try:
        result = analyze_resume(contents, occ["required_skills"])
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {
        "file_name": file.filename,
        "occupation": occ["name_uz"],
        **result,
    }


@router.get("/occupations")
def list_occupations():
    """Rezume solishtiruv uchun kasblar ro'yxatini qaytaradi."""
    return {
        "occupations": [
            {"id": k, "name": v["name"], "name_uz": v["name_uz"]}
            for k, v in OCCUPATIONS_META.items()
        ]
    }
