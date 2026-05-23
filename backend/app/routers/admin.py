"""Admin paneli API — faqat administrator foydalanuvchilar uchun.

Endpointlar:
- GET    /api/admin/stats                  — umumiy statistika
- GET    /api/admin/system                 — tizim holati (backend, DB, model)
- GET    /api/admin/activity?days=N        — N kunlik kunlik faollik (signup + test)
- GET    /api/admin/top-careers?limit=N    — eng ko'p tavsiya etilgan kasblar
- GET    /api/admin/users                  — foydalanuvchilar ro'yxati
- GET    /api/admin/users/{user_id}        — foydalanuvchi tafsiloti
- DELETE /api/admin/users/{user_id}        — foydalanuvchini o'chirish (super-admin himoyalangan)
- PATCH  /api/admin/users/{user_id}/admin  — admin huquqi (super-admin himoyalangan)
- GET    /api/admin/users.csv              — CSV eksport
- GET    /api/admin/tests                  — test natijalari ro'yxati
- GET    /api/admin/tests/{test_id}        — test natijasi to'liq
- DELETE /api/admin/tests/{test_id}        — test natijasini o'chirish
- GET    /api/admin/occupations            — kasblar bazasi
"""

import csv
import io
import os
import sys
from collections import Counter
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, or_, text as sql_text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.test_result import TestResult
from app.routers.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============================================================
# Yordamchilar
# ============================================================

def _super_email() -> str:
    return (settings.SUPER_ADMIN_EMAIL or "").strip().lower()


def _is_super(user: User) -> bool:
    se = _super_email()
    return bool(se and (user.email or "").lower() == se)


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
        "is_super_admin": _is_super(u),
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

    recent_q = db.query(User).order_by(User.created_at.desc()).limit(5).all()
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
# Tizim holati
# ============================================================

@router.get("/system")
def admin_system(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Backend, DB va ML model holati."""
    # DB ping
    db_ok = False
    db_error = None
    try:
        db.execute(sql_text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_error = str(e)[:200]

    # ML model fayli
    from pathlib import Path
    model_path = Path(__file__).resolve().parent.parent / "ml" / "saved" / "content_based.pkl"
    model_ok = model_path.exists()
    model_size = model_path.stat().st_size if model_ok else 0

    return {
        "backend": {
            "status": "ok",
            "python": sys.version.split()[0],
            "platform": sys.platform,
        },
        "database": {
            "status": "ok" if db_ok else "error",
            "error": db_error,
        },
        "ml_model": {
            "status": "ok" if model_ok else "missing",
            "path": str(model_path),
            "size_bytes": model_size,
        },
        "config": {
            "super_admin_email": _super_email(),
            "has_brevo_api_key": bool(settings.BREVO_API_KEY),
            "has_admin_email_env": bool(os.environ.get("ADMIN_EMAIL")),
            "token_ttl_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        },
        "server_time": datetime.utcnow().isoformat() + "Z",
    }


# ============================================================
# Faollik (signup + test) — oxirgi N kun
# ============================================================

@router.get("/activity")
def admin_activity(
    days: int = Query(7, ge=1, le=60),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Oxirgi N kunda har kuni ro'yxatdan o'tgan user va topshirilgan test soni."""
    now = datetime.utcnow()
    start = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    # Userlar
    users_rows = (
        db.query(func.date(User.created_at).label("d"), func.count(User.id))
        .filter(User.created_at >= start)
        .group_by(func.date(User.created_at))
        .all()
    )
    u_map = {str(r[0]): int(r[1]) for r in users_rows}

    # Testlar
    tests_rows = (
        db.query(func.date(TestResult.created_at).label("d"), func.count(TestResult.id))
        .filter(TestResult.created_at >= start)
        .group_by(func.date(TestResult.created_at))
        .all()
    )
    t_map = {str(r[0]): int(r[1]) for r in tests_rows}

    series = []
    for i in range(days):
        day = (start + timedelta(days=i)).date()
        key = day.isoformat()
        series.append({
            "date": key,
            "users": u_map.get(key, 0),
            "tests": t_map.get(key, 0),
        })

    return {
        "days": days,
        "series": series,
        "totals": {
            "users": sum(s["users"] for s in series),
            "tests": sum(s["tests"] for s in series),
        },
    }


# ============================================================
# Eng ko'p tavsiya etilgan kasblar
# ============================================================

@router.get("/top-careers")
def admin_top_careers(
    limit: int = Query(10, ge=1, le=50),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Barcha test natijalaridagi `recommendations` ichida eng ko'p uchragan kasblar."""
    rows = db.query(TestResult.recommendations).filter(TestResult.recommendations.isnot(None)).all()
    counter: Counter = Counter()
    for (recs,) in rows:
        if not isinstance(recs, list):
            continue
        for r in recs:
            if not isinstance(r, dict):
                continue
            name = r.get("name_uz") or r.get("name") or (
                (r.get("occupation") or {}).get("name_uz") if isinstance(r.get("occupation"), dict) else None
            ) or (
                (r.get("occupation") or {}).get("name") if isinstance(r.get("occupation"), dict) else None
            )
            if name:
                counter[str(name)] += 1

    top = [{"name": k, "count": v} for k, v in counter.most_common(limit)]
    return {"total_distinct": len(counter), "items": top}


# ============================================================
# Foydalanuvchilar
# ============================================================

@router.get("/users")
def list_users(
    q: Optional[str] = Query(None),
    only: Optional[str] = Query(None, description="all|admins|verified|unverified"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if q:
        pattern = f"%{q.strip().lower()}%"
        query = query.filter(or_(
            func.lower(User.username).like(pattern),
            func.lower(User.email).like(pattern),
            func.lower(func.coalesce(User.full_name, "")).like(pattern),
        ))
    if only == "admins":
        query = query.filter(User.is_admin == True)  # noqa: E712
    elif only == "verified":
        query = query.filter(User.is_verified == True)  # noqa: E712
    elif only == "unverified":
        query = query.filter(User.is_verified == False)  # noqa: E712

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

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


@router.get("/users.csv")
def export_users_csv(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Barcha foydalanuvchilarni CSV faylga eksport qiladi."""
    users = db.query(User).order_by(User.created_at.asc()).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "username", "email", "full_name", "region",
                "is_verified", "is_admin", "is_super_admin", "created_at"])
    for u in users:
        w.writerow([
            u.id, u.username, u.email, u.full_name or "", u.region or "",
            bool(u.is_verified), bool(u.is_admin), _is_super(u),
            u.created_at.isoformat() if u.created_at else "",
        ])
    buf.seek(0)
    fname = f"kasbim-users-{datetime.utcnow():%Y%m%d-%H%M}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@router.get("/users/{user_id}")
def user_detail(
    user_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi to'liq tafsiloti + uning test tarixi."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    tests = (
        db.query(TestResult)
        .filter(TestResult.user_id == user_id)
        .order_by(TestResult.created_at.desc())
        .limit(20)
        .all()
    )

    test_items = []
    for t in tests:
        recs = t.recommendations or []
        top = recs[0] if isinstance(recs, list) and recs else None
        top_name = None
        if isinstance(top, dict):
            top_name = top.get("name_uz") or top.get("name")
        test_items.append({
            "id": t.id,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "riasec_scores": t.riasec_scores,
            "top_recommendation": top_name,
            "recommendation_count": len(recs) if isinstance(recs, list) else 0,
        })

    return {
        "user": {
            **_user_brief(u, len(tests)),
            "avatar_url": u.avatar_url,
            "date_of_birth": u.date_of_birth.isoformat() if u.date_of_birth else None,
        },
        "tests": test_items,
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="O'zingizni o'chira olmaysiz")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    if _is_super(user):
        raise HTTPException(status_code=403, detail="Super-admin foydalanuvchini o'chirib bo'lmaydi")
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
    if user_id == admin.id and not payload.is_admin:
        raise HTTPException(status_code=400, detail="O'zingizdan admin huquqini olib tashlay olmaysiz")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    if _is_super(user) and not payload.is_admin:
        raise HTTPException(status_code=403, detail="Super-admindan adminlikni olib tashlab bo'lmaydi")
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
    query = db.query(TestResult, User).join(User, User.id == TestResult.user_id)
    if user_id is not None:
        query = query.filter(TestResult.user_id == user_id)
    total = query.count()
    rows = query.order_by(TestResult.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for tr, u in rows:
        recs = tr.recommendations or []
        top = recs[0] if isinstance(recs, list) and recs else None
        top_name = None
        if isinstance(top, dict):
            top_name = top.get("name_uz") or top.get("name")
        items.append({
            "id": tr.id,
            "user_id": tr.user_id,
            "username": u.username,
            "email": u.email,
            "created_at": tr.created_at.isoformat() if tr.created_at else None,
            "riasec_scores": tr.riasec_scores,
            "top_recommendation": top_name,
            "recommendation_count": len(recs) if isinstance(recs, list) else 0,
        })

    return {"total": total, "limit": limit, "offset": offset, "items": items}


@router.get("/tests/{test_id}")
def test_detail(
    test_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = (
        db.query(TestResult, User)
        .join(User, User.id == TestResult.user_id)
        .filter(TestResult.id == test_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Test natijasi topilmadi")
    tr, u = row
    return {
        "id": tr.id,
        "user": {"id": u.id, "username": u.username, "email": u.email},
        "created_at": tr.created_at.isoformat() if tr.created_at else None,
        "riasec_scores": tr.riasec_scores,
        "academic_data": tr.academic_data,
        "user_skills": tr.user_skills,
        "recommendations": tr.recommendations,
    }


@router.delete("/tests/{test_id}")
def delete_test(
    test_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tr = db.query(TestResult).filter(TestResult.id == test_id).first()
    if not tr:
        raise HTTPException(status_code=404, detail="Test natijasi topilmadi")
    db.delete(tr)
    db.commit()
    return {"ok": True, "message": "Test natijasi o'chirildi", "id": test_id}


# ============================================================
# Kasblar bazasi
# ============================================================

@router.get("/occupations")
def list_occupations(
    _admin: User = Depends(require_admin),
):
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
