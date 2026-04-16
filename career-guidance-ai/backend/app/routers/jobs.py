"""Jobs router — /api/jobs (faqat autentifikatsiya qilingan foydalanuvchilar uchun)"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import require_auth
from app.models.user import User
from app.services.job_scraper import fetch_and_save_jobs, get_cached_jobs, OCCUPATION_QUERIES

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


def _job_to_dict(job) -> dict:
    """Job model → JSON-friendly dict."""
    salary_str = None
    if job.salary_from or job.salary_to:
        def fmt(n):
            return f"{n:,}".replace(",", " ") if n else None
        if job.salary_from and job.salary_to:
            salary_str = f"{fmt(job.salary_from)} – {fmt(job.salary_to)} {job.salary_currency}"
        elif job.salary_from:
            salary_str = f"{fmt(job.salary_from)}+ {job.salary_currency}"
        elif job.salary_to:
            salary_str = f"~{fmt(job.salary_to)} {job.salary_currency}"

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company or "Noma'lum",
        "salary": salary_str or "Kelishiladi",
        "salary_from": job.salary_from,
        "salary_to": job.salary_to,
        "location": job.location or "O'zbekiston",
        "employment_type": job.employment_type or "",
        "experience": job.experience or "",
        "link": job.link,
        "description": job.description or "",
        "source": job.source,
        "fetched_at": job.fetched_at.isoformat() if job.fetched_at else None,
    }


@router.get("/{occupation_id}")
async def get_jobs(
    occupation_id: int,
    force_refresh: bool = Query(False, description="Cache ni o'chirib qayta yuklash"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """
    Berilgan kasb uchun eng yangi vakansiyalarni qaytaradi.
    - Cache 60 daqiqa saqlanadi
    - force_refresh=true bilan majburiy qayta yuklash
    """
    if occupation_id not in OCCUPATION_QUERIES:
        return {
            "occupation_id": occupation_id,
            "jobs": [],
            "total": 0,
            "source": "hh.uz",
            "message": "Bu kasb uchun qidiruv so'zi topilmadi",
        }

    jobs = await fetch_and_save_jobs(db, occupation_id, force=force_refresh)

    return {
        "occupation_id": occupation_id,
        "jobs": [_job_to_dict(j) for j in jobs],
        "total": len(jobs),
        "source": "hh.uz",
        "cached": not force_refresh,
    }


@router.get("/{occupation_id}/stats")
def get_job_stats(
    occupation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """Kasb bo'yicha ish haqi statistikasi."""
    from sqlalchemy import func
    from app.models.job import Job

    stats = (
        db.query(
            func.count(Job.id).label("count"),
            func.avg(Job.salary_from).label("avg_from"),
            func.avg(Job.salary_to).label("avg_to"),
            func.min(Job.salary_from).label("min_salary"),
            func.max(Job.salary_to).label("max_salary"),
        )
        .filter(Job.occupation_id == occupation_id, Job.salary_from.isnot(None))
        .first()
    )

    return {
        "occupation_id": occupation_id,
        "total_vacancies": stats.count if stats else 0,
        "avg_salary_from": int(stats.avg_from) if stats and stats.avg_from else None,
        "avg_salary_to": int(stats.avg_to) if stats and stats.avg_to else None,
        "min_salary": stats.min_salary if stats else None,
        "max_salary": stats.max_salary if stats else None,
        "currency": "UZS",
    }
