# -*- coding: utf-8 -*-
"""Diplom himoyasi uchun realistik demo foydalanuvchilar va testlar qo'shadi.

Ishlatish:
    1. Render'dan DATABASE_URL'ni oling (production DB)
    2. PowerShell'da:  $env:DATABASE_URL="postgresql://..."
    3. Skriptni ishga tushiring:  py -3 seed_demo_users.py

Natija: ~25 ta yangi foydalanuvchi + ~50 ta test natijasi.
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta

# Dependencies — agar yo'q bo'lsa, install qiling:
#   py -3 -m pip install psycopg2-binary passlib bcrypt
try:
    import psycopg2
    from passlib.context import CryptContext
except ImportError:
    print("Kerakli kutubxonalar yo'q. Quyidagini ishga tushiring:")
    print("  py -3 -m pip install psycopg2-binary passlib bcrypt")
    sys.exit(1)

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("XATO: DATABASE_URL muhit o'zgaruvchisi o'rnatilmagan.")
    print("PowerShell'da quyidagini ishga tushiring:")
    print('  $env:DATABASE_URL="postgresql://USER:PASS@HOST/DB"')
    print("Render dashboard → API service → Environment → DATABASE_URL")
    sys.exit(1)

random.seed(42)
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEMO_HASH = pwd_ctx.hash("kasbim2026demo")

# ── Realistic Uzbek names ──────────────────────────────────
FIRST_NAMES = [
    "Akmal", "Aziz", "Bekzod", "Davron", "Eldor", "Farrux", "Husan",
    "Ilhom", "Javohir", "Kamol", "Laziz", "Mansur", "Nodir", "Otabek",
    "Pulat", "Rustam", "Sardor", "Tohir", "Ulug'bek", "Vohid", "Yorqin",
    "Zafar", "Sherali", "Ravshan", "Mirzo", "Sanjar", "Diyor", "Bahodir",
    "Anvar", "Olim",
    # Female
    "Aziza", "Bahora", "Charos", "Dilnoza", "Elnura", "Feruza", "Gulnora",
    "Husniya", "Iroda", "Komila", "Lola", "Mohira", "Nigora", "Oysha",
    "Parizoda", "Robiya", "Sevara", "Shahzoda", "Umida", "Yulduz", "Zilola",
    "Madina", "Nilufar",
]
LAST_NAMES = [
    "Rahimov", "Karimov", "Yo'ldoshev", "Saidov", "Norqulov", "Tursunov",
    "Mahmudov", "Olimov", "Hasanov", "Rasulov", "Mirzayev", "Xolmurodov",
    "Boboyev", "Toshpo'latov", "Abdullayev", "Erkinov", "Ismoilov",
    "Sherqulov", "Murodov", "Aliyev",
    # Female forms
    "Rahimova", "Karimova", "Yo'ldosheva", "Saidova", "Norqulova",
    "Mahmudova", "Olimova", "Hasanova", "Rasulova", "Mirzayeva",
    "Abdullayeva", "Erkinova", "Ismoilova", "Aliyeva",
]
REGIONS = [
    "Toshkent", "Toshkent viloyati", "Samarqand", "Buxoro", "Andijon",
    "Farg'ona", "Namangan", "Qashqadaryo", "Surxondaryo", "Jizzax",
    "Sirdaryo", "Navoiy", "Xorazm", "Qoraqalpog'iston",
]

# ── Sample careers from occupations.py ─────────────────────
CAREERS_SAMPLE = [
    {"id": 0, "name": "Data Scientist", "name_uz": "Ma'lumotlar olimi", "category": "it"},
    {"id": 1, "name": "Backend Developer", "name_uz": "Backend dasturchi", "category": "it"},
    {"id": 2, "name": "Frontend Developer", "name_uz": "Frontend dasturchi", "category": "it"},
    {"id": 3, "name": "ML Engineer", "name_uz": "Sun'iy intellekt muhandisi", "category": "it"},
    {"id": 4, "name": "DevOps Engineer", "name_uz": "DevOps muhandisi", "category": "it"},
    {"id": 5, "name": "Mobile Developer", "name_uz": "Mobil dasturchi", "category": "it"},
    {"id": 6, "name": "UI/UX Designer", "name_uz": "UI/UX dizayner", "category": "sanat"},
    {"id": 7, "name": "Doctor", "name_uz": "Vrach", "category": "tibbiyot"},
    {"id": 8, "name": "Nurse", "name_uz": "Hamshira", "category": "tibbiyot"},
    {"id": 9, "name": "Dentist", "name_uz": "Stomatolog", "category": "tibbiyot"},
    {"id": 10, "name": "Pharmacist", "name_uz": "Farmatsevt", "category": "tibbiyot"},
    {"id": 11, "name": "Teacher", "name_uz": "O'qituvchi", "category": "talim"},
    {"id": 12, "name": "Lawyer", "name_uz": "Advokat", "category": "huquq"},
    {"id": 13, "name": "Accountant", "name_uz": "Buxgalter", "category": "biznes"},
    {"id": 14, "name": "Project Manager", "name_uz": "Loyiha menejeri", "category": "biznes"},
    {"id": 15, "name": "Marketer", "name_uz": "Marketolog", "category": "marketing"},
    {"id": 16, "name": "Economist", "name_uz": "Iqtisodchi", "category": "biznes"},
    {"id": 17, "name": "Architect", "name_uz": "Arxitektor", "category": "qurilish"},
    {"id": 18, "name": "Civil Engineer", "name_uz": "Qurilish muhandisi", "category": "muhandislik"},
    {"id": 19, "name": "Mechanical Engineer", "name_uz": "Mexanika muhandisi", "category": "muhandislik"},
    {"id": 20, "name": "Psychologist", "name_uz": "Psixolog", "category": "psixologiya"},
    {"id": 21, "name": "Translator", "name_uz": "Tarjimon", "category": "tillar"},
    {"id": 22, "name": "Journalist", "name_uz": "Jurnalist", "category": "media"},
    {"id": 23, "name": "Photographer", "name_uz": "Fotograf", "category": "sanat"},
    {"id": 24, "name": "Chef", "name_uz": "Oshpaz", "category": "xizmat"},
]
EXPLANATIONS_POOL = [
    "Tadqiqotchi moyilligi mos keldi",
    "Ijodkor moyilligi mos keldi",
    "Ijtimoiy moyilligi mos keldi",
    "Tadbirkor moyilligi mos keldi",
    "Konvensional moyilligi mos keldi",
    "Qiziqishlar mos: IT, fan, matematika",
    "Qiziqishlar mos: tibbiyot, biologiya",
    "Qiziqishlar mos: sanat, dizayn",
    "Yaxshi fanlar: matematika, informatika, fizika",
    "Yaxshi fanlar: biologiya, kimyo, anatomiya",
    "Yaxshi fanlar: ona tili, ingliz tili, adabiyot",
]


def make_riasec():
    """Realistik RIASEC scorelarni yaratish — bitta 'dominant' bilan."""
    base = [round(random.uniform(2.0, 5.5), 1) for _ in range(6)]
    # bitta tipni dominant qilish
    dominant_idx = random.randint(0, 5)
    base[dominant_idx] = round(random.uniform(7.5, 9.5), 1)
    # ikkinchi tipni o'rtacha balandroq
    second_idx = (dominant_idx + random.randint(1, 5)) % 6
    base[second_idx] = round(random.uniform(6.0, 8.0), 1)
    return dict(zip(["R", "I", "A", "S", "E", "C"], base))


def make_recommendations(n=5):
    """N ta tasodifiy tavsiya — realistik scorelar bilan."""
    careers = random.sample(CAREERS_SAMPLE, n)
    recs = []
    base_score = random.uniform(0.85, 0.92)
    for i, c in enumerate(careers):
        score = round(base_score - i * random.uniform(0.03, 0.06), 4)
        recs.append({
            "id": c["id"],
            "name": c["name"],
            "name_uz": c["name_uz"],
            "category": c["category"],
            "score": max(score, 0.45),
            "explanation": random.sample(EXPLANATIONS_POOL, k=random.randint(2, 4)),
            "description_uz": "",
            "avg_salary": "",
            "demand": "",
            "growth": "",
            "required_skills": [],
            "subjects": [],
            "interests": [],
            "roadmap": [],
            "riasec_career": {},
        })
    return recs


def make_academic_data():
    """Sintetik kirish ma'lumotlari (frontend tomonidan yuborilgani)."""
    all_interests = ["it", "tibbiyot", "muhandislik", "fan", "talim", "biznes",
                     "sanat", "dizayn", "musiqa", "sport", "tabiat", "tillar",
                     "psixologiya", "pazandachilik", "moda"]
    all_subjects = ["matematika", "fizika", "kimyo", "biologiya", "tarix",
                    "ona_tili", "ingliz_tili", "informatika", "geografiya",
                    "adabiyot", "iqtisod", "psixologiya", "musiqa", "rasm"]
    return {
        "interests": random.sample(all_interests, k=random.randint(2, 5)),
        "subjects": random.sample(all_subjects, k=random.randint(2, 5)),
    }


# ═════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════

print(f"Ulanmoqda: {DATABASE_URL[:40]}...")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Joriy holatni tekshirish
cur.execute("SELECT COUNT(*) FROM users")
before_users = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM test_results")
before_tests = cur.fetchone()[0]
print(f"Hozirgi holat: {before_users} foydalanuvchi, {before_tests} test\n")

N_USERS = 25
inserted_count = 0

print(f"{N_USERS} ta demo foydalanuvchi qo'shilmoqda...\n")

for i in range(N_USERS):
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    # Female surname matching
    if first[-1] in 'aeio' and not last.endswith('a'):
        # try to find female version
        female_last = last + 'a' if last.endswith('v') else last
        last = female_last

    username = f"{first.lower()}_{last.lower()[:5]}{random.randint(20, 99)}"
    email = f"{first.lower()}.{last.lower()}{random.randint(100, 9999)}@gmail.com"
    full_name = f"{first} {last}"
    region = random.choice(REGIONS)

    # Yaratilgan vaqt — oxirgi 30 kunda
    days_ago = random.randint(1, 30)
    hours_ago = random.randint(0, 23)
    created_at = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)

    try:
        cur.execute("""
            INSERT INTO users (username, email, password_hash, full_name,
                                region, is_verified, is_admin, created_at)
            VALUES (%s, %s, %s, %s, %s, TRUE, FALSE, %s)
            ON CONFLICT (username) DO NOTHING
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
        """, (username, email, DEMO_HASH, full_name, region, created_at))
        row = cur.fetchone()
        if row is None:
            continue
        user_id = row[0]
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        continue

    # Har foydalanuvchi uchun 1-3 ta test
    n_tests = random.choices([1, 2, 3], weights=[0.55, 0.35, 0.10])[0]
    for t in range(n_tests):
        test_time = created_at + timedelta(
            hours=random.randint(1, max(2, days_ago * 24 - 1)))
        if test_time > datetime.utcnow():
            test_time = datetime.utcnow() - timedelta(minutes=random.randint(10, 600))

        riasec = make_riasec()
        recs = make_recommendations(5)
        academic = make_academic_data()

        cur.execute("""
            INSERT INTO test_results (user_id, riasec_scores, academic_data,
                                       user_skills, recommendations, created_at)
            VALUES (%s, %s::jsonb, %s::jsonb, %s, %s::jsonb, %s);
        """, (user_id,
              json.dumps(riasec),
              json.dumps(academic),
              [],
              json.dumps(recs),
              test_time))

    inserted_count += 1
    print(f"  [{inserted_count:>2}/{N_USERS}]  {full_name:<25}  ·  "
          f"{region:<22}  ·  {n_tests} ta test")

conn.commit()

# Yakuniy holat
cur.execute("SELECT COUNT(*) FROM users")
after_users = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM test_results")
after_tests = cur.fetchone()[0]

cur.close()
conn.close()

print(f"\n{'='*60}")
print(f"✓ Tayyor!  {inserted_count} ta foydalanuvchi qo'shildi.")
print(f"  Foydalanuvchilar: {before_users} → {after_users}")
print(f"  Testlar:           {before_tests} → {after_tests}")
print(f"{'='*60}")
print(f"\nDemo foydalanuvchilar paroli: 'kasbim2026demo'")
print(f"(himoyadan keyin kerak bo'lmasa o'chirib qo'ying)")
