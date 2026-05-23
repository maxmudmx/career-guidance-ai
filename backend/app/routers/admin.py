"""Admin paneli API — faqat administrator foydalanuvchilar uchun.

Endpointlar:
- GET    /api/admin/stats                  — umumiy statistika
- GET    /api/admin/users                  — foydalanuvchilar ro'yxati (qidiruv + pagination)
- DELETE /api/admin/users/{user_id}        — foydalanuvchini o'chirish
- PATCH  /api/admin/users/{user_id}/admin  — admin huquqini berish/olib tashlash
- GET    /api/admin/tests                  — test natijalari ro'yxati
- DELETE /api/admin/tests/{test_id}        — test natijasini o'chirish
- GET    /api/admin/occupations            — kasblar bazasi haqida qisqacha
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.routers.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============================================================
# Sxemalar
# ============================================================

class AdminToggleRequest(BaseModel):
    is_admin: bool


def _user_brief(u: User, test_count: int = 0) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "full_name": u.full_name,
        "region": u.region,
        "is_verified": bool(getattr(u, "is_verified", False)),
        "is_admin": bool(getattr(u, "is_admin", False)),
        "test_count": test_count,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


# ============================================================
# Stats — Dashboard
# ============================================================

@router.get("/stats")
def admin_stats(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Boshqaruv paneli uchun umumiy statistika."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    total_users = db.query(User).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()  # noqa: E712
    admin_users = db.query(User).filter(User.is_admin == True).count()  # noqa: E712
    total_tests = db.query(TestResult).count()
    tests_today = db.query(TestResult).filter(TestResult.created_at >= today_start).count()
    tests_this_week = db.query(TestResult).filter(TestResult.created_at >= week_ago).count()
    users_this_week = db.query(User).filter(User.created_at >= week_ago).count()

    # Eng ko'p test topshirgan 5 foydalanuvchi
    top_users_q = (
        db.query(User, func.count(TestResult.id).label("cnt"))
        .outerjoin(TestResult, TestResult.user_id == User.id)
        .group_by(User.id)
        .order_by(func.count(TestResult.id).desc())
        .limit(5)
        .all()
    )
    top_users = [
        {"id": u.id, "username": u.username, "test_count": int(cnt)}
        for u, cnt in top_users_q if cnt > 0
    ]

    # Oxirgi 5 ta ro'yxatdan o'tgan foydalanuvchi
    recent_q = (
        db.query(User).order_by(User.created_at.desc()).limit(5).all()
    )
    recent_users = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in recent_q
    ]

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "admin_users": admin_users,
        "total_tests": total_tests,
        "tests_today": tests_today,
        "tests_this_week": tests_this_week,
        "users_this_week": users_this_week,
        "top_users": top_users,
        "recent_users": recent_users,
    }


# ============================================================
# Foydalanuvchilar
# ============================================================

@router.get("/users")
def list_users(
    q: Optional[str] = Query(None, description="Username, email yoki ism bo'yicha qidiruv"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Foydalanuvchilar ro'yxati (qidiruv + pagination + test soni)."""
    query = db.query(User)
    if q:
        pattern = f"%{q.strip().lower()}%"
        query = query.filter(or_(
            func.lower(User.username).like(pattern),
            func.lower(User.email).like(pattern),
            func.lower(func.coalesce(User.full_name, "")).like(pattern),
        ))
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    # Har bir user uchun test sonini birgalikda olish
    ids = [u.id for u in users]
    counts_map: dict[int, int] = {}
    if ids:
        rows = (
            db.query(TestResult.user_id, func.count(TestResult.id))
            .filter(TestResult.user_id.in_(ids))
            .group_by(TestResult.user_id)
            .all()
        )
        counts_map = {uid: int(c) for uid, c in rows}

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_user_brief(u, counts_map.get(u.id, 0)) for u in users],
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Foydalanuvchini o'chirish (test natijalari kaskad bilan ketadi)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="O'zingizni o'chira olmaysiz")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    db.delete(user)
    db.commit()
    return {"ok": True, "message": "Foydalanuvchi o'chirildi", "id": user_id}


@router.patch("/users/{user_id}/admin")
def toggle_admin(
    user_id: int,
    payload: AdminToggleRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Foydalanuvchiga admin huquqini berish yoki olib tashlash."""
    if user_id == admin.id and not payload.is_admin:
        raise HTTPException(status_code=400, detail="O'zingizdan admin huquqini olib tashlay olmaysiz")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    user.is_admin = bool(payload.is_admin)
    db.commit()
    db.refresh(user)
    return {"ok": True, "id": user.id, "is_admin": bool(user.is_admin)}


# ============================================================
# Test natijalari
# ============================================================

@router.get("/tests")
def list_tests(
    user_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Barcha test natijalari (yoki bitta foydalanuvchining)."""
    query = db.query(TestResult, User).join(User, User.id == TestResult.user_id)
    if user_id is not None:
        query = query.filter(TestResult.user_id == user_id)
    total = query.count()
    rows = query.order_by(TestResult.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for tr, u in rows:
        recs = tr.recommendations or []
        items.append({
            "id": tr.id,
            "user_id": tr.user_id,
            "username": u.username,
            "email": u.email,
            "created_at": tr.created_at.isoformat() if tr.created_at else None,
            "riasec_scores": tr.riasec_scores,
            "top_recommendation": (recs[0] if isinstance(recs, list) and recs else None),
            "recommendation_count": len(recs) if isinstance(recs, list) else 0,
        })

    return {"total": total, "limit": limit, "offset": offset, "items": items}


@router.delete("/tests/{test_id}")
def delete_test(
    test_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Test natijasini o'chirish."""
    tr = db.query(TestResult).filter(TestResult.id == test_id).first()
    if not tr:
        raise HTTPException(status_code=404, detail="Test natijasi topilmadi")
    db.delete(tr)
    db.commit()
    return {"ok": True, "message": "Test natijasi o'chirildi", "id": test_id}


# ============================================================
# Kasblar bazasi (faqat o'qish)
# ============================================================

@router.get("/occupations")
def list_occupations(
    _admin: User = Depends(require_admin),
):
    """Kasblar bazasi haqida qisqa ma'lumot.

    Kasblar kod ichidagi taxonomiyadan o'qiladi (DBda emas), shuning uchun
    bu yerda faqat ro'yxat va kategoriyalar qaytariladi.
    """
    try:
        from app.data.occupations import OCCUPATIONS_META  # type: ignore
        occs = list(OCCUPATIONS_META.values())
    except Exception:
        occs = []

    items = []
    by_category: dict[str, int] = {}
    for o in occs:
        if not isinstance(o, dict):
            continue
        name = o.get("name")
        name_uz = o.get("name_uz")
        category = o.get("category")
        items.append({"name": name, "name_uz": name_uz, "category": category})
        if category:
            by_category[category] = by_category.get(category, 0) + 1

    return {
        "total": len(items),
        "by_category": [{"category": k, "count": v} for k, v in sorted(by_category.items())],
        "items": items,
    }
