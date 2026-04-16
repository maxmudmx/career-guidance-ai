"""
KasbYo'lAI - FastAPI asosiy fayli
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import os
import re

from app.routers import auth, test, prediction, resume, jobs, users, stats

app = FastAPI(
    title="KasbYo'lAI API",
    description="Mashinali o'qitish asosida kasbga yo'naltiruvchi axborot tizimi.",
    version="2.0.0",
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
app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(users.router)
app.include_router(stats.router)

# Static fayllar (avatarlar)
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(_static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=_static_dir), name="static")


@app.get("/", tags=["Root"])
def root():
    return {
        "app": "KasbYo'lAI",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "test": "/api/test",
            "predict": "/api/predict",
            "resume": "/api/resume",
            "chat": "/api/chat",
            "jobs": "/api/jobs/{occupation_id}",
        },
    }


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}


# ============================================================
# AI Chat endpoint
# ============================================================

class ChatMessage(BaseModel):
    message: str
    career_context: Optional[str] = None
    history: Optional[List[dict]] = []


CAREER_KNOWLEDGE = {
    "data scientist": {
        "uz": "Data Scientist — ma'lumotlarni tahlil qilib, ML modellari yaratuvchi mutaxassis. Python, SQL, statistika va Machine Learning bilishi zarur. O'rtacha maoshi $120,000.",
        "keywords": ["data", "scientist", "ma'lumot", "ml", "machine learning", "statistika"]
    },
    "backend": {
        "uz": "Backend Developer — server tomonidagi dasturlarni yozadi. Python (FastAPI, Django), SQL, Docker va API dizayn bilishi kerak. Maoshi $110,000 atrofida.",
        "keywords": ["backend", "server", "api", "python", "django", "fastapi"]
    },
    "frontend": {
        "uz": "Frontend Developer — veb saytlarning ko'rinadigan qismini yaratadi. JavaScript, React, HTML/CSS asosiy texnologiyalar. Maoshi $100,000 atrofida.",
        "keywords": ["frontend", "react", "javascript", "html", "css", "veb"]
    },
    "devops": {
        "uz": "DevOps muhandisi — avtomatlashtirish va infratuzilma bilan shug'ullanadi. Docker, Kubernetes, Linux, CI/CD bilishi kerak. Maoshi $125,000.",
        "keywords": ["devops", "docker", "kubernetes", "linux", "deployment", "infra"]
    },
    "ai": {
        "uz": "AI/ML muhandis — neural tarmoqlar va AI modellar yaratadi. Python, TensorFlow/PyTorch, matematika bilishi zarur. Maoshi $135,000 — eng yuqori!",
        "keywords": ["ai", "ml", "neural", "deep learning", "tensorflow", "pytorch", "sun'iy intellekt"]
    },
    "cybersecurity": {
        "uz": "Kiberxavfsizlik mutaxassisi — tizimlarni himoya qiladi. Linux, network security, Python, penetration testing zarur. Maoshi $105,000.",
        "keywords": ["cyber", "security", "xavfsizlik", "hacking", "penetration", "kriptografiya"]
    },
    "riasec": {
        "uz": "RIASEC — Holland kasb modeli. R=Realistik (amaliy), I=Tadqiqotchi, A=Ijodkor, S=Ijtimoiy, E=Tadbirkor, C=Konvensional. Sizning eng yuqori kategoriyalaringiz sizning tabiatiy moyilliklaringizni ko'rsatadi.",
        "keywords": ["riasec", "holland", "test", "psixometrik", "r", "i", "a", "s", "e", "c"]
    },
    "salary": {
        "uz": "IT sohasidagi o'rtacha oylik maoshlar: AI/ML $135K, DevOps $125K, Data Scientist $120K, Cloud Engineer $122K, Full Stack $115K, Blockchain $130K. O'zbekistonda bu raqamlar 3-5 barobar pastroq, lekin tez o'smoqda.",
        "keywords": ["maosh", "salary", "pul", "daromad", "earn", "pay"]
    },
    "skills": {
        "uz": "Skills gap — sizning hozirgi ko'nikmalaringiz bilan kasb talablari orasidagi farq. Dashboard → Ko'nikmalar bo'limida batafsil ko'rishingiz mumkin. Yetishmayotgan ko'nikmalarni Roadmap orqali o'rganing.",
        "keywords": ["skills", "ko'nikma", "gap", "bilim", "o'rgan"]
    },
    "roadmap": {
        "uz": "Yo'l xaritasi — 6 oylik o'quv rejasi. Har bir bosqichda aniq manbalar: Coursera, YouTube, official docs. Dashboard → Yo'l xaritasi bo'limidan ko'ring.",
        "keywords": ["roadmap", "yo'l", "reja", "plan", "o'rgan", "kurs"]
    },
}


def smart_chat_response(message: str, career_context: Optional[str]) -> str:
    msg_lower = message.lower()

    # Salomlashish
    if any(w in msg_lower for w in ["salom", "assalomu", "hello", "hi", "hey", "xayr", "rahmat"]):
        return ("Assalomu alaykum! Men KasbYo'lAI yordamchisiman. "
                "Kasb tanlash, ko'nikmalar, maoshlar yoki RIASEC test haqida savollaringizga javob beraman. "
                "Nima so'rashni istaysiz?")

    # Career context bilan javob
    if career_context:
        career_lower = career_context.lower()
        if any(w in msg_lower for w in ["qanday", "nima", "tushuntir", "explain", "haqida"]):
            for key, info in CAREER_KNOWLEDGE.items():
                if key in career_lower:
                    return info["uz"]

    # Kalit so'zlar bo'yicha javob
    for key, info in CAREER_KNOWLEDGE.items():
        if any(kw in msg_lower for kw in info["keywords"]):
            return info["uz"]

    # Umumiy savol
    if any(w in msg_lower for w in ["qaysi", "tanlash", "qanday kasb", "mos", "tavsiya"]):
        return ("Kasb tanlash uchun RIASEC testni to'ldiring. Natijalar sizning "
                "shaxsiyatingiz va qiziqishlaringizga mos kasblarni ko'rsatadi. "
                "Testni boshlash tugmasini bosing!")

    if any(w in msg_lower for w in ["o'rgan", "qayerdan", "kurs", "boshlash"]):
        return ("Eng yaxshi bepul resurslar: Coursera (Google sertifikatlari), "
                "freeCodeCamp (dasturlash), Kaggle (data science), YouTube (barcha mavzular), "
                "official documentation. Roadmap bo'limida kasbingizga mos resurslar bor!")

    if any(w in msg_lower for w in ["it", "dasturlash", "programm", "kod"]):
        return ("IT soha kelajagi yorqin! 2024-yilda eng talab yuqori yo'nalishlar: "
                "AI/ML (+55% o'sish), DevOps (+45%), Kiberxavfsizlik (+40%), "
                "Cloud Engineering (+42%), Data Engineering (+38%). "
                "Qaysi yo'nalish sizni qiziqtiradi?")

    # Default
    return ("Savolingizni tushunmadim. Quyidagi mavzularda yordam bera olaman:\n"
            "• Kasb tavsiflari va maoshlari\n"
            "• RIASEC test natijalari\n"
            "• Ko'nikmalar va o'rganish resurslari\n"
            "• IT bozor tendensiyalari\n\n"
            "Aniqroq savol bering!")


@app.post("/api/chat", tags=["Chat"])
async def chat(body: ChatMessage):
    """AI karriyer maslahatchi chatbot."""
    try:
        # Anthropic API mavjudligini tekshirish
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if api_key:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=api_key)

                system_prompt = (
                    "Siz KasbYo'lAI tizimining yordamchi chatbotiSiz. "
                    "Foydalanuvchilarga kasb tanlash, IT soha, ko'nikmalar rivojlantirish "
                    "va karera rejalash bo'yicha maslahat berасиz. "
                    "Javoblaringiz qisqa (2-4 gap), O'zbek tilida va do'stona bo'lsin. "
                    "Agar foydalanuvchi kasb kontekstini ko'rsatsa, shu kasb haqida gapiring."
                )
                if body.career_context:
                    system_prompt += f"\n\nFoydalanuvchi hozir {body.career_context} kasbi natijalarini ko'rmoqda."

                messages = []
                for h in (body.history or [])[-6:]:
                    if h.get("role") in ["user", "assistant"]:
                        messages.append({"role": h["role"], "content": h["content"]})
                messages.append({"role": "user", "content": body.message})

                response = client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=300,
                    system=system_prompt,
                    messages=messages,
                )
                return {"reply": response.content[0].text, "source": "claude"}
            except Exception:
                pass

        # Fallback: smart keyword-based response
        reply = smart_chat_response(body.message, body.career_context)
        return {"reply": reply, "source": "local"}

    except Exception as e:
        return {"reply": "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.", "error": str(e)}
