"""
Users / Profile router — /api/users
Himoyalangan: barcha endpointlar JWT talab qiladi.
"""

import os
import uuid
import shutil
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.routers.auth import require_auth
from app.services.ml_service import OCCUPATIONS_META

router = APIRouter(prefix="/api/users", tags=["Profile"])

# Avatarlar saqlanadigan papka
AVATAR_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# ── Sxemalar ──────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    target_occupation_id: Optional[int] = None


# ── Yordamchi: progress hisoblash ────────────────────────────

def _calc_progress(user_skills: list[str], occupation_id: int) -> dict:
    """Foydalanuvchi skillari bilan kasb talab qiladigan skilllarni solishtiradi."""
    occ = OCCUPATIONS_META.get(occupation_id)
    if not occ:
        return {"percent": 0, "matched": [], "missing": [], "total_required": 0}
    required = occ.get("required_skills", [])
    matched = [s for s in required if s in user_skills]
    missing = [s for s in required if s not in user_skills]
    percent = round(len(matched) / len(required) * 100) if required else 0
    return {
        "percent": percent,
        "matched": matched,
        "missing": missing,
        "total_required": len(required),
        "occupation_name": occ["name_uz"],
    }


def _latest_skills(user_id: int, db: Session) -> list[str]:
    """Foydalanuvchining oxirgi test natijasidan skilllarini oladi."""
    latest = (
        db.query(TestResult)
        .filter(TestResult.user_id == user_id)
        .order_by(TestResult.created_at.desc())
        .first()
    )
    if latest and latest.user_skills:
        return list(latest.user_skills)
    return []


def _latest_prediction_occ_id(user_id: int, db: Session) -> Optional[int]:
    """Oxirgi test natijasinig #1 bashorat kasb IDsini qaytaradi."""
    latest = (
        db.query(TestResult)
        .filter(TestResult.user_id == user_id)
        .order_by(TestResult.created_at.desc())
        .first()
    )
    if not latest or not latest.predictions:
        return None
    top3 = latest.predictions.get("top3", [])
    if top3:
        return top3[0].get("id")
    return None


# ── Endpointlar ───────────────────────────────────────────────

@router.get("/me")
def get_profile(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Joriy foydalanuvchi profili + progress foizi.
    Progress: (user_skills / target_occupation_skills) * 100
    """
    user_skills = _latest_skills(current_user.id, db)

    # Maqsad kasb: foydalanuvchi tanlagan yoki oxirgi test bashoratidan
    target_occ_id = current_user.target_occupation_id
    if target_occ_id is None:
        target_occ_id = _latest_prediction_occ_id(current_user.id, db)

    progress = None
    if target_occ_id is not None:
        progress = _calc_progress(user_skills, target_occ_id)

    # Statistika
    test_count = db.query(TestResult).filter(TestResult.user_id == current_user.id).count()

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "target_occupation_id": current_user.target_occupation_id,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "user_skills": user_skills,
        "progress": progress,
        "stats": {
            "test_count": test_count,
        },
    }


@router.patch("/me")
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Profil ma'lumotlarini yangilash (ism, maqsad kasb)."""
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip() or current_user.full_name
    if data.target_occupation_id is not None:
        if data.target_occupation_id not in OCCUPATIONS_META:
            raise HTTPException(status_code=400, detail="Noto'g'ri kasb ID")
        current_user.target_occupation_id = data.target_occupation_id
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return {"message": "Profil yangilandi", "user": {
        "full_name": current_user.full_name,
        "target_occupation_id": current_user.target_occupation_id,
    }}


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Avatar rasmini yuklash. Ruxsat etilgan: JPEG, PNG, WebP, GIF. Max: 5MB."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Rasm formati noto'g'ri. Ruxsat etilgan: JPEG, PNG, WebP, GIF",
        )

    # Fayl hajmini tekshirish
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Rasm hajmi 5 MB dan oshmasligi kerak")

    # Eski avatarni o'chirish
    if current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/")[-1]
        old_path = os.path.join(AVATAR_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)

    # Yangi faylni saqlash
    ext = file.content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"
    filename = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    save_path = os.path.join(AVATAR_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(content)

    avatar_url = f"/static/avatars/{filename}"
    current_user.avatar_url = avatar_url
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {"avatar_url": avatar_url, "message": "Avatar muvaffaqiyatli yangilandi"}


@router.get("/history")
def get_history(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Foydalanuvchining barcha RIASEC test natijalari va ML bashoratlarini
    vaqt bo'yicha teskari tartibda qaytaradi.
    """
    results = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .order_by(TestResult.created_at.desc())
        .all()
    )

    history = []
    for r in results:
        top_career = None
        if r.predictions and r.predictions.get("top3"):
            top3 = r.predictions["top3"]
            if top3:
                top_career = {
                    "name_uz": top3[0].get("name_uz"),
                    "score": top3[0].get("score"),
                    "id": top3[0].get("id"),
                }

        # RIASEC dominant type
        dominant = None
        if r.riasec_scores:
            cat_names = {"R": "Realistik", "I": "Tadqiqotchi", "A": "Ijodkor",
                         "S": "Ijtimoiy", "E": "Tadbirkor", "C": "Konvensional"}
            best = max(r.riasec_scores.items(), key=lambda x: x[1], default=None)
            if best:
                dominant = {"code": best[0], "name": cat_names.get(best[0], best[0]), "score": best[1]}

        history.append({
            "id": r.id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "riasec_scores": r.riasec_scores,
            "dominant_type": dominant,
            "user_skills": r.user_skills or [],
            "skills_count": len(r.user_skills or []),
            "top_career": top_career,
            "academic_data": r.academic_data,
        })

    return {
        "total": len(history),
        "history": history,
    }


@router.get("/occupations")
def list_occupations(current_user: User = Depends(require_auth)):
    """Barcha 15 ta kasb ro'yxatini qaytaradi (maqsad kasb tanlash uchun)."""
    return {
        "occupations": [
            {"id": occ_id, "name": occ["name"], "name_uz": occ["name_uz"],
             "avg_salary": occ["avg_salary"], "demand": occ.get("demand", "")}
            for occ_id, occ in OCCUPATIONS_META.items()
        ]
    }
