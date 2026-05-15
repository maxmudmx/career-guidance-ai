"""
Job Scraper Service — HH.uz (HeadHunter) API orqali vakansiyalarni yuklash.

HH.uz hh.ru bilan bir xil API ishlatadi:
  GET https://api.hh.ru/vacancies?text=...&area=97&per_page=10
  area=97 → O'zbekiston
  area=2200 → Toshkent

Dokumentatsiya: https://api.hh.ru/openapi/redoc
"""

import httpx
import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.models.job import Job

logger = logging.getLogger(__name__)

# HH API
HH_BASE = "https://api.hh.ru"

def _get_hh_headers() -> dict:
    headers = {
        "User-Agent": "Kasbim/2.0 (career-guidance-ai; elmurodovmaxmud8@gmail.com)",
        "HH-User-Agent": "Kasbim/2.0",
    }
    hh_token = os.environ.get("HH_API_TOKEN")
    if hh_token:
        headers["Authorization"] = f"Bearer {hh_token}"
    return headers

HH_HEADERS = _get_hh_headers()

# Kasb ID → HH qidiruv so'zi
OCCUPATION_QUERIES = {
    0:  ["Data Scientist", "машинное обучение", "ML engineer"],
    1:  ["Backend разработчик", "Python разработчик", "Backend developer"],
    2:  ["UI UX дизайнер", "UX designer", "Figma дизайнер"],
    3:  ["Project Manager IT", "менеджер проектов", "Scrum Master"],
    4:  ["Специалист информационной безопасности", "Cybersecurity", "пентестер"],
    5:  ["Mobile разработчик", "React Native", "iOS Android разработчик"],
    6:  ["DevOps инженер", "DevOps engineer", "Kubernetes"],
    7:  ["AI ML инженер", "Deep Learning", "NLP инженер"],
    8:  ["Frontend разработчик", "React разработчик", "JavaScript developer"],
    9:  ["Full Stack разработчик", "Fullstack developer", "Node.js React"],
    10: ["Data Engineer", "ETL разработчик", "Apache Spark"],
    11: ["Cloud инженер", "AWS инженер", "Облачный инженер"],
    12: ["QA инженер", "тестировщик", "Selenium автоматизация"],
    13: ["Бизнес аналитик IT", "Business Analyst", "системный аналитик"],
    14: ["Blockchain разработчик", "Solidity developer", "Web3 разработчик"],
}

# Cache: qayta fetch qilish oralig'i (daqiqa)
CACHE_TTL_MINUTES = 60


def _format_salary(salary_data: Optional[dict]) -> tuple[Optional[int], Optional[int], str]:
    """HH salary ob'ektini parse qiladi."""
    if not salary_data:
        return None, None, "UZS"
    s_from = salary_data.get("from")
    s_to = salary_data.get("to")
    currency = salary_data.get("currency", "UZS")
    # UZS ga konversiya (taxminiy)
    rate = {"RUR": 140, "USD": 12800, "EUR": 14000, "KZT": 28}.get(currency, 1)
    return (
        int(s_from * rate) if s_from else None,
        int(s_to * rate) if s_to else None,
        "UZS",
    )


async def _fetch_hh_vacancies(query: str, area: int = 97, per_page: int = 8) -> list[dict]:
    """HH API dan vakansiyalarni async yuklaydi."""
    params = {
        "text": query,
        "area": area,
        "per_page": per_page,
        "order_by": "relevance",
        "search_field": "name",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{HH_BASE}/vacancies",
                params=params,
                headers=_get_hh_headers(),
            )
            if resp.status_code != 200:
                logger.warning(f"HH API {resp.status_code}: {query}")
                return []
            data = resp.json()
            return data.get("items", [])
    except Exception as e:
        logger.error(f"HH API xato ({query}): {e}")
        return []


def _parse_vacancy(item: dict, occupation_id: int) -> dict:
    """HH API item → bizning format."""
    salary = item.get("salary")
    s_from, s_to, currency = _format_salary(salary)

    employer = item.get("employer") or {}
    area = item.get("area") or {}
    experience = item.get("experience") or {}
    employment = item.get("employment") or {}
    snippet = item.get("snippet") or {}

    # Ko'rinish uchun matn
    description = snippet.get("requirement") or snippet.get("responsibility") or ""
    if description:
        # HTML teglarini olib tashlash
        import re
        description = re.sub(r"<[^>]+>", "", description)[:400]

    return {
        "hh_id": str(item.get("id", "")),
        "occupation_id": occupation_id,
        "title": item.get("name", "")[:300],
        "company": employer.get("name", "")[:200],
        "salary_from": s_from,
        "salary_to": s_to,
        "salary_currency": currency,
        "location": area.get("name", "O'zbekiston")[:100],
        "employment_type": employment.get("name", "")[:50],
        "experience": experience.get("name", "")[:100],
        "link": item.get("alternate_url", "")[:500],
        "description": description,
        "source": "hh.uz",
        "fetched_at": datetime.utcnow(),
    }


def is_cache_fresh(db: Session, occupation_id: int) -> bool:
    """So'nggi fetch yangi bo'lsa True qaytaradi."""
    threshold = datetime.utcnow() - timedelta(minutes=CACHE_TTL_MINUTES)
    count = (
        db.query(Job)
        .filter(Job.occupation_id == occupation_id, Job.fetched_at >= threshold)
        .count()
    )
    return count > 0


async def fetch_and_save_jobs(db: Session, occupation_id: int, force: bool = False) -> list[Job]:
    """
    1. Cache tekshiradi (60 daqiqa TTL)
    2. Eski bo'lsa HH API dan tortib keladi
    3. DB ga saqlaydi (dublikatsiz)
    4. So'nggi 15 vakansiyani qaytaradi
    """
    if not force and is_cache_fresh(db, occupation_id):
        return get_cached_jobs(db, occupation_id)

    queries = OCCUPATION_QUERIES.get(occupation_id, ["IT developer"])

    # Birinchi query bilan qidirish (parallel ham qilish mumkin, lekin rate limit sababli 1 ta)
    all_items = []
    for query in queries[:2]:  # ko'pi bilan 2 ta query
        items = await _fetch_hh_vacancies(query, area=97, per_page=8)
        all_items.extend(items)
        if len(all_items) >= 12:
            break

    if not all_items:
        # Fallback: area=1 (Moskva) ham qidiradi — ko'proq natija uchun
        items = await _fetch_hh_vacancies(queries[0], area=1, per_page=8)
        all_items.extend(items)

    # Ikki xil qidiruv so'zidan kelgan bir xil vakansiyani (hh_id bo'yicha) tashlab yuborish
    seen_hh_ids = set()
    unique_items = []
    for item in all_items:
        hh_id = str(item.get("id", ""))
        if hh_id and hh_id not in seen_hh_ids:
            seen_hh_ids.add(hh_id)
            unique_items.append(item)

    if unique_items:
        try:
            # Yangilik: bu kasbdagi eski yozuvlarni o'chirib, yangisini qo'yamiz.
            # Bu `(occupation_id, hh_id)` unique bo'yicha konfliktni butunlay yo'q qiladi.
            db.query(Job).filter(Job.occupation_id == occupation_id).delete(
                synchronize_session=False
            )
            db.flush()

            for item in unique_items:
                parsed = _parse_vacancy(item, occupation_id)
                db.add(Job(**parsed))

            db.commit()
            logger.info(f"occ={occupation_id}: {len(unique_items)} ta vakansiya saqlandi")
        except Exception as e:
            db.rollback()
            logger.error(f"DB saqlash xato: {e}")

    return get_cached_jobs(db, occupation_id)


def get_cached_jobs(db: Session, occupation_id: int, limit: int = 12) -> list[Job]:
    """DB dan eng yangi vakansiyalarni qaytaradi."""
    return (
        db.query(Job)
        .filter(Job.occupation_id == occupation_id)
        .order_by(Job.fetched_at.desc())
        .limit(limit)
        .all()
    )
