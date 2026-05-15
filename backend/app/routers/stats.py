"""Statistika endpointlari."""

from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.test_result import TestResult
from app.models.user import User
from app.services.ml_service import OCCUPATIONS_META

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("/live-users")
def get_live_users(db: Session = Depends(get_db)):
    """
    Oxirgi 15 daqiqada test topshirgan yoki ro'yxatdan o'tgan
    haqiqiy foydalanuvchilar sonini qaytaradi.
    """
    window = datetime.utcnow() - timedelta(minutes=15)

    active_testers = (
        db.query(func.count(func.distinct(TestResult.user_id)))
        .filter(TestResult.created_at >= window)
        .scalar()
    ) or 0

    new_users = (
        db.query(func.count(User.id))
        .filter(User.created_at >= window)
        .scalar()
    ) or 0

    total = active_testers + new_users

    return {
        "active_users": total,
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """
    Bosh sahifa uchun real statistikalar:
      - Foydalanuvchilar, testlar, kasblar
      - Bugun va shu hafta o'tkazilgan testlar
      - Oxirgi 15 daqiqada faol foydalanuvchilar
      - Eng mashhur 3 ta kasb
      - Eng ko'p uchragan dominant RIASEC tip
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    live_window = now - timedelta(minutes=15)

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_tests = db.query(func.count(TestResult.id)).scalar() or 0
    total_careers = len(OCCUPATIONS_META)

    tests_today = (
        db.query(func.count(TestResult.id))
        .filter(TestResult.created_at >= today_start)
        .scalar()
    ) or 0

    tests_this_week = (
        db.query(func.count(TestResult.id))
        .filter(TestResult.created_at >= week_start)
        .scalar()
    ) or 0

    active_now = (
        db.query(func.count(func.distinct(TestResult.user_id)))
        .filter(TestResult.created_at >= live_window)
        .scalar()
    ) or 0

    # Eng mashhur kasblar (so'nggi 100 ta test bashoratlaridan)
    recent_results = (
        db.query(TestResult)
        .order_by(TestResult.created_at.desc())
        .limit(100)
        .all()
    )

    career_counter = Counter()
    type_counter = Counter()

    for r in recent_results:
        items = (r.predictions or {}).get("top") or (r.predictions or {}).get("top3") or []
        if items:
            top = items[0]
            name_uz = top.get("name_uz") or top.get("name")
            if name_uz:
                career_counter[name_uz] += 1

        if r.riasec_scores:
            best = max(r.riasec_scores.items(), key=lambda x: x[1], default=None)
            if best:
                type_counter[best[0]] += 1

    cat_names = {
        "R": "Realistik", "I": "Tadqiqotchi", "A": "Ijodkor",
        "S": "Ijtimoiy", "E": "Tadbirkor", "C": "Konvensional",
    }

    popular_careers = [
        {"name": name, "count": count}
        for name, count in career_counter.most_common(3)
    ]

    top_type = None
    if type_counter:
        code, count = type_counter.most_common(1)[0]
        top_type = {"code": code, "name": cat_names.get(code, code), "count": count}

    return {
        "total_users": total_users,
        "total_tests": total_tests,
        "total_careers": total_careers,
        "tests_today": tests_today,
        "tests_this_week": tests_this_week,
        "active_now": active_now,
        "popular_careers": popular_careers,
        "top_dominant_type": top_type,
        "updated_at": now.isoformat(),
    }
