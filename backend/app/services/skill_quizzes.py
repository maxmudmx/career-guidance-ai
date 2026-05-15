"""
Ko'nikma quizzlari — har bir ko'nikma uchun 5 ta savol.
Foydalanuvchi 80%+ to'g'ri javob bersa, ko'nikma "o'zlashtirilgan" deb hisoblanadi.

Har savol formati:
{
    "q":         savol matni
    "options":   4 ta variant ro'yxati
    "answer":    to'g'ri javob indeksi (0..3)
}
"""

PASS_THRESHOLD = 0.8  # legacy — endi ishlatilmaydi, score-based tizimga o'tdik

# Daraja chegaralari (foiz bo'yicha)
LEVEL_THRESHOLDS = {
    "expert":       90,   # 90-100% — Mutaxassis
    "advanced":     70,   # 70-89%  — Yuqori
    "intermediate": 40,   # 40-69%  — O'rta
    "beginner":     0,    # 0-39%   — Yangi boshlovchi
}

LEVEL_NAMES_UZ = {
    "expert":       "Mutaxassis",
    "advanced":     "Yuqori daraja",
    "intermediate": "O'rta daraja",
    "beginner":     "Yangi boshlovchi",
}


def level_for_score(percent: int) -> str:
    """Foizni darajaga aylantirish."""
    if percent >= LEVEL_THRESHOLDS["expert"]:
        return "expert"
    if percent >= LEVEL_THRESHOLDS["advanced"]:
        return "advanced"
    if percent >= LEVEL_THRESHOLDS["intermediate"]:
        return "intermediate"
    return "beginner"


SKILL_QUIZZES: dict[str, list[dict]] = {
    # ──────────────────────────────────────────────────────────
    # Soft skills
    # ──────────────────────────────────────────────────────────
    "Kommunikatsiya": [
        {
            "q": "Faol tinglashning eng muhim belgisi qaysi?",
            "options": [
                "So'zlovchini to'xtatmasdan, ko'z bilan kontakt va aniqlovchi savollar berish",
                "Tezroq javob qaytarish",
                "O'z fikrini kuchli ifodalash",
                "Yon tomonga qarab, telefonni tekshirish",
            ],
            "answer": 0,
        },
        {
            "q": "Konfliktni hal qilishda eng samarali yondashuv:",
            "options": [
                "G'olib chiqishga harakat qilish",
                "Mavzudan qochish va indamay turish",
                "Ikkala tomon manfaatlarini tushunib, kompromisga kelish",
                "Boshlig'iga shikoyat qilish",
            ],
            "answer": 2,
        },
        {
            "q": "Noverbal kommunikatsiya nimani anglatadi?",
            "options": [
                "Telefon orqali muloqot",
                "Tana tili, mimika, ovoz ohangi orqali ma'no uzatish",
                "Yozma xat-xabar",
                "Begona tilda gapirish",
            ],
            "answer": 1,
        },
        {
            "q": "\"Men-xabar\" (I-message) qachon ishlatiladi?",
            "options": [
                "Yangiliklarni ulashishda",
                "Boshqaning xatosini ko'rsatib, o'z his-tuyg'ularini bildirishda",
                "Faqat rasmiy yig'ilishlarda",
                "Hech qachon — \"sen\" ishlatish kerak",
            ],
            "answer": 1,
        },
        {
            "q": "Faol qayta-aytib berish (paraphrasing) nima uchun ishlatiladi?",
            "options": [
                "So'zlovchini to'g'ri tushunganligingizni tekshirish uchun",
                "Vaqtni cho'zish uchun",
                "Suhbatdoshni so'zsiz qoldirish uchun",
                "O'zining bilimini ko'rsatish uchun",
            ],
            "answer": 0,
        },
    ],

    "Stress boshqaruvi": [
        {
            "q": "Qisqa muddatli stressda eng samarali texnika:",
            "options": [
                "Qahva ichish",
                "Chuqur nafas olish (4-7-8 texnikasi)",
                "Ekranga uzoq qarash",
                "Stressni e'tibordan chetda qoldirish",
            ],
            "answer": 1,
        },
        {
            "q": "Surunkali stress nimaga olib keladi?",
            "options": [
                "Faqat charchoqqa",
                "Yurak-qon tomir, immunitet va ruhiy salomatlik muammolariga",
                "Kuchli xotira qobiliyatiga",
                "Tezroq qarorlar qabul qilishga",
            ],
            "answer": 1,
        },
        {
            "q": "Pomodoro texnikasi qaysi muammoga yordam beradi?",
            "options": [
                "Kechki ovqatni tanlashga",
                "Uzoq vaqt e'tibor saqlash va charchoqni kamaytirishga",
                "Salqinroq ishlash uchun",
                "Tez ko'p pul ishlashga",
            ],
            "answer": 1,
        },
        {
            "q": "Burnout (kuyish) belgilari:",
            "options": [
                "Yangi loyihalar uchun ishtiyoq",
                "Surunkali charchoq, sezgir bo'lmaslik, ish samaradorligi tushishi",
                "Tezroq uxlash",
                "Ko'p sport bilan shug'ullanish",
            ],
            "answer": 1,
        },
        {
            "q": "Mindfulness amaliyoti nima?",
            "options": [
                "Tezroq qaror qabul qilish texnikasi",
                "Hozirgi daqiqaga e'tiborli bo'lish, hukmsiz kuzatish",
                "Ish vazifalarini avtomatlashtirish",
                "Boshqalarni boshqarish",
            ],
            "answer": 1,
        },
    ],

    "Liderlik": [
        {
            "q": "Yaxshi liderning eng muhim sifati:",
            "options": [
                "Hammasini o'zi bajarish",
                "Jamoaga ishonish va vazifalarni delegate qilish",
                "Doim o'z fikrini ustun qo'yish",
                "Hech qachon xato qilmaslik",
            ],
            "answer": 1,
        },
        {
            "q": "Servant leadership (xizmatkor liderlik) tamoyili:",
            "options": [
                "Lider xodimlarning rivojlanishini ta'minlaydi va to'siqlarni olib tashlaydi",
                "Lider hammadan ustun, hammasi unga bo'ysunadi",
                "Lider hech qachon javobgar bo'lmaydi",
                "Lider faqat strategiyaga e'tibor qaratadi",
            ],
            "answer": 0,
        },
        {
            "q": "Konstruktiv fidbek qanday beriladi?",
            "options": [
                "Faqat kamchiliklarni ko'rsatish",
                "Aniq misol + ta'sir + yaxshilash yo'li (SBI model)",
                "Maqtov + tanqid + maqtov ketma-ket",
                "Hech qachon fidbek bermaslik",
            ],
            "answer": 1,
        },
        {
            "q": "Jamoadagi kelishmovchilikni hal qilish uchun lider nima qilishi kerak?",
            "options": [
                "Tomonni ushlash",
                "Birga o'tirish, ikki tomonni tinglash va umumiy yechim topishga yo'naltirish",
                "Konfliktni e'tibordan chetda qoldirish",
                "Ikkalasini ham jamoadan chiqarish",
            ],
            "answer": 1,
        },
        {
            "q": "SMART maqsadlar:",
            "options": [
                "Specific, Measurable, Achievable, Relevant, Time-bound",
                "Simple, Modern, Active, Reliable, Trustworthy",
                "Strategic, Massive, Awesome, Real, Tough",
                "Smart faqat aqlli odamlar uchun",
            ],
            "answer": 0,
        },
    ],

    "Boshqaruv": [
        {
            "q": "Eisenhower matritsasi nima uchun ishlatiladi?",
            "options": [
                "Tarix darslari uchun",
                "Vazifalarni muhimligi va shoshilinchligiga ko'ra ajratish",
                "Xodimlarni baholashga",
                "Mahsulot narxini hisoblashga",
            ],
            "answer": 1,
        },
        {
            "q": "Delegatsiya nima?",
            "options": [
                "Vazifalarni o'zi bajarish",
                "Vazifani boshqaga vakolat bilan birga topshirish",
                "Boshqaning ishini tekshirish",
                "Ishni keyinga qoldirish",
            ],
            "answer": 1,
        },
        {
            "q": "KPI — bu:",
            "options": [
                "Key Performance Indicator (samaradorlikning asosiy ko'rsatkichi)",
                "Knowledge Process Improvement",
                "Kompaniya Plan Index",
                "Ko'rsatma Personal Ishi",
            ],
            "answer": 0,
        },
        {
            "q": "Mikromenejment qaysi xatti-harakat?",
            "options": [
                "Strategik fikrlash",
                "Har bir kichik ishni nazorat qilib, xodimlarga erkinlik bermaslik",
                "Jamoa tuzish",
                "Maqsadlarni belgilash",
            ],
            "answer": 1,
        },
        {
            "q": "Risk boshqaruvi 4 ta strategiyasi:",
            "options": [
                "Tezroq qaror, ko'proq pul, kamroq odam, ko'p reja",
                "Yo'q qilish, kamaytirish, o'tkazish, qabul qilish",
                "Tashkil etish, baholash, sotish, sotib olish",
                "O'qish, yozish, hisoblash, taqdimot",
            ],
            "answer": 1,
        },
    ],

    "Statistika": [
        {
            "q": "O'rtacha (mean) va median orasidagi farq:",
            "options": [
                "Bir xil, sinonim",
                "Mean — barcha qiymatlar yig'indisi/soni; Median — tartibga solingan ro'yxatdagi o'rta qiymat",
                "Mean — eng katta qiymat, Median — eng kichik",
                "Faqat statistik dasturlarda farq qiladi",
            ],
            "answer": 1,
        },
        {
            "q": "P-value 0.05 dan kichik bo'lsa, bu nimani anglatadi?",
            "options": [
                "Null gipoteza rad etiladi, natija statistik ahamiyatga ega",
                "Tajriba muvaffaqiyatsiz",
                "Ma'lumot yetarli emas",
                "Hech qanday ma'no yo'q",
            ],
            "answer": 0,
        },
        {
            "q": "Standart og'ish (standard deviation) nimani o'lchaydi?",
            "options": [
                "Ma'lumotning markaziy qiymatini",
                "Ma'lumotlarning o'rtacha atrofida qanchalik tarqalganligini",
                "Eng katta qiymatni",
                "Sample hajmini",
            ],
            "answer": 1,
        },
        {
            "q": "Korrelyatsiya va kauzatsiya (sabab-oqibat) farqi:",
            "options": [
                "Bir xil narsa",
                "Korrelyatsiya ikki o'zgaruvchi orasidagi bog'liqlikni ko'rsatadi, kauzatsiya sababiy bog'liqlikni",
                "Korrelyatsiya har doim sabab-oqibatni isbotlaydi",
                "Kauzatsiya — yolg'on tushuncha",
            ],
            "answer": 1,
        },
        {
            "q": "Normal taqsimotning xususiyati:",
            "options": [
                "Asimmetrik, eng katta tomonga eg'ilgan",
                "Qo'ng'iroqsimon, simmetrik, mean=median=moda",
                "Hech qanday matematik formulasi yo'q",
                "Faqat 0 va 1 qiymatlardan iborat",
            ],
            "answer": 1,
        },
    ],

    "Ingliz tili": [
        {
            "q": "\"I have been working here ___ 2020\" — qaysi predlog kerak?",
            "options": ["for", "since", "from", "during"],
            "answer": 1,
        },
        {
            "q": "Past perfect tense qaysi vaziyatda ishlatiladi?",
            "options": [
                "Hozir bo'layotgan harakat",
                "O'tmishdagi ikki harakatdan birinchisini ifodalashda",
                "Kelajak rejalari uchun",
                "Doimiy haqiqatlar uchun",
            ],
            "answer": 1,
        },
        {
            "q": "\"If I ___ a millionaire, I would travel the world.\" — qaysi forma?",
            "options": ["am", "was", "were", "be"],
            "answer": 2,
        },
        {
            "q": "Phrasal verb \"give up\" ma'nosi:",
            "options": [
                "ko'tarmoq",
                "tashlamoq, voz kechmoq",
                "yuqoriga bermoq",
                "tezlashtirmoq",
            ],
            "answer": 1,
        },
        {
            "q": "Passive voice formulasi:",
            "options": [
                "Subject + verb + object",
                "Object + form of \"be\" + past participle (+ by + subject)",
                "Hech qachon ishlatilmaydi",
                "Faqat o'tgan zamonda mavjud",
            ],
            "answer": 1,
        },
    ],

    "Pedagogika": [
        {
            "q": "Konstruktivistik o'qitish nazariyasi mualifi:",
            "options": ["B.F. Skinner", "Jean Piaget", "Ivan Pavlov", "Sigmund Freud"],
            "answer": 1,
        },
        {
            "q": "Bloom taksonomiyasi qaysi tartibda ko'rinadi (oddiydan murakkabga)?",
            "options": [
                "Eslash → Tushunish → Qo'llash → Tahlil → Baholash → Yaratish",
                "Yaratish → Baholash → Tahlil → Qo'llash → Tushunish → Eslash",
                "Tahlil → Eslash → Qo'llash → Yaratish → Baholash → Tushunish",
                "Hech qanday tartibi yo'q",
            ],
            "answer": 0,
        },
        {
            "q": "Differentsial yondashuv nima?",
            "options": [
                "Hammaga bir xil dars berish",
                "O'quvchilarning individual xususiyatlariga moslab darsni yo'naltirish",
                "Faqat eng kuchli o'quvchilarga e'tibor",
                "Imtihonlarni murakkablashtirish",
            ],
            "answer": 1,
        },
        {
            "q": "Aktiv ta'lim metodi:",
            "options": [
                "O'quvchi passiv tinglaydi, o'qituvchi gapiradi",
                "O'quvchi muammo yechish, muhokama, loyihalar orqali bilim oladi",
                "Faqat darsliklarni o'qish",
                "Imtihonga tayyorgarlik",
            ],
            "answer": 1,
        },
        {
            "q": "Formativ baholash:",
            "options": [
                "Yakuniy imtihon",
                "O'qitish davomida o'quvchi rivojini kuzatuvchi baholash",
                "Faqat raqamli ball qo'yish",
                "Boshqalar bilan taqqoslash",
            ],
            "answer": 1,
        },
    ],

    "Yozish": [
        {
            "q": "Aniq va lo'nda yozishning eng muhim qoidasi:",
            "options": [
                "Iloji boricha uzun gaplar tuzish",
                "Ortiqcha so'zlarni olib tashlash va aktiv ovoz ishlatish",
                "Ko'p sifat va ravishlar qo'shish",
                "Murakkab sinonimlarni izlash",
            ],
            "answer": 1,
        },
        {
            "q": "\"Show, don't tell\" qoidasi nimani anglatadi?",
            "options": [
                "Voqeani bayon qilish o'rniga, detallar orqali ko'rsatish",
                "Hech narsa yozmaslik",
                "Faqat dialog yozish",
                "Faqat fakt yozish",
            ],
            "answer": 0,
        },
        {
            "q": "Yaxshi kirish qismi qaysi?",
            "options": [
                "Uzoq tarixiy fon",
                "O'quvchini darhol qiziqtiradigan hook + maqsad",
                "Hammasini bir qatorda aytib bo'lish",
                "Faqat statistika",
            ],
            "answer": 1,
        },
        {
            "q": "Editing va proofreading farqi:",
            "options": [
                "Bir xil narsa",
                "Editing — mazmun va struktura, proofreading — imlo va punktuatsiya",
                "Editing keraksiz",
                "Proofreading faqat kitoblar uchun",
            ],
            "answer": 1,
        },
        {
            "q": "Maqola yoki insho yozishda \"thesis statement\" nima?",
            "options": [
                "Birinchi gap",
                "Matnning asosiy g'oyasini bir-ikki gapda ifoda etuvchi tezis",
                "Oxirgi xulosa",
                "Mualif ismi",
            ],
            "answer": 1,
        },
    ],

    "Python": [
        {
            "q": "Pythonda list va tuple farqi:",
            "options": [
                "Bir xil narsa",
                "List o'zgaruvchan (mutable), tuple o'zgarmas (immutable)",
                "Tuple tezroq, lekin faqat sonlar uchun",
                "List faqat string uchun",
            ],
            "answer": 1,
        },
        {
            "q": "List comprehension namunasi:",
            "options": [
                "[x*2 for x in range(10)]",
                "for x in range(10): x*2",
                "list(x*2)",
                "x*2 = range(10)",
            ],
            "answer": 0,
        },
        {
            "q": "Pythonda \"==\" va \"is\" farqi:",
            "options": [
                "Bir xil",
                "== qiymatni, is identifikatorni (xotira manzilini) solishtiradi",
                "is faqat sonlar uchun",
                "== string uchun, is list uchun",
            ],
            "answer": 1,
        },
        {
            "q": "Pythonda lambda funksiya:",
            "options": [
                "Faqat sinflar uchun",
                "Anonim, bir qatorli kichik funksiya",
                "Asosiy funksiya turi",
                "Loop'ning bir turi",
            ],
            "answer": 1,
        },
        {
            "q": "*args va **kwargs:",
            "options": [
                "Bir xil narsa",
                "*args pozitsion argumentlar (tuple), **kwargs nomli argumentlar (dict)",
                "Pythonda mavjud emas",
                "Faqat sinflar ichida ishlaydi",
            ],
            "answer": 1,
        },
    ],

    "Excel": [
        {
            "q": "VLOOKUP funksiyasining maqsadi:",
            "options": [
                "Hujayralarni bo'yash",
                "Vertikal jadvalda qiymat qidirib, mos qiymatni qaytarish",
                "Faqat raqamlarni qo'shish",
                "Sahifa nomini o'zgartirish",
            ],
            "answer": 1,
        },
        {
            "q": "Pivot table nima uchun ishlatiladi?",
            "options": [
                "Faqat chiroyli ko'rinish uchun",
                "Katta hajmdagi ma'lumotlarni tezda yig'ish, guruhlash va tahlil qilish",
                "Faqat printerga chiqarish uchun",
                "Hujayralarni qo'shish uchun",
            ],
            "answer": 1,
        },
        {
            "q": "Absolyut va nisbiy yacheyka manzili farqi:",
            "options": [
                "Bir xil",
                "$A$1 absolyut (ko'chirilganda o'zgarmaydi), A1 nisbiy (ko'chiriladi)",
                "$A$1 faqat raqamlar uchun",
                "Hech qanday farqi yo'q",
            ],
            "answer": 1,
        },
        {
            "q": "IF funksiyasi:",
            "options": [
                "Faqat sonlarni qo'shadi",
                "Shartga ko'ra ikki natijadan birini qaytaradi",
                "Yacheykalarni bo'yaydi",
                "Faqat tugma sifatida ishlaydi",
            ],
            "answer": 1,
        },
        {
            "q": "Ctrl+Shift+Enter qaysi formula uchun ishlatiladi (eski Excel)?",
            "options": [
                "Ma'lumot saqlash",
                "Array (massiv) formulasini kiritish",
                "Yangi sahifa ochish",
                "Print qilish",
            ],
            "answer": 1,
        },
    ],

    "Matematika": [
        {
            "q": "Logarifmning asosiy xususiyati: log(a*b) =",
            "options": [
                "log(a) + log(b)",
                "log(a) - log(b)",
                "log(a) * log(b)",
                "log(a)/log(b)",
            ],
            "answer": 0,
        },
        {
            "q": "Pifagor teoremasi:",
            "options": [
                "a + b = c",
                "a² + b² = c² (to'g'ri burchakli uchburchakda)",
                "a × b = c",
                "a/b = c",
            ],
            "answer": 1,
        },
        {
            "q": "Hosiladan (derivative) nima foydalanamiz?",
            "options": [
                "Funksiyaning o'zgarish tezligini topish uchun",
                "Faqat geometriya uchun",
                "Faqat sonlar yig'indisini topish",
                "Hech qanday foyda yo'q",
            ],
            "answer": 0,
        },
        {
            "q": "Integral nimani topadi?",
            "options": [
                "Funksiya ostidagi yuza yoki yig'indi",
                "Faqat hosila aksini",
                "Ikki son ko'paytmasini",
                "Burchak qiymati",
            ],
            "answer": 0,
        },
        {
            "q": "Kombinatorikada C(n, k) (kombinatsiya):",
            "options": [
                "n elementdan k tasini tartibga olmasdan tanlash usullari",
                "n elementdan k tasini tartib bilan tanlash",
                "Faqat 2 element uchun",
                "Hech qanday formula yo'q",
            ],
            "answer": 0,
        },
    ],

    "Marketing strategiyasi": [
        {
            "q": "4P marketing miks:",
            "options": [
                "Product, Price, Place, Promotion",
                "People, Profit, Plan, Power",
                "Pay, Push, Pull, Profit",
                "Public, Private, Personal, Professional",
            ],
            "answer": 0,
        },
        {
            "q": "SWOT analiz:",
            "options": [
                "Strengths, Weaknesses, Opportunities, Threats",
                "Sales, Workflow, Output, Team",
                "Strategy, Work, Operations, Tools",
                "Special, Wonderful, Outstanding, Top",
            ],
            "answer": 0,
        },
        {
            "q": "Target audience (TA) nima?",
            "options": [
                "Hamma odamlar",
                "Mahsulot/xizmatga eng mos keladigan aniq foydalanuvchilar guruhi",
                "Faqat boylar",
                "Raqobatchilar",
            ],
            "answer": 1,
        },
        {
            "q": "Customer Acquisition Cost (CAC):",
            "options": [
                "Mahsulot tannarxi",
                "Yangi mijoz jalb qilish o'rtacha xarajati",
                "Reklama byudjeti umuman",
                "Mijozni yo'qotish narxi",
            ],
            "answer": 1,
        },
        {
            "q": "A/B test nima?",
            "options": [
                "Imtihon turi",
                "Ikki versiya o'zaro taqqoslab, qaysi yaxshi ishlashini aniqlash",
                "Faqat veb-dizayn uchun",
                "Mahsulot sifatini tekshirish",
            ],
            "answer": 1,
        },
    ],

    "Notiqlik nutqi": [
        {
            "q": "Yaxshi nutq tuzilishi:",
            "options": [
                "Aralash, tartibsiz",
                "Kirish (hook) → asosiy qism (3 ta nuqta) → xulosa (CTA)",
                "Faqat oxir va boshlanish",
                "Hech qanday struktura kerak emas",
            ],
            "answer": 1,
        },
        {
            "q": "Sahna qo'rquvini kamaytirish texnikasi:",
            "options": [
                "Ko'p qahva ichish",
                "Chuqur nafas, oldindan tayyorgarlik, mashq qilish, vizualizatsiya",
                "Auditoriyaga umuman qaramaslik",
                "Tez gapirib tugatish",
            ],
            "answer": 1,
        },
        {
            "q": "Auditoriya bilan ko'z kontakti:",
            "options": [
                "Faqat bir nuqtaga qarash",
                "Turli odamlar bilan navbatma-navbat 2-3 soniya ko'z kontakti",
                "Faqat slaydlarga qarash",
                "Ko'z kontakti kerak emas",
            ],
            "answer": 1,
        },
        {
            "q": "Pauza (jimlik) nutqda nima beradi?",
            "options": [
                "Hech narsa, faqat noqulay",
                "Tinglovchiga o'ylash vaqti va muhim joyni ta'kidlash",
                "Faqat nafas olish uchun",
                "Vaqtni o'ldirish",
            ],
            "answer": 1,
        },
        {
            "q": "CTA (Call to Action) nutqda:",
            "options": [
                "Foydasiz",
                "Tinglovchiga aniq nima qilish kerakligini aytish",
                "Faqat sotuvchilar uchun",
                "Faqat oxirgi slaydda yoziladi",
            ],
            "answer": 1,
        },
    ],

    "Mijozlar bilan ishlash": [
        {
            "q": "Mijozning shikoyatiga to'g'ri javob:",
            "options": [
                "Tushuntirib o'tish va aybni mijozga yuklash",
                "Tinglash → empathiya → uzr → yechim → ta'qib",
                "Indamay turish",
                "Boshqa bo'limga jo'natish",
            ],
            "answer": 1,
        },
        {
            "q": "NPS (Net Promoter Score) nima?",
            "options": [
                "Mijoz qoniqishini va tavsiya qilish ehtimolini o'lchash",
                "Daromad ko'rsatkichi",
                "Xodimlar baholash",
                "Reklama byudjeti",
            ],
            "answer": 0,
        },
        {
            "q": "Mijozni ushlab turish (retention) nima uchun muhim?",
            "options": [
                "Yangi mijoz jalb qilish 5-7× qimmatroq turadi",
                "Faqat statistik ko'rinish uchun",
                "Hech qanday foyda yo'q",
                "Faqat katta kompaniyalar uchun",
            ],
            "answer": 0,
        },
        {
            "q": "Empathiya mijoz xizmatida:",
            "options": [
                "Faqat \"Tushundim\" deyish",
                "Mijozning his-tuyg'ularini tushunib, samimiy javob qaytarish",
                "Mijoz bilan kelishmovchilik",
                "Standart skript bo'yicha javob",
            ],
            "answer": 1,
        },
        {
            "q": "Upselling va cross-selling farqi:",
            "options": [
                "Bir xil narsa",
                "Upselling — qimmatroq versiya, cross-selling — qo'shimcha mahsulot",
                "Faqat onlayn savdoda mavjud",
                "Ikkalasi ham noqonuniy",
            ],
            "answer": 1,
        },
    ],

    "Birinchi yordam": [
        {
            "q": "CPR (yurak-o'pka tiklash) kompressiya tezligi:",
            "options": [
                "Daqiqada 30-50",
                "Daqiqada 100-120",
                "Daqiqada 200+",
                "Doimiy ravishda",
            ],
            "answer": 1,
        },
        {
            "q": "Heimlich manyovri qachon ishlatiladi?",
            "options": [
                "Yurak xurujida",
                "Kishi tomog'iga biror narsa tiqilib qolganda",
                "Yiqilganda",
                "Bosh og'rishi paytida",
            ],
            "answer": 1,
        },
        {
            "q": "Qattiq qon ketishida birinchi ish:",
            "options": [
                "Suv tashlash",
                "Toza mato bilan bosish va yurak balandligida ushlab turish",
                "Sovuq qo'yish",
                "Kuting o'z-o'zidan to'xtaydi",
            ],
            "answer": 1,
        },
        {
            "q": "Recovery position (xavfsiz pozitsiya) qachon kerak?",
            "options": [
                "Hush yo'qotgan, lekin nafas olayotgan kishini joylashtirishda",
                "Yurak xurujida",
                "Sinishlarda",
                "Hech qachon",
            ],
            "answer": 0,
        },
        {
            "q": "Kuyish (1-darajali) uchun:",
            "options": [
                "Yog' bilan moylash",
                "Sovuq oqar suv ostida 10-20 daqiqa salqinlatish",
                "Muz qo'yish to'g'ridan-to'g'ri",
                "Sirkacha ishlatish",
            ],
            "answer": 1,
        },
    ],

    "Materialshunoslik": [
        {
            "q": "Po'lat va cho'yan asosiy farqi:",
            "options": [
                "Faqat rangi",
                "Uglerod miqdori (po'latda 0.02-2%, cho'yanda 2-6%)",
                "Cho'yan yumshoq, po'lat qattiq",
                "Bir xil narsa",
            ],
            "answer": 1,
        },
        {
            "q": "Mustahkamlik (strength) va qattiqlik (hardness) farqi:",
            "options": [
                "Bir xil narsa",
                "Mustahkamlik — yuk ko'tarish, qattiqlik — yuzaga botishga qarshilik",
                "Faqat metallar uchun",
                "Hech qanday farq yo'q",
            ],
            "answer": 1,
        },
        {
            "q": "Polimer materiallar misoli:",
            "options": [
                "Plastmassa, kauchuk, neylon",
                "Po'lat, mis",
                "Beton, gips",
                "Stakan, oyna",
            ],
            "answer": 0,
        },
        {
            "q": "Korroziya nima?",
            "options": [
                "Materialning mexanik sinishi",
                "Materialning kimyoviy (asosan oksidlanish) yo'l bilan yemirilishi",
                "Materialning rangi o'zgarishi",
                "Materialning og'irligi o'zgarishi",
            ],
            "answer": 1,
        },
        {
            "q": "Kompozit material:",
            "options": [
                "Bir turdagi material",
                "Ikki yoki ko'p turdagi materialning birikmasi (masalan, karbon-tola)",
                "Faqat tabiiy material",
                "Suyuq holat",
            ],
            "answer": 1,
        },
    ],
}


def get_quiz(skill: str):
    """Quiz savollarini qaytaradi (javoblarsiz)."""
    quiz = SKILL_QUIZZES.get(skill)
    if not quiz:
        return None
    return [
        {"q": q["q"], "options": q["options"]}
        for q in quiz
    ]


def check_answers(skill: str, answers: list[int]) -> dict:
    """Foydalanuvchi javoblarini tekshirib, foiz va darajani qaytaradi.

    Returns:
        {
            "score":     to'g'ri javoblar soni,
            "total":     umumiy savollar soni,
            "percent":   foiz,
            "level":     'beginner' | 'intermediate' | 'advanced' | 'expert',
            "level_uz":  daraja nomi o'zbekcha,
            "details":   [{"correct": bool, "right_answer": int}]
        }
    """
    quiz = SKILL_QUIZZES.get(skill)
    if not quiz:
        return {"error": "Quiz topilmadi"}

    total = len(quiz)
    if len(answers) != total:
        return {"error": f"{total} ta javob kerak, {len(answers)} ta berildi"}

    details = []
    score = 0
    for i, q in enumerate(quiz):
        is_correct = answers[i] == q["answer"]
        if is_correct:
            score += 1
        details.append({"correct": is_correct, "right_answer": q["answer"]})

    percent = round(score / total * 100)
    level = level_for_score(percent)
    return {
        "score": score,
        "total": total,
        "percent": percent,
        "level": level,
        "level_uz": LEVEL_NAMES_UZ[level],
        "details": details,
    }


def has_quiz(skill: str) -> bool:
    return skill in SKILL_QUIZZES


def available_quiz_skills() -> list[str]:
    return list(SKILL_QUIZZES.keys())
