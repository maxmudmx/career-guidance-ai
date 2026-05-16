# Render'ga Deploy Qilish — Diplom versiyasi

Bu yo'riqnoma `recsys-diploma` branch'ini Render'ga deploy qilish uchun.

## Joriy holat

| Servis | URL | Branch |
|---|---|---|
| Backend (eski) | https://career-guidance-ai-y3ku.onrender.com | `main` |
| Frontend (eski) | https://kasbim-frontend.onrender.com | `main` |
| PostgreSQL | (Render Internal) | — |

## Yangi diplom versiyasini deploy qilish strategiyasi

**2 ta variant bor**:

### Variant A — `main` ga merge va eski URL'larni saqlash (TAVSIYA)

Diplom versiyasi to'liq sinovdan o'tgan bo'lsa, `main` ga merge qiling. Render avtomatik yangilaydi va siz hech narsa o'zgartirmaysiz.

```powershell
git checkout main
git merge recsys-diploma
git push origin main
```

Render avtomatik 5-7 daqiqada qayta deploy qiladi.

### Variant B — Yangi URL'lar bilan parallel deploy

Eski versiyani saqlash uchun yangi servislar yaratish.

---

## Variant A bo'yicha qadamlar (TAVSIYA ETILGAN)

### 1. Modelni o'qitish va `.pkl` faylni saqlash

Render'da modelni qayta o'qitish vaqt oladi. Yaxshisi lokal'da o'qitib, faylni git'ga commit qilish:

```powershell
cd backend
.\venv\Scripts\python.exe -m app.ml.train
```

Bu `backend/app/ml/saved/content_based.pkl` faylni yaratadi.

**Lekin** `.gitignore`'da `*.pkl` bor — uni vaqtincha o'chirib commit qiling:

```powershell
# .gitignore dan quyidagi 2 qatorni vaqtincha o'chiring:
# backend/app/ml/saved/*.pkl
# !backend/app/ml/saved/.gitkeep
git add backend/app/ml/saved/content_based.pkl
git add backend/app/ml/saved/hybrid.pkl
git commit -m "chore: add pre-trained models for production"
```

### 2. Lokal'da to'liq sinov

Backend va frontend lokal'da ishlayotganligini tekshiring:

```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload

# Brauzerda oching: http://localhost:8000/docs
# /predict/recommend endpoint'ni sinab ko'ring

# Terminal 2 - Frontend
cd frontend
npm run dev

# Brauzerda oching: http://localhost:5173
# Ro'yxatdan o'tib, RIASEC testni topshiring, natijani ko'ring
```

### 3. main branch'ga merge va push

```powershell
git checkout main
git merge recsys-diploma --no-ff -m "feat: pivot project to ML Recommender System (diploma version)"
git push origin main
```

### 4. Render dashboard'ni kuzating

1. https://dashboard.render.com ga kiring
2. `career-guidance-ai` (backend) → **Events** → yangi deploy boshlanganini ko'rasiz
3. `kasbim-frontend` (frontend) → **Events** → o'sha
4. 5-7 daqiqa kuting

### 5. Render env vars'ni tekshirish

Backend service → **Environment**:

| Key | Required | Tavsifi |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL Internal URL |
| `SECRET_KEY` | ✅ | JWT uchun maxfiy kalit |
| `PYTHON_VERSION` | ✅ | `3.12.4` |

Eski env vars (endi kerak emas, o'chirish mumkin):
- ❌ `BREVO_API_KEY` (email yo'q)
- ❌ `EMAIL_FROM`
- ❌ `ANTHROPIC_API_KEY` (chat yo'q)
- ❌ `SMTP_USER`, `SMTP_PASSWORD`

### 6. Database migration (eski jadvallarni o'chirish)

Diplom versiyasida ba'zi jadvallar olib tashlandi. Render Shell yoki PostgreSQL'ga ulanib quyidagilarni bajaring:

```sql
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS resume_analyses CASCADE;

-- Users jadvalidan eski ustunlarni olib tashlash:
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS region;
ALTER TABLE users DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE users DROP COLUMN IF EXISTS target_occupation_id;
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
```

> **Diqqat**: Bu real foydalanuvchi ma'lumotlarini o'chiradi. Avval backup oling.

PostgreSQL ga ulanish (Render'da):
```powershell
# Render dashboard → PostgreSQL → External Database URL
# psql bilan ulanish (lokal'da psql o'rnatilgan bo'lsa):
psql "postgresql://..."
```

Yoki Render dashboard PostgreSQL service'da **Shell** orqali.

### 7. Sinov

Deploy tugagach:

1. **Frontend**: https://kasbim-frontend.onrender.com
2. **Backend health**: https://career-guidance-ai-y3ku.onrender.com/health
3. **API docs**: https://career-guidance-ai-y3ku.onrender.com/docs

Test:
- Ro'yxatdan o'ting (yangi akkaunt — chunki eski usersda zarari yo'q)
- RIASEC testni topshiring
- Akademik ma'lumotlarni to'ldiring
- Top-5 tavsiyalar chiqishi kerak

---

## Variant B — Yangi servislar yaratish (parallel deploy)

Diplom uchun yangi URL'lar bilan deploy qilish (eski versiya saqlanadi):

### 1. Render'da yangi web service

1. **New +** → **Web Service**
2. Repo: `maxmudmx/career-guidance-ai`
3. **Branch: `recsys-diploma`** (eski emas, yangi branch)
4. **Name**: `kasbim-diploma-api`
5. **Root Directory**: bo'sh
6. **Build Command**: `pip install -r requirements.txt`
7. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend`
8. **Instance Type**: Free
9. **Env vars**: `DATABASE_URL`, `SECRET_KEY`, `PYTHON_VERSION=3.12.4`

### 2. Yangi static site

1. **New +** → **Static Site**
2. Repo: o'sha
3. **Branch: `recsys-diploma`**
4. **Name**: `kasbim-diploma-frontend`
5. **Root Directory**: `frontend`
6. **Build Command**: `npm install && npm run build`
7. **Publish Directory**: `dist`
8. **Env vars**:
   - `VITE_API_URL` = `https://kasbim-diploma-api.onrender.com/api`

### 3. Database

Hozirgi PostgreSQL'ni almashtirib ishlatish mumkin (jadvallar boshqacha).
Yoki yangi DB yaratish:
1. **New +** → **PostgreSQL**
2. **Name**: `kasbim-diploma-db`
3. **Region**: bir xil region (Frankfurt)
4. Yangi DB'ning Internal URL'ini `kasbim-diploma-api`ning `DATABASE_URL` env var'iga qo'ying.

---

## Lokal'da PostgreSQL bilan to'liq sinov

Eng yaxshi yondashuv — deploy'dan oldin lokal'da `.env` faylini sozlab to'liq sinash:

### 1. `.env` fayli yaratish

`backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/career_guidance
SECRET_KEY=local-test-key-change-in-production
```

### 2. PostgreSQL'ni lokal'da o'rnatish

Yo'q bo'lsa: https://www.postgresql.org/download/windows/

```powershell
# DB yaratish
psql -U postgres -c "CREATE DATABASE career_guidance;"
```

### 3. Backend'ni ishga tushirish

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

### 4. Frontend ishga tushirish

```powershell
cd frontend
npm run dev
```

### 5. Brauzerda http://localhost:5173

To'liq oqimni sinab ko'ring: Welcome → Register → Test → Academic → Results.

---

## Troubleshooting

### Backend "model.pkl not found"

Render Shell orqali:
```bash
cd backend
python -m app.ml.train
```

Yoki `.pkl` faylni git'ga commit qilib push qiling.

### Frontend "Network Error"

`VITE_API_URL` env var to'g'ri sozlanganmi?

### Database "table does not exist"

Backend startup'da jadvallar yaratiladi. Logs'ni tekshiring:
```
INFO: Started server process [...]
INFO: Application startup complete.
```

Agar xato bo'lsa, lokal'da test qiling va xato matnini o'rganing.

### CORS xato

`backend/app/main.py`'da CORS sozlamasi `allow_origins=["*"]` — har joydan ruxsat. Agar production'da cheklamoqchi bo'lsangiz:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kasbim-frontend.onrender.com"],
    ...
)
```

---

## Render bepul tier cheklovlari

⏰ **15 daqiqalik faolsizlikdan keyin server uxlaydi** (50-60s kechikish)
💾 **PostgreSQL bepul = 90 kun** (keyin o'chiriladi)
📊 **750 soat/oy** ish vaqti — bir service uchun yetarli

Diplom himoyasi paytida:
- Himoyadan 10 daqiqa oldin saytga kiring (uyg'otish uchun)
- Backup demo videosi bilan keling (internet bo'lmasa)
- Lokal'da ham ishga tushirib qo'ying (zaxira sifatida)

---

## CI/CD (kelajakda)

Hozircha Render auto-deploy bilan ishlaymiz. Kelajakda:
- GitHub Actions bilan testlar
- Pre-commit hooks (black, flake8)
- Docker container deploy
