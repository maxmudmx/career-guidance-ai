"""Progress tracking — /api/progress"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.user_progress import UserProgress
from app.models.test_result import TestResult
from app.routers.auth import require_auth
from app.services.ml_service import OCCUPATIONS_META, get_roadmap
from app.services.skill_quizzes import (
    get_quiz, check_answers, has_quiz, available_quiz_skills,
)

router = APIRouter(prefix="/api/progress", tags=["Progress"])


class ProgressSave(BaseModel):
    occupation_id: int
    completed_skills: list[str]


class QuizSubmit(BaseModel):
    skill: str
    answers: list[int]
    occupation_id: Optional[int] = None  # agar berilsa, muvaffaqiyatda completed_skills'ga qo'shiladi


@router.post("/save")
def save_progress(
    data: ProgressSave,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    occ = OCCUPATIONS_META.get(data.occupation_id)
    if not occ:
        return {"error": "Kasb topilmadi"}

    required = occ["required_skills"]
    matched = [s for s in required if s in data.completed_skills]
    percent = round(len(matched) / len(required) * 100) if required else 0

    existing = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id, UserProgress.occupation_id == data.occupation_id)
        .first()
    )
    if existing:
        existing.completed_skills = data.completed_skills
        existing.progress_percentage = percent
        existing.updated_at = datetime.utcnow()
    else:
        db.add(UserProgress(
            user_id=current_user.id,
            occupation_id=data.occupation_id,
            completed_skills=data.completed_skills,
            progress_percentage=percent,
        ))
    db.commit()
    return {"progress_percentage": percent, "matched_skills": matched}


@router.get("/{occupation_id}")
def get_progress(
    occupation_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    record = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id, UserProgress.occupation_id == occupation_id)
        .first()
    )

    # Latest user skills from test results
    latest = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .order_by(TestResult.created_at.desc())
        .first()
    )
    user_skills = list(latest.user_skills or []) if latest else []

    roadmap = get_roadmap(occupation_id, user_skills)

    return {
        "occupation_id": occupation_id,
        "occupation_name": OCCUPATIONS_META.get(occupation_id, {}).get("name_uz", ""),
        "progress_percentage": record.progress_percentage if record else 0,
        "completed_skills": list(record.completed_skills or []) if record else [],
        "user_skills": user_skills,
        "roadmap": roadmap,
        "updated_at": record.updated_at.isoformat() if record and record.updated_at else None,
    }


# ============================================================
# Skill quizzes — ko'nikmani haqiqiy o'zlashtirganini tekshirish
# ============================================================

@router.get("/skill-quiz/available")
def list_available_quizzes():
    """Quiz mavjud bo'lgan barcha ko'nikmalar ro'yxati."""
    return {"skills": available_quiz_skills()}


@router.get("/skill-quiz/{skill}")
def get_skill_quiz(skill: str, current_user: User = Depends(require_auth)):
    """Tanlangan ko'nikma uchun quiz savollarini olish (javoblarsiz)."""
    if not has_quiz(skill):
        raise HTTPException(
            status_code=404,
            detail=f"\"{skill}\" uchun quiz hozircha mavjud emas",
        )
    return {
        "skill": skill,
        "questions": get_quiz(skill),
        "passing_percent": 80,
    }


@router.post("/skill-quiz/submit")
def submit_skill_quiz(
    data: QuizSubmit,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Foydalanuvchi javoblarini tekshiradi va natijani saqlaydi:
      - Foiz va daraja qaytariladi (pass/fail emas)
      - Score ≥ 40% (intermediate+) bo'lsa ko'nikma user_skills'ga qo'shiladi
      - skill_scores (skill → foiz) test_result.academic_data'ga saqlanadi
    """
    if not has_quiz(data.skill):
        raise HTTPException(status_code=404, detail="Quiz topilmadi")

    result = check_answers(data.skill, data.answers)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # Foydalanuvchi profilidagi eng so'nggi test_result'ga skill_scores saqlaymiz
    latest = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .order_by(TestResult.created_at.desc())
        .first()
    )

    profile_updated = False
    if latest:
        academic = dict(latest.academic_data or {})
        scores = dict(academic.get("skill_scores") or {})
        scores[data.skill] = result["percent"]
        academic["skill_scores"] = scores
        latest.academic_data = academic

        # 40%+ olgan bo'lsa, ko'nikma user_skills'ga qo'shiladi
        if result["percent"] >= 40:
            current_skills = list(latest.user_skills or [])
            if data.skill not in current_skills:
                current_skills.append(data.skill)
                latest.user_skills = current_skills
        else:
            # 40%dan past — agar ilgari bor edi, olib tashlaymiz
            current_skills = list(latest.user_skills or [])
            if data.skill in current_skills:
                current_skills.remove(data.skill)
                latest.user_skills = current_skills

        db.commit()
        db.refresh(latest)
        profile_updated = True

    # Maqsadli kasb uchun UserProgress completed_skills'ga ham qo'shamiz
    # (faqat advanced+ daraja — 70%+ uchun)
    progress_updated = False
    new_progress_percent = None
    if result["percent"] >= 70 and data.occupation_id is not None:
        occ = OCCUPATIONS_META.get(data.occupation_id)
        if occ:
            record = (
                db.query(UserProgress)
                .filter(
                    UserProgress.user_id == current_user.id,
                    UserProgress.occupation_id == data.occupation_id,
                )
                .first()
            )
            if record:
                existing = list(record.completed_skills or [])
                if data.skill not in existing:
                    existing.append(data.skill)
                    record.completed_skills = existing
                    progress_updated = True
            else:
                record = UserProgress(
                    user_id=current_user.id,
                    occupation_id=data.occupation_id,
                    completed_skills=[data.skill],
                )
                db.add(record)
                progress_updated = True

            if progress_updated:
                required = occ.get("required_skills", [])
                matched = [s for s in required if s in (record.completed_skills or [])]
                record.progress_percentage = (
                    round(len(matched) / len(required) * 100) if required else 0
                )
                record.updated_at = datetime.utcnow()
                db.commit()
                new_progress_percent = record.progress_percentage

    return {
        **result,
        "profile_updated": profile_updated,
        "progress_updated": progress_updated,
        "new_progress_percent": new_progress_percent,
    }


@router.get("/")
def get_all_progress(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    records = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id)
        .order_by(UserProgress.updated_at.desc())
        .all()
    )
    result = []
    for r in records:
        occ = OCCUPATIONS_META.get(r.occupation_id, {})
        result.append({
            "occupation_id": r.occupation_id,
            "occupation_name": occ.get("name_uz", ""),
            "progress_percentage": r.progress_percentage,
            "completed_skills": list(r.completed_skills or []),
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        })
    return {"progress": result, "total": len(result)}
