"""
Kasbim — FastAPI asosiy fayli (ML Recommender System diplomi versiyasi)
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    force=True,
)

from app.routers import auth, test, prediction, users

app = FastAPI(
    title="Kasbim API",
    description="ML asosli kasb tavsiya tizimi (Hybrid Recommender System)",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(test.router)
app.include_router(prediction.router)
app.include_router(users.router)


# Static fayllar (avatarlar)
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(os.path.join(_static_dir, "avatars"), exist_ok=True)
app.mount("/static", StaticFiles(directory=_static_dir), name="static")


@app.on_event("startup")
def create_tables():
    """DB jadvallarini yaratish va sodda migration."""
    from sqlalchemy import text
    from app.database import engine, Base

    # Eski email_verifications jadvalini faqat eski sxemada bo'lsa (token ustuni bilan) tozalash
    # Yangi sxemada `code` ustuni bo'ladi. Bir martalik migration.
    with engine.begin() as conn:
        try:
            has_code = conn.execute(text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='email_verifications' AND column_name='code'"
            )).fetchone()
            if not has_code:
                # Jadval mavjud emas yoki eski 'token' sxemada — tozalaymiz
                conn.execute(text("DROP TABLE IF EXISTS email_verifications CASCADE"))
                logging.info("Eski email_verifications jadvali tozalandi (token → code migratsiya)")
        except Exception as e:
            logging.warning("email_verifications migration check: %s", e)

    # Endi jadvallarni yaratamiz (email_verifications yangi sxemada)
    Base.metadata.create_all(bind=engine)

    # users jadvaliga yangi ustunlarni qo'shish (idempotent)
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT"
        ))
        # Eski VARCHAR(500) ni TEXT'ga o'tkazish (base64 data URL'lar uchun)
        try:
            conn.execute(text("ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT"))
        except Exception as e:
            logging.info("avatar_url TYPE migration: %s", e)
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(100)"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()"
        ))

        # test_results jadvalining yangi sxemaga moslashish
        conn.execute(text(
            "ALTER TABLE test_results ADD COLUMN IF NOT EXISTS recommendations JSONB"
        ))
        conn.execute(text(
            "ALTER TABLE test_results ADD COLUMN IF NOT EXISTS academic_data JSONB"
        ))
        conn.execute(text(
            "ALTER TABLE test_results ADD COLUMN IF NOT EXISTS user_skills VARCHAR[]"
        ))
        # Eski ustunlardan ba'zilari NOT NULL bo'lishi mumkin — nullable qilamiz
        try:
            conn.execute(text("ALTER TABLE test_results ALTER COLUMN predictions DROP NOT NULL"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE test_results ALTER COLUMN skills_gap DROP NOT NULL"))
        except Exception:
            pass
        # Mavjud foydalanuvchilarni grandfather qilish (1 daqiqa avval yaratilganlar)
        conn.execute(text(
            "UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE AND created_at < NOW() - INTERVAL '1 minute'"
        ))


@app.on_event("startup")
def ensure_ml_model():
    """Agar ML model fayli yo'q bo'lsa, Content-Based modelni tezda tayyorlash."""
    from pathlib import Path
    import joblib
    model_path = Path(__file__).parent / "ml" / "saved" / "content_based.pkl"
    if model_path.exists():
        return
    logging.info("ML model fayli yo'q, Content-Based tayyorlanmoqda: %s", model_path)
    try:
        from app.ml.content_based import ContentBasedRecommender
        model_path.parent.mkdir(parents=True, exist_ok=True)
        cb = ContentBasedRecommender().fit()
        joblib.dump(cb, model_path)
        logging.info("CB model saqlandi: %s", model_path)
    except Exception as e:
        logging.exception("ML model o'qitishda xato: %s", e)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": "Kasbim",
        "version": "3.0.0",
        "description": "ML Recommender System for Career Guidance",
        "docs": "/docs",
    }


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
