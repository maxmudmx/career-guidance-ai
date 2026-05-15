"""Kategoriyalar, qiziqishlar, fanlar va ko'nikmalar taksonomiyasi.

Loyihaning butun ma'lumot modeli shu fayldan foydalanadi.
Kasblar (occupations.py) shu yerda e'lon qilingan kalitlardan tashkil topadi.
"""

# ============================================================
# 1. KASB KATEGORIYALARI (sohalar) — 30 ta
# ============================================================
CATEGORIES: dict[str, str] = {
    "it":           "IT va Texnologiya",
    "tibbiyot":     "Tibbiyot va Sog'liqni saqlash",
    "muhandislik":  "Muhandislik",
    "fan":          "Tabiat va aniq fanlar",
    "talim":        "Ta'lim va Pedagogika",
    "biznes":       "Biznes, Moliya va Iqtisod",
    "huquq":        "Huquq va Adliya",
    "sanat":        "San'at va Dizayn",
    "sport":        "Sport va Jismoniy madaniyat",
    "media":        "Media va Jurnalistika",
    "kino":         "Kino, Teatr va San'at ijrochiligi",
    "qishloq":      "Qishloq xo'jaligi va Oziq-ovqat",
    "xizmat":       "Xizmat ko'rsatish va Mehmondo'stlik",
    "davlat":       "Davlat boshqaruvi va Diplomatiya",
    "harbiy":       "Harbiy va Xavfsizlik",
    "texnik":       "Texnik kasblar va Hunarmandchilik",
    "transport":    "Transport va Logistika",
    "gozallik":     "Go'zallik va Moda",
    "psixologiya":  "Psixologiya va Ijtimoiy ish",
    "turizm":       "Sayohat va Turizm",
    "qurilish":     "Qurilish va Arxitektura",
    "energetika":   "Energetika va Sanoat",
    "marketing":    "Marketing va Reklama",
    "din":          "Din, Falsafa va Madaniyat",
    "tillar":       "Tilshunoslik va Tarjima",
    "veterinariya": "Veterinariya va Hayvonshunoslik",
    "aviatsiya":    "Aviatsiya va Kosmonavtika",
    "ekologiya":    "Ekologiya va Atrof-muhit",
    "tadqiqot":     "Ilmiy tadqiqot",
    "ijtimoiy":     "Ijtimoiy xizmat va Volontyorlik",
}


# ============================================================
# 2. QIZIQISHLAR (foydalanuvchi nima bilan shug'ullanishni yoqtiradi)
# ============================================================
INTERESTS: dict[str, str] = {
    "it":             "IT va kompyuter",
    "tibbiyot":       "Tibbiyot va sog'liq",
    "muhandislik":    "Muhandislik va texnika",
    "fan":            "Fan va tadqiqot",
    "talim":          "Ta'lim va o'qitish",
    "biznes":         "Biznes va tadbirkorlik",
    "moliya":         "Moliya va investitsiya",
    "huquq":          "Huquq va adliya",
    "sanat":          "San'at va ijod",
    "dizayn":         "Dizayn va estetika",
    "musiqa":         "Musiqa",
    "kino":           "Kino va teatr",
    "yozuv":          "Yozish va jurnalistika",
    "sport":          "Sport va jismoniy faollik",
    "tabiat":         "Tabiat va ekologiya",
    "hayvonlar":      "Hayvonlar va veterinariya",
    "qishloq":        "Qishloq xo'jaligi",
    "pazandachilik":  "Oshpazlik va pazandachilik",
    "moda":           "Moda va stil",
    "gozallik":       "Go'zallik va parvarish",
    "sayohat":        "Sayohat va turizm",
    "tillar":         "Tillarni o'rganish",
    "psixologiya":    "Psixologiya va inson xulqi",
    "ijtimoiy":       "Ijtimoiy yordam va volontyorlik",
    "harbiy":         "Harbiy va xavfsizlik",
    "transport":      "Transport va avtomobillar",
    "qurilish":       "Qurilish va arxitektura",
    "din":            "Din va ma'naviyat",
    "astronomiya":    "Astronomiya va kosmos",
    "tarix":          "Tarix va arxeologiya",
    "siyosat":        "Siyosat va davlat boshqaruvi",
    "marketing":      "Marketing va reklama",
    "hunar":          "Hunarmandchilik va qo'l mehnati",
}


# ============================================================
# 3. MAKTAB / O'QUV FANLARI (foydalanuvchi qaysi fanga qiziqadi)
# ============================================================
SUBJECTS: dict[str, str] = {
    "matematika":    "Matematika",
    "algebra":       "Algebra",
    "geometriya":    "Geometriya",
    "fizika":        "Fizika",
    "kimyo":         "Kimyo",
    "biologiya":     "Biologiya",
    "anatomiya":     "Anatomiya",
    "geografiya":    "Geografiya",
    "geologiya":     "Geologiya",
    "astronomiya":   "Astronomiya",
    "ekologiya":     "Ekologiya",
    "tarix":         "Tarix",
    "adabiyot":      "Adabiyot",
    "ona_tili":      "Ona tili",
    "ingliz_tili":   "Ingliz tili",
    "rus_tili":      "Rus tili",
    "boshqa_tillar": "Boshqa chet tillar",
    "informatika":   "Informatika va dasturlash",
    "iqtisod":       "Iqtisodiyot",
    "huquq":         "Huquq asoslari",
    "psixologiya":   "Psixologiya",
    "sotsiologiya":  "Sotsiologiya",
    "falsafa":       "Falsafa",
    "din_tarixi":    "Dinshunoslik",
    "sanat_tarixi":  "San'at tarixi",
    "musiqa":        "Musiqa",
    "rasm":          "Tasviriy san'at va chizmachilik",
    "tex_chizma":    "Texnik chizmachilik",
    "mehnat":        "Mehnat ta'limi va texnologiya",
    "jismoniy":      "Jismoniy tarbiya",
    "tibbiyot_a":    "Tibbiyot asoslari (OBJ)",
    "navoiyshunos":  "Navoiyshunoslik / mumtoz adabiyot",
}


# ============================================================
# 4. SKILL DARAJALARI
# ============================================================
SKILL_LEVELS: dict[int, str] = {
    0: "Yo'q",
    1: "Boshlovchi",
    2: "O'rta",
    3: "Yuqori",
    4: "Ekspert",
}


# ============================================================
# 5. KO'NIKMALAR — 200+ ko'nikma barcha sohalar bo'yicha
# Har biri SKILL_CATEGORIES bo'yicha guruhlanadi (frontendda guruhlash uchun).
# ============================================================
SKILL_CATEGORIES: dict[str, list[str]] = {
    # ---------- IT / Software ----------
    "Dasturlash tillari": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go",
        "Rust", "Kotlin", "Swift", "PHP", "Ruby", "Solidity", "R", "MATLAB",
    ],
    "Web va Mobile": [
        "HTML/CSS", "React", "Vue.js", "Angular", "React Native", "Flutter",
        "Node.js", "Next.js", "Django", "FastAPI", "Spring Boot", "Laravel",
    ],
    "Ma'lumotlar bazasi": [
        "SQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "MySQL",
    ],
    "Matematika va ML": [
        "Matematika", "Statistika", "Algebra", "Geometriya", "Hisob (Calculus)",
        "Machine Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
        "Data Visualization", "Pandas", "NumPy",
    ],
    "DevOps va Cloud": [
        "Docker", "Kubernetes", "Linux", "AWS", "Azure", "Google Cloud",
        "Apache Spark", "Kafka", "CI/CD", "Terraform", "Firebase", "Bash",
    ],
    "Xavfsizlik": [
        "Kriptografiya", "Tarmoq xavfsizligi", "Penetration Testing", "SIEM",
        "OWASP", "Reverse Engineering",
    ],
    "Blokcheyn va Web3": [
        "Web3", "Smart Contracts", "Ethereum", "DeFi",
    ],

    # ---------- Dizayn / San'at ----------
    "Dizayn vositalari": [
        "Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe XD",
        "Sketch", "Canva", "InDesign", "Procreate",
    ],
    "Dizayn nazariyasi": [
        "Dizayn", "UI Design", "UX Research", "Prototiplash",
        "Foydalanuvchi tadqiqoti", "Rang nazariyasi", "Tipografiya", "Brending",
    ],
    "San'at va Ijod": [
        "Rasm chizish", "Akvarel", "Yog'li bo'yoq", "Haykaltaroshlik",
        "Grafika", "Kalligrafiya", "Fotosurat", "Animatsiya",
        "3D modellashtirish", "Blender", "Cinema 4D",
    ],

    # ---------- Tibbiyot / Sog'liq ----------
    "Tibbiyot asoslari": [
        "Anatomiya", "Fiziologiya", "Patologiya", "Farmakologiya",
        "Mikrobiologiya", "Biokimyo", "Genetika",
    ],
    "Klinik amaliyot": [
        "Diagnostika", "Birinchi yordam", "Hamshiralik", "Jarrohlik",
        "Pediatriya", "Akusherlik", "Stomatologiya", "Radiologiya",
        "Anesteziologiya", "Reanimatologiya", "Kardiologiya",
        "Nevrologiya", "Psixiatriya", "Onkologiya", "Reabilitatsiya",
        "Massaj", "Fizioterapiya",
    ],
    "Farmatsevtika": [
        "Farmatsevtika", "Klinik farmakologiya", "Resept tayyorlash",
    ],
    "Veterinariya": [
        "Veterinariya", "Hayvonlar anatomiyasi", "Zoologiya",
    ],

    # ---------- Muhandislik / Texnika ----------
    "Mexanik muhandislik": [
        "AutoCAD", "SolidWorks", "Revit", "Mexanika", "Termodinamika",
        "Materialshunoslik", "Gidravlika", "Pnevmatika",
    ],
    "Elektr va Elektronika": [
        "Elektr sxemalari", "Elektronika", "PLC dasturlash", "Mikrokontroller",
        "Arduino", "Raspberry Pi", "Sxemotexnika",
    ],
    "Qurilish muhandisligi": [
        "Qurilish texnologiyasi", "Geodeziya", "Konstruksiyalar hisobi",
        "Smeta tuzish", "BIM",
    ],
    "Kimyo muhandisligi": [
        "Kimyoviy jarayonlar", "Neft kimyosi", "Polimerlar", "Laboratoriya",
    ],
    "Aerokosmik": [
        "Aerodinamika", "Raketa muhandisligi", "Avionika", "Sun'iy yo'ldosh",
    ],

    # ---------- Tabiat fanlari ----------
    "Tabiiy fanlar": [
        "Fizika", "Astronomiya", "Kvant fizikasi", "Yadro fizikasi",
        "Kimyo", "Organik kimyo", "Biologiya", "Botanika", "Mikrobiologiya",
        "Geologiya", "Mineralogiya", "Paleontologiya", "Okeanografiya",
        "Meteorologiya", "Ekologiya", "Atrof-muhit tahlili",
    ],

    # ---------- Biznes / Moliya ----------
    "Buxgalteriya va Audit": [
        "Buxgalteriya", "Audit", "IFRS", "1C", "Soliq hisobi",
    ],
    "Moliya va Investitsiya": [
        "Moliyaviy tahlil", "Investitsiya", "Bank ishi", "Kreditlash",
        "Portfel boshqaruvi", "Korporativ moliya", "Trading",
    ],
    "Boshqaruv va Strategiya": [
        "Boshqaruv", "Strategik rejalashtirish", "Liderlik", "HR",
        "Tadbirkorlik", "Biznes-reja", "Operatsion boshqaruv",
    ],

    # ---------- Marketing / Sotuv ----------
    "Marketing va Sotuv": [
        "Marketing strategiyasi", "SMM", "SEO", "SEM", "Email marketing",
        "Kontent marketing", "Brending", "Bozor tahlili", "Sotuv",
        "Mijozlar bilan ishlash", "CRM", "Reklama yozish",
    ],

    # ---------- Huquq ----------
    "Huquq sohasi": [
        "Fuqarolik huquqi", "Jinoyat huquqi", "Mehnat huquqi",
        "Xalqaro huquq", "Korporativ huquq", "Soliq huquqi", "Sud jarayoni",
        "Huquqshunoslik", "Notarius", "Advokatlik",
    ],

    # ---------- Pedagogika ----------
    "Pedagogika va Ta'lim": [
        "Pedagogika", "Bolalar psixologiyasi", "Metodika", "Mentorlik",
        "Maxsus ta'lim", "Inklyuziv ta'lim", "Erta yoshdagi ta'lim",
        "Online o'qitish", "Kurikulum tuzish",
    ],

    # ---------- Tillar ----------
    "Tillar": [
        "Ingliz tili", "Rus tili", "Arab tili", "Xitoy tili", "Koreys tili",
        "Yapon tili", "Nemis tili", "Frantsuz tili", "Turk tili",
        "Ispan tili", "Tarjimonlik", "Sinxron tarjima", "Lingvistika",
    ],

    # ---------- Sport ----------
    "Sport va fitness": [
        "Trenirovka", "Sport psixologiyasi", "Sport tibbiyoti",
        "Yoga", "Pilates", "Kuch mashqlari", "Cardio", "CrossFit",
        "Futbol", "Basketbol", "Voleybol", "Tennis", "Suzish",
        "Yengil atletika", "Kurash", "Boks", "Shaxmat",
    ],

    # ---------- Media / Yozuv ----------
    "Media va Kontent": [
        "Yozish", "Jurnalistika", "Tahririyat", "Stsenariy yozish",
        "Bloging", "Podkasting", "Video tahrirlash", "Premiere Pro",
        "Final Cut Pro", "DaVinci Resolve", "Audio inshootlash",
        "Operatorlik", "Reportaj", "Intervyu",
    ],

    # ---------- Kino / Teatr ----------
    "Kino va sahna": [
        "Aktyorlik", "Sahna nutqi", "Rejissyorlik", "Yorug'lik",
        "Sahna dizayni", "Kostyum", "Grim", "Ovoz inshootlash",
    ],
    "Musiqa": [
        "Vokal", "Pianino", "Gitara", "Skripka", "Doira", "Dutor",
        "Kompozitsiya", "Aranjirovka", "Audio Production", "FL Studio",
        "Ableton", "Logic Pro", "Musiqa nazariyasi",
    ],

    # ---------- Qishloq xo'jaligi ----------
    "Qishloq xo'jaligi": [
        "Agronomiya", "Ekinchilik", "Bog'dorchilik", "Chorvachilik",
        "Asalarichilik", "Pillachilik", "Sug'orish tizimlari",
        "Tuproqshunoslik", "Fermerlik", "Organik dehqonchilik",
    ],

    # ---------- Pazandachilik ----------
    "Pazandachilik": [
        "Oshpazlik", "Konditerchilik", "Nonvoylik", "Sommelyer",
        "Bartender", "Bariston", "Milliy taomlar", "Halol pazandachilik",
    ],

    # ---------- Texnik kasblar / Hunarmand ----------
    "Hunarmandchilik": [
        "Payvandlash", "Duradgorlik", "Elektrika ta'mirlash", "Santexnika",
        "Avto ta'mirlash", "Issiqlik tizimlari", "Konditsioner ta'mirlash",
        "Soatsozlik", "Zargarlik", "Kulollik", "Ko'nchilik", "Kashtachilik",
        "To'qimachilik", "Etikdo'zlik", "Qulfsozlik",
    ],

    # ---------- Transport ----------
    "Transport va Logistika": [
        "Avtomobil boshqarish", "Yuk transporti", "Logistika boshqaruvi",
        "Omborxona", "Ta'minot zanjiri", "Mahsulot taqsimoti",
        "Dengiz navigatsiyasi", "Temir yo'l boshqaruvi",
    ],
    "Aviatsiya": [
        "Uchish", "Aviadispetcher", "Bortprovodnik", "Aviatsiya muhandisligi",
    ],

    # ---------- Go'zallik / Moda ----------
    "Go'zallik va parvarish": [
        "Sartaroshlik", "Manikyur", "Pedikyur", "Kosmetologiya",
        "Vizajistlik", "Soch turlari", "Spa va massaj",
    ],
    "Moda va to'qimachilik": [
        "Tikuvchilik", "Modelyer", "Moda dizayni", "Patternlash",
        "Fashion-illyustratsiya",
    ],

    # ---------- Psixologiya / Ijtimoiy ----------
    "Psixologiya": [
        "Psixologik tashxis", "Psixoterapiya", "Bolalar psixologiyasi",
        "Oilaviy maslahat", "Konsultatsiya", "Klinik psixologiya",
        "Sotsial ish",
    ],

    # ---------- Mehmondo'stlik / Turizm ----------
    "Mehmondo'stlik va Turizm": [
        "Mehmonxona boshqaruvi", "Tur menejmenti", "Gid xizmati",
        "Restoran boshqaruvi", "Mijozlar xizmati",
    ],

    # ---------- Davlat / Diplomatiya ----------
    "Davlat va Diplomatiya": [
        "Davlat boshqaruvi", "Diplomatiya", "Xalqaro munosabatlar",
        "Notiqlik", "Protokol",
    ],

    # ---------- Harbiy ----------
    "Harbiy va Xavfsizlik": [
        "Harbiy taktika", "Otish mahorati", "Yo'l harakati xavfsizligi",
        "Shaxsiy xavfsizlik", "Yong'in xavfsizligi", "Qutqaruv ishlari",
    ],

    # ---------- Soft skills (hammasi uchun) ----------
    "Universal ko'nikmalar": [
        "Kommunikatsiya", "Jamoada ishlash", "Liderlik", "Vaqtni boshqarish",
        "Tanqidiy fikrlash", "Muammoni hal qilish", "Hissiy intellekt",
        "Stress boshqaruvi", "Notiqlik nutqi", "Xat-yozuv",
    ],

    # ---------- Dasturiy va loyihaviy umumiy ----------
    "Loyiha va Vositalar": [
        "Git", "API Design", "API Integration", "System Design",
        "Testing", "Selenium", "Jira", "Risk Analysis",
        "Budjetlashtirish", "Excel", "Word", "PowerPoint", "Vizualizatsiya",
        "Agile", "Scrum",
    ],

    # ---------- Din / Falsafa ----------
    "Din va Falsafa": [
        "Tafsir", "Hadis", "Fiqh", "Aqida", "Arabshunoslik",
        "Falsafiy fikrlash", "Etika",
    ],

    # ---------- Ekologiya ----------
    "Ekologiya va Atrof-muhit": [
        "Ekologik audit", "Suv resurslari", "Qattiq chiqindilar",
        "Iqlim o'zgarishi", "Atmosfera tahlili",
    ],

    # ---------- Energetika ----------
    "Energetika": [
        "Issiqlik energetikasi", "Atom energetikasi", "Quyosh energiyasi",
        "Shamol energiyasi", "Geofizika", "Neft-gaz qazib olish",
    ],
}


# Tekis ro'yxat — model va frontendlar uchun
SKILLS_LIST: list[str] = [s for group in SKILL_CATEGORIES.values() for s in group]


# ============================================================
# 6. RIASEC nomi (qulaylik uchun bu yerda ham)
# ============================================================
RIASEC_NAMES: dict[str, str] = {
    "R": "Realistik",
    "I": "Tadqiqotchi",
    "A": "Ijodkor",
    "S": "Ijtimoiy",
    "E": "Tadbirkor",
    "C": "Konvensional",
}
