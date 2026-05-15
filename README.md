# Kasbim — Mashinali O'qitish Asosida Kasbga Yo'naltiruvchi Tizim

## Loyiha tuzilmasi

```
career-guidance-ai/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py          # FastAPI asosiy fayl
│   │   ├── config.py        # Konfiguratsiya
│   │   ├── database.py      # PostgreSQL ulanish
│   │   ├── models/          # SQLAlchemy modellari
│   │   │   ├── user.py
│   │   │   ├── test_result.py
│   │   │   └── occupation.py
│   │   ├── routers/         # API endpointlar
│   │   │   ├── auth.py
│   │   │   ├── test.py
│   │   │   ├── prediction.py
│   │   │   └── resume.py
│   │   ├── services/        # Biznes logika
│   │   │   ├── ml_service.py
│   │   │   ├── riasec_service.py
│   │   │   └── resume_service.py
│   │   └── ml/              # ML model fayllari
│   │       ├── train_model.py
│   │       └── career_model.pkl
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/      # Qayta ishlatiluvchi komponentlar
│   │   ├── pages/           # Sahifalar
│   │   └── services/        # API chaqiruvlari
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── init.sql             # SQL skriptlari
└── README.md
```

## O'rnatish

### 1. PostgreSQL bazasini sozlash
```bash
psql -U postgres -f database/init.sql
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # .env faylini sozlang
python app/ml/train_model.py    # ML modelni o'qitish
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
