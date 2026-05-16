"""
Kasbim — FastAPI asosiy fayli (ML Recommender System diplomi versiyasi)
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.on_event("startup")
def create_tables():
    from app.database import engine, Base
    Base.metadata.create_all(bind=engine)


@app.on_event("startup")
def ensure_ml_model():
    """Agar ML model fayli yo'q bo'lsa, faqat Content-Based modelni tezda tayyorlash.

    To'liq pipeline (5 model + alpha tuning) yarim daqiqa o'rniga 5-7 daqiqa oladi —
    bu startup'ni bloklaydi va Render port ochilishini kutib timeout qiladi.
    Shuning uchun bu yerda faqat production'da kerak bo'lgan CB modelni saqlaymiz.
    """
    from pathlib import Path
    import joblib
    model_path = Path(__file__).parent / "ml" / "saved" / "content_based.pkl"
    if model_path.exists():
        return
    logging.info("ML model fayli yo'q, Content-Based tayyorlanmoqda: %s", model_path)
    try:
        from app.ml.content_based import ContentBasedRecommender
        model_path.parent.mkdir(parents=True, exist_ok=True)
        cb = ContentBasedRecommender().fit()  # tez — faqat career feature matritsani quradi
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
        "endpoints": {
            "auth": "/api/auth",
            "test": "/api/test",
            "predict": "/api/predict",
        },
    }


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
