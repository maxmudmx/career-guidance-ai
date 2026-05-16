# Kasbim — ML Asosli Kasb Tavsiya Tizimi

> **Diplom ishi:** Mashinali o'qitish asosida kasbga yo'naltiruvchi tizim — Gibrid Recommender System

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)
![React](https://img.shields.io/badge/React-18-61DAFB)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E)

## Loyihaning mohiyati

303 ta kasb orasidan foydalanuvchining shaxsiyat profili (RIASEC), qiziqishlari va
akademik fanlardagi natijalariga eng mos top-5 kasbni tavsiya qiluvchi web tizim.

Asosida **Content-Based Filtering** (Cosine similarity) algoritmi, kelajakda
**Collaborative Filtering** va **Hybrid** modellar bilan kengaytirilgan.

## Asosiy natijalar

| Model | Precision@5 | NDCG@5 | Coverage |
|---|---|---|---|
| Random baseline | 1.65% | 0.009 | 100% |
| Popularity baseline | 1.65% | 0.010 | 3.3% |
| **Content-Based** | **88.45%** | **0.763** | **100%** |
| CF-NMF | 20.46% | 0.138 | 66% |
| CF-SVD | 47.52% | 0.356 | 97% |
| **Hybrid** | **88.45%** | **0.763** | **100%** |

📊 To'liq tahlil: [docs/DIPLOMA.md](docs/DIPLOMA.md) | [notebooks/diploma_analysis.ipynb](notebooks/diploma_analysis.ipynb)

## Loyiha tuzilmasi

```
career-guidance-ai/
├── backend/                      # FastAPI + ML
│   ├── app/
│   │   ├── main.py              # FastAPI ilovasi
│   │   ├── config.py            # Sozlamalar
│   │   ├── database.py          # PostgreSQL ulanish
│   │   ├── routers/             # API endpointlar
│   │   │   ├── auth.py          # Login/Register
│   │   │   ├── test.py          # RIASEC test
│   │   │   └── prediction.py    # ML Recommender API
│   │   ├── models/              # SQLAlchemy
│   │   ├── services/
│   │   │   └── riasec_service.py
│   │   ├── data/
│   │   │   ├── occupations.py   # 303 ta kasb
│   │   │   └── taxonomies.py    # Kategoriyalar, qiziqishlar
│   │   └── ml/                  # ⭐ Diplom asosiy qismi
│   │       ├── dataset.py       # Feature matrix + sintetik users
│   │       ├── content_based.py # Cosine similarity recommender
│   │       ├── collaborative.py # NMF/SVD CF
│   │       ├── hybrid.py        # Hybrid (Content + CF)
│   │       ├── evaluation.py    # Precision@K, NDCG, MRR...
│   │       ├── train.py         # 5 model taqqoslash pipeline
│   │       └── analysis.py      # Diplom grafiklarini chiqaradi
│   └── static/
├── frontend/                     # React + Vite
│   └── src/
│       ├── App.jsx              # Asosiy oqim
│       ├── pages/
│       │   ├── WelcomePage.jsx
│       │   ├── AuthPage.jsx
│       │   ├── TestIntroPage.jsx
│       │   ├── RiasecTest.jsx
│       │   ├── AcademicSkills.jsx
│       │   └── ResultsPage.jsx  # Top-5 tavsiyalar
│       └── services/api.js
├── notebooks/                    # ⭐ Diplom uchun
│   ├── diploma_analysis.ipynb   # Interaktiv tahlil
│   ├── results.csv              # Modellar metrikalari
│   ├── alpha_tuning.csv         # Hybrid α tuning
│   └── figures/                 # 8 ta grafik (png)
├── docs/                         # ⭐ Diplom hujjatlari
│   ├── DIPLOMA.md               # To'liq matn shakli
│   └── DEPLOYMENT.md            # Render deploy ko'rsatmasi
├── database/init.sql
├── requirements.txt
├── render.yaml                   # Render config
└── README.md
```

## Tezkor boshlash

### Lokal'da ishga tushirish

**Talablar:**
- Python 3.12+
- Node.js 18+
- PostgreSQL 15+

**1. Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r ..\requirements.txt
python -m app.ml.train          # ML modelni o'qitish
python -m uvicorn app.main:app --reload
```

Backend: http://localhost:8000  •  Docs: http://localhost:8000/docs

**2. Frontend (yangi terminalda):**
```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

### Production deploy

Render.com'ga deploy qilish uchun: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Joriy production:
- Frontend: https://kasbim-frontend.onrender.com
- Backend: https://career-guidance-ai-y3ku.onrender.com
- API docs: https://career-guidance-ai-y3ku.onrender.com/docs

## Diplom qismlari

### ML Pipeline (asosiy)

```powershell
cd backend

# 5 model taqqoslash
python -m app.ml.train

# Barcha grafiklarni chiqarish
python -m app.ml.analysis
```

### Jupyter notebook

```powershell
pip install jupyter
cd notebooks
jupyter notebook diploma_analysis.ipynb
```

### Hujjatlar
- [`docs/DIPLOMA.md`](docs/DIPLOMA.md) — diplom matn shakli (~80 sahifa)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deploy ko'rsatmasi
- [`notebooks/figures/`](notebooks/figures/) — 8 ta vizualizatsiya

## Algoritmlar

### Content-Based (asosiy)

```python
sim(u, c) = (u · c) / (||u|| · ||c||)
```

Foydalanuvchi vektor `u ∈ R^101` va kasb vektor `c ∈ R^101` orasidagi
kosinus o'xshashlik. Feature blok'lari:

| Blok | Dim |
|---|---|
| RIASEC (Holland) | 6 |
| Kategoriya (one-hot) | 30 |
| Qiziqishlar (multi-hot) | 33 |
| Fanlar (multi-hot) | 32 |

### Collaborative Filtering

```python
M ≈ U · V^T
M ∈ R^(users × careers)  (one-hot interaction'lar)
```

NMF/SVD bilan past o'lchovga proyeksiya, cold-start uchun
content k-NN fold-in strategiyasi.

### Hybrid

```python
score_hybrid = α · score_content + (1-α) · score_cf
```

α validation to'plamida tuneling qilinadi.

## API endpoints

| Method | Endpoint | Tavsifi |
|---|---|---|
| POST | `/api/auth/register` | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | Tizimga kirish |
| GET | `/api/auth/me` | Joriy foydalanuvchi |
| GET | `/api/test/questions` | RIASEC savollar |
| POST | `/api/test/calculate` | RIASEC scoring |
| POST | `/api/predict/recommend` | ⭐ Top-K kasb tavsiya |
| GET | `/api/predict/metadata` | Forma uchun ma'lumotlar |
| GET | `/api/predict/model-info` | Model haqida |

## Texnologiyalar

**Backend:**
- Python 3.12, FastAPI 0.111, SQLAlchemy 2.0
- scikit-learn 1.5 (NMF, TruncatedSVD, Cosine similarity)
- pandas 2.2, NumPy 1.26, scipy 1.13
- PostgreSQL 15

**Frontend:**
- React 18, Vite 5
- TailwindCSS, Lucide Icons
- Axios

**ML & Vizualizatsiya:**
- matplotlib 3.10, seaborn 0.13
- scikit-surprise (kelajakda)
- Jupyter notebook

## Mualliflik

**Bajaruvchi:** Maxmud Elmurodov
**Yo'nalish:** [yo'nalish nomi]
**Yili:** 2026
**GitHub:** https://github.com/maxmudmx/career-guidance-ai

## Litsenziya

Bu loyiha akademik maqsadlar uchun yaratilgan. Diplom himoyasi 2026-yilda.
