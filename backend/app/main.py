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

from app.routers import auth, test, prediction

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


@app.on_event("startup")
def create_tables():
    from app.database import engine, Base
    Base.metadata.create_all(bind=engine)


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
