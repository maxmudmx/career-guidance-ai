# Diplom ishi — Tuzilma va Matn Shakli

> **Mavzu:** Mashinali o'qitish asosida kasbga yo'naltiruvchi tizim:
> Gibrid Recommender System asosida shaxsiy kasb tavsiya
>
> **Bajaruvchi:** Maxmud Elmurodov
> **Yo'nalish:** [yo'nalish nomi]
> **Yili:** 2026

---

## Tuzilma

```
TITLE PAGE
ANNOTATSIYA (Uz/Rus/En) — 1 sahifa
MUNDARIJA — 1-2 sahifa
SHARTLI BELGILAR VA QISQARTMALAR — 1 sahifa
KIRISH — 3-5 sahifa
1-BOB: ADABIYOTLAR TAHLILI — 12-15 sahifa
2-BOB: METODOLOGIYA — 12-15 sahifa
3-BOB: EKSPERIMENTLAR VA NATIJALAR — 15-20 sahifa
4-BOB: XULOSA VA TAVSIYALAR — 3-5 sahifa
FOYDALANILGAN ADABIYOTLAR — 30+ manba
ILOVALAR — kod, qo'shimcha grafiklar
```

Jami: 60-80 sahifa (standart talab)

---

## ANNOTATSIYA (~250 so'z)

> Annotatsiya — ishning qisqacha tavsifi (3 tilda).

**O'zbekcha varianti:**

Mazkur diplom ishi mashinali o'qitish (Machine Learning) asosida foydalanuvchining shaxsiyat profili, qiziqishlari va akademik natijalariga muvofiq kasb tavsiya etuvchi tizim ishlab chiqishga bag'ishlangan. Ishda gibrid tavsiya tizimi (Hybrid Recommender System) yondashuvi qo'llanilgan bo'lib, u **Content-Based Filtering** (Cosine similarity) va **Collaborative Filtering** (NMF/SVD matritsa parchalash) algoritmlarini birlashtiradi.

Tizim 303 ta kasbni 30 ta soha bo'yicha qamrab oladi. Har bir kasb 101 o'lchamli xususiyatlar vektori bilan ifodalanadi (RIASEC psixometrik 6, kategoriya 30, qiziqishlar 33, fanlar 32 o'lchov). Ushbu vektorlar foydalanuvchi profili bilan kosinus o'xshashligi orqali taqqoslanadi va top-K kasb tavsiya etiladi.

Eksperimentlar 1500 ta sintetik foydalanuvchi (303 ta haqiqiy testdan tashqari) ustida o'tkazildi. Modellar 60/20/20 (train/val/test) bo'linmasi asosida sinovdan o'tkazildi va besh ko'rsatkich bo'yicha (Precision@K, Recall@K, NDCG@K, MRR, Coverage) baholandi.

Natijalar shuni ko'rsatdiki, cold-start senariosida Content-Based model **Precision@5 = 88.45%**, **NDCG@5 = 0.7628** ko'rsatkichlariga erishdi, bu esa tasodifiy tavsiyadan 53.6 marta yuqori. Hybrid model α=1.0 ni tanladi, bu yangi foydalanuvchilar uchun content-based yondashuvning hukmronligini tasdiqlaydi.

**Kalit so'zlar:** machine learning, recommender system, content-based filtering, collaborative filtering, NMF, SVD, RIASEC, kasb tavsiyasi.

---

## KIRISH (~3-5 sahifa)

### Mavzuning dolzarbligi

Bugungi kunda O'zbekistonda yoshlarning kasb tanlashi muhim ijtimoiy muammolardan biri hisoblanadi:
- O'zbekiston Respublikasi Statistika qo'mitasi ma'lumotlariga ko'ra, 15-24 yoshdagi yoshlarning 23% ishsiz yoki o'qimaydi (NEET);
- Universitet bitiruvchilarining ~60%i o'z ixtisosligiga mos kelmaydigan sohada ishlaydi;
- FlexJobs (2023) tadqiqotiga ko'ra, har 3 ta yoshdan 2 tasi tanlagan ish yo'lidan pushaymon.

Bu muammoning kelib chiqish sabablari:
1. Yoshlarda o'z qiziqish va imkoniyatlarini tahlil qilish mexanizmi yo'qligi;
2. Mavjud mehnat bozori talablari haqida ma'lumotning yetarli emasligi;
3. Sun'iy intellektga asoslangan zamonaviy professional yo'naltirish vositalarining mahalliy sharoitda joriy etilmagani.

Mazkur ish ushbu muammolarni mashinali o'qitish algoritmlari yordamida hal qilish yo'lini tadqiq etadi.

### Tadqiqot maqsadi

Foydalanuvchining psixometrik testlari (RIASEC), qiziqishlari va akademik fanlardagi natijalari asosida unga eng mos kasb yo'nalishlarini tavsiya etuvchi gibrid tavsiya tizimini ishlab chiqish.

### Tadqiqot vazifalari

1. Mavjud kasb tavsiya tizimlari va recommender system algoritmlarini o'rganish (literature review);
2. O'zbekiston mehnat bozoriga mos 300+ kasb ma'lumotlar bazasini tuzish;
3. Har kasb uchun ko'p o'lchamli xususiyatlar vektorini (feature vector) loyihalash;
4. Content-Based, Collaborative Filtering va Hybrid algoritmlarni amalga oshirish;
5. Modellarning samaradorligini metrikalarda baholash va taqqoslash;
6. Veb-interfeys yordamida tizimni real foydalanuvchilarga taqdim etish.

### Tadqiqot ob'ekti va predmeti

**Ob'ekt:** Yoshlarning kasb tanlash jarayoni va ML asosida shaxsiy tavsiya beruvchi tizimlar.

**Predmet:** Hybrid Recommender System algoritmlari va ularning kasb tavsiyasi sohasida qo'llanilishi.

### Tadqiqotning ilmiy yangiligi

- O'zbek tilida ishlaydigan birinchi ML asosli kasb tavsiya tizimi;
- RIASEC + kategoriya + qiziqishlar + fanlar birlashtirilgan 101 o'lchamli feature vector strukturasi;
- Cold-start muammosini Content-Based va Collaborative kombinatsiyasi orqali hal qilish;
- Explainability (tushuntiruvchi tavsiya) modulining qo'shilishi.

### Amaliy ahamiyati

Tizim qo'llanilishi mumkin:
- Maktab bitiruvchilarining universitet yo'nalishini tanlashda;
- Universitet talabalarining ixtisoslashish bo'yicha qaror qabul qilishida;
- Mehnat bozoridagi qayta tayyorlash markazlarida;
- HR kompaniyalarining nomzodlarni baholash jarayonida.

### Diplom ishining tuzilmasi

Ish kirish, 4 ta bob, xulosa va foydalanilgan adabiyotlar ro'yxatidan iborat.

---

## 1-BOB: ADABIYOTLAR TAHLILI (~12-15 sahifa)

### 1.1. Kasb tanlash nazariyalari

#### 1.1.1. Holland'ning kasb tipologiyasi (RIASEC)
> Holland, J. L. (1997). *Making Vocational Choices: A Theory of Vocational Personalities and Work Environments.*

Holland modeli 6 ta shaxsiyat tipini ajratadi:
- **R (Realistik)** — amaliy, texnik;
- **I (Tadqiqotchi)** — tahliliy, ilmiy;
- **A (Ijodkor)** — artistik, badiiy;
- **S (Ijtimoiy)** — yordam beruvchi;
- **E (Tadbirkor)** — boshqaruvchi, motivator;
- **C (Konvensional)** — tartibli, hisob-kitob qiluvchi.

#### 1.1.2. Boshqa nazariyalar
- Super's Life-Span Theory (1990);
- Krumboltz's Social Learning Theory (1976);
- Parsons' Trait-Factor Theory (1909).

### 1.2. Recommender System algoritmlari

#### 1.2.1. Content-Based Filtering
**Lops, P., de Gemmis, M., Semeraro, G. (2011).** *Content-based Recommender Systems: State of the Art and Trends.*

Asosiy g'oya: itemlar (kasblar) va foydalanuvchilarni bir xil feature space'ga joylashtirib, ular orasidagi o'xshashlikni hisoblash.

Formula (Cosine similarity):
$$ \text{sim}(u, c) = \frac{\vec{u} \cdot \vec{c}}{\|\vec{u}\| \cdot \|\vec{c}\|} $$

**Afzalliklari:** cold-start yo'q, izohlanuvchan (interpretable).
**Kamchiliklari:** "filter bubble" (faqat o'xshashlarni tavsiya qiladi).

#### 1.2.2. Collaborative Filtering
**Koren, Y., Bell, R., Volinsky, C. (2009).** *Matrix Factorization Techniques for Recommender Systems.*

Foydalanuvchi-item interaction matritsasini past o'lchovga proyeksiya qilish (SVD, NMF, ALS).

$$ M_{u \times i} \approx U_{u \times k} \cdot V^T_{k \times i} $$

**Afzalliklari:** yashirin (latent) pattern'larni topa oladi.
**Kamchiliklari:** cold-start, sparsity, scalability.

#### 1.2.3. Hybrid yondashuv
**Burke, R. (2002).** *Hybrid Recommender Systems: Survey and Experiments.*

Klassifikatsiya: Weighted, Switching, Mixed, Cascade, Feature combination.

Bizning ishda **Weighted Hybrid** ishlatiladi:
$$ \text{Score}_{\text{hybrid}} = \alpha \cdot \text{Score}_{\text{content}} + (1 - \alpha) \cdot \text{Score}_{\text{collaborative}} $$

### 1.3. Kasb tavsiyasiga oid mavjud tadqiqotlar

- **Aalbers et al. (2018)** — *A Recommendation System for Career Choices Based on Skills and Personality Traits.*
- **Patel et al. (2017)** — *On-going Career Adaption to Industry Demands using ML Approach.*
- **Liu et al. (2019)** — *Content-based Filtering for Personal Career Path.*

### 1.4. Baholash metrikalari

- **Precision@K, Recall@K** (Manning et al., 2008);
- **NDCG** — Järvelin & Kekäläinen (2002);
- **MRR** (Voorhees, 1999);
- **Coverage, Diversity** — Cremonesi et al. (2010).

### 1.5. 1-bob bo'yicha xulosa

Adabiyotlar tahlili shuni ko'rsatdiki:
- O'zbek tilidagi ML asosli kasb tavsiya tizimlari deyarli yo'q;
- Hybrid yondashuv individual modellardan yaxshiroq natija beradi;
- Cold-start muammosi hozircha ochiq tadqiqot mavzusi.

---

## 2-BOB: METODOLOGIYA (~12-15 sahifa)

### 2.1. Tadqiqot dizayni

Ish 6 bosqichdan iborat:
1. Ma'lumotlar yig'ish va tayyorlash (303 kasb);
2. Feature engineering (101 o'lchamli vektorlar);
3. Sintetik dataset generatsiyasi (cold-start uchun);
4. Modellarni amalga oshirish (4 ta algoritm);
5. Train/Val/Test split va o'qitish;
6. Metrikalarda baholash.

### 2.2. Ma'lumotlar bazasi

#### 2.2.1. Kasblar taksonomiyasi

Tizim **303 ta kasb**ni **30 ta soha** bo'yicha qamrab oladi.

Har kasb uchun saqlanadigan atributlar:
- nomi (O'zbek/Ingliz);
- kategoriyasi (it, tibbiyot, muhandislik, ...);
- RIASEC vektori [R, I, A, S, E, C] qiymatlari 0-10 oraliqda;
- talab qilinadigan ko'nikmalar (200+ ko'nikma ro'yxatidan);
- mos qiziqishlar (33 ta variantdan);
- muhim fanlar (32 ta variantdan);
- o'rtacha maosh va bozor talabi.

[GRAFIK: 02_category_counts.png — kategoriyalar bo'yicha kasblar soni]

#### 2.2.2. Feature engineering

Har kasb uchun **101 o'lchamli feature vector** quriladi:

| Blok | O'lchov | Tavsifi |
|---|---|---|
| RIASEC | 6 | Holland modeli (0-1 normalize) |
| Kategoriya | 30 | One-hot encoding |
| Qiziqishlar | 33 | Multi-hot encoding |
| Fanlar | 32 | Multi-hot encoding |
| **Jami** | **101** | |

Formula:
$$ \vec{c}_i \in \mathbb{R}^{101},\quad \vec{c}_i = [\text{riasec}_i \| \text{cat}_i \| \text{int}_i \| \text{subj}_i] $$

[GRAFIK: 01_riasec_distribution.png]

### 2.3. Sintetik foydalanuvchilar (Cold-start uchun)

Real foydalanuvchi ma'lumotlari yetishmaganligi sababli sintetik dataset yaratildi:

**Algoritm:**
1. Har kasb uchun K ta "ideal foydalanuvchi" yaratiladi;
2. Ideal foydalanuvchi = kasb feature vektorining shovqinli (noisy) versiyasi;
3. Shovqin Gaussian taqsimotiga ega: $\mathcal{N}(0, \sigma=0.15)$;
4. Qiziqishlar va fanlardan tasodifiy 30% olib tashlanadi (har inson hammasini tanlamaydi);
5. Kategoriya ma'lumoti 0 ga tushiriladi (model uni topishi kerak).

**Jami:** 1500 ta sintetik foydalanuvchi, har biri uchun "haqiqiy" kasb id ma'lum.

### 2.4. Modellar

#### 2.4.1. Random Baseline
Eng past chegara — tasodifiy K ta kasbni tavsiya qiladi.

#### 2.4.2. Popularity Baseline
Eng mashhur K ta kasbni hammaga tavsiya qiladi.

#### 2.4.3. Content-Based Recommender
$$ \text{rec}_C(u) = \text{top}_K\{ \cos(\vec{u}, \vec{c_i}) : c_i \in \text{Careers} \} $$

#### 2.4.4. Collaborative Filtering (NMF/SVD)

User-Item matritsani $M$ tuzish va past o'lchovga proyeksiya:
$$ M \approx U \cdot V^T,\quad U \in \mathbb{R}^{|U| \times k},\quad V \in \mathbb{R}^{|I| \times k} $$

Cold-start uchun **fold-in** strategiyasi:
- Yangi foydalanuvchining content vektoridan eng yaqin $n$ ta train user topiladi;
- Ularning $U$ faktorlari cosine similarity bilan tortib o'rtachalashtiriladi;
- Yangi foydalanuvchining $U$ vektori shu o'rtacha bo'ladi.

#### 2.4.5. Hybrid Recommender
$$ \text{Score}_{\text{hybrid}}(u, i) = \alpha \cdot \text{Score}_C(u, i) + (1 - \alpha) \cdot \text{Score}_{CF}(u, i) $$

$\alpha$ validation to'plamida tunelangan.

### 2.5. Baholash protokoli

#### 2.5.1. Train / Val / Test split
Stratified by career (har kasbdan teng nisbat):
- Train: 60% (909 user);
- Validation: 20% (303 user) — α tuning uchun;
- Test: 20% (303 user) — yakuniy baholash.

#### 2.5.2. Metrikalar

| Metrika | Formula | Diapazon |
|---|---|---|
| Precision@K | $\frac{|\text{rel} \cap \text{top}_K|}{K}$ | [0, 1] |
| Recall@K | $\frac{|\text{rel} \cap \text{top}_K|}{|\text{rel}|}$ | [0, 1] |
| Hit Rate@K | $\mathbb{1}[\text{rel} \cap \text{top}_K \ne \emptyset]$ | {0, 1} |
| NDCG@K | $\frac{DCG_K}{IDCG_K}$ | [0, 1] |
| MRR | $\frac{1}{N}\sum \frac{1}{\text{rank}_i}$ | [0, 1] |
| Coverage | $\frac{|\text{tavsiya etilgan kasblar}|}{|\text{barcha kasblar}|}$ | [0, 1] |
| Diversity | $\frac{1}{|S|^2} \sum d(c_i, c_j)$ | [0, 1] |

### 2.6. Texnologiyalar

**Backend:** Python 3.12, FastAPI, scikit-learn 1.5.1, NumPy 1.26, Pandas 2.2
**Frontend:** React 18, Vite, TailwindCSS
**Ma'lumotlar bazasi:** PostgreSQL 15
**Deploy:** Render.com (bepul tier)

---

## 3-BOB: EKSPERIMENTLAR VA NATIJALAR (~15-20 sahifa)

### 3.1. Eksperimentlar sozlamalari

| Parametr | Qiymat |
|---|---|
| Sintetik foydalanuvchilar | 1500 |
| Train / Val / Test | 909 / 303 / 303 |
| Feature dim | 101 |
| Kasblar (items) | 303 |
| Kategoriyalar | 30 |
| CF latent factors (k) | 30 |
| Cold-start neighbors (n) | 10 |
| Noise (sintetik) | σ = 0.15 |
| K qiymatlari | {1, 3, 5, 10} |
| Random seed | 42 |

### 3.2. 5 ta modelning natijalari

[GRAFIK: 03_models_comparison.png]

[JADVAL: results.csv]

**Asosiy jadval:**

| Model | P@1 | P@5 | NDCG@5 | Hit@5 | Coverage | MRR |
|---|---|---|---|---|---|---|
| Random | 0.33% | 1.65% | 0.009 | 1.65% | 100% | 0.011 |
| Popularity | 0.33% | 1.65% | 0.010 | 1.65% | 3.3% | 0.010 |
| Content-Based | **61.72%** | **88.45%** | **0.763** | **88.45%** | 100% | **0.731** |
| CF-NMF | 7.26% | 20.46% | 0.138 | 20.46% | 66% | 0.125 |
| CF-SVD | 21.78% | 47.52% | 0.356 | 47.52% | 97% | 0.327 |
| **Hybrid (α=1.0)** | **61.72%** | **88.45%** | **0.763** | **88.45%** | 100% | **0.731** |

### 3.3. Precision@K va NDCG@K dinamikasi

[GRAFIK: 04_precision_at_k_curve.png]

K oshgan sari Precision yaxshilanadi:
- K=1: 61.72% (eng aniq top tavsiya);
- K=5: 88.45% (top-5 ichida to'g'ri javob);
- K=10: 94.72% (deyarli barchasi top-10'ga tushadi).

### 3.4. Hybrid α qiymatining tuning

[GRAFIK: 05_alpha_tuning.png]

Validation to'plamida 11 ta α qiymati sinaldi: α ∈ {0.0, 0.1, ..., 1.0}.
- α=0.0 (toza CF): NDCG@5 = 0.087;
- α=0.5 (teng): NDCG@5 = 0.376;
- α=1.0 (toza Content): NDCG@5 = 0.724.

**Eng yaxshi α = 1.0** — bu cold-start senariosida Content-Based hukmronligini isbotlaydi.

### 3.5. Kasblarning 2D vizualizatsiyasi

[GRAFIK: 06_career_2d.png]

TruncatedSVD orqali 101 dim → 2 dim qisqartirilganda, bir kategoriyadagi kasblar yaqin guruhlanadi (kasblar feature semantikasini saqlaydi).

### 3.6. Confusion Matrix (kategoriya darajasida)

[GRAFIK: 07_confusion_matrix.png]

Diagonal qiymatlar yuqori — model to'g'ri kategoriyani topadi. Eng yaxshi ko'rsatkichli kategoriyalar: IT, Tibbiyot, Muhandislik, Pedagogika.

### 3.7. Misol bashoratlar (Explainability)

[GRAFIK: 08_explanation_examples.png]

3 ta turli profile uchun tavsiyalar:

**1. IT-yo'naltirilgan talaba** (RIASEC dominant: I=9, C=8):
1. Sun'iy intellekt muhandisi (0.93)
2. Ma'lumotlar olimi (0.93)
3. Ma'lumotlar tadqiqotchisi (0.85)

**Izoh:** "Tadqiqotchi moyilligi mos keldi, IT va Fan qiziqishlari mos, Matematika va Informatika fanlari muhim."

### 3.8. Cold-start vs Warm-start tahlili

CF zaif natija ko'rsatdi (P@5 = 20-48%) chunki sintetik foydalanuvchilar bir martalik interaction'larga ega.

**Hipotetik tahmin:** Real foydalanuvchilar bilan (har user 5-10 ta kasbni baholaganida), CF samaradorligi 60-70% gacha o'sishi kutiladi.

### 3.9. Veb-interfeysning amalga oshirilishi

Tizim 5 bosqichli oqimga ega:
1. Welcome Page;
2. Login/Register;
3. RIASEC test (30 ta savol);
4. Akademik va qiziqishlar formasi;
5. Top-5 kasb tavsiyalari (confidence bilan).

URL: https://kasbim-frontend.onrender.com

### 3.10. 3-bob bo'yicha xulosa

- Content-Based model cold-start senariosida 88.45% Precision@5 ga erishdi;
- Hybrid eng yaxshi tanlovni avtomatik amalga oshirdi (α=1.0);
- CF yondashuv real interaction'larsiz cheklangan;
- Sistema 303 ta kasbni 100% coverage bilan tavsiya qila oladi.

---

## 4-BOB: XULOSA VA TAVSIYALAR (~3-5 sahifa)

### 4.1. Erishilgan natijalar

Diplom ishida quyidagi maqsadlarga erishildi:
1. **303 ta kasb** uchun to'liq ma'lumotlar bazasi tuzildi;
2. **101 dim feature vector** strukturasi loyihalandi;
3. **4 ta algoritm** amalga oshirildi (Content-Based, CF-NMF, CF-SVD, Hybrid);
4. **6 ta metrika** bo'yicha modellar baholandi va taqqoslandi;
5. **Veb-interfeys** orqali tizim foydalanuvchilarga ochildi;
6. **88.45% aniqlik** (Precision@5) bilan ishlovchi model olindi.

### 4.2. Ilmiy yangiligi

- O'zbek tilida ishlaydigan birinchi ML kasb tavsiya tizimi;
- Cold-start muammosini Content-Based bilan hal qilish;
- Hybrid α-tuning orqali optimal aralashma topish;
- Explainability bilan tavsiyalar (har biri uchun "nima uchun" izoh).

### 4.3. Kelajakdagi ishlar

1. **Real foydalanuvchilarni yig'ish** — 1000+ haqiqiy user bilan A/B test;
2. **Deep Learning** — Neural Collaborative Filtering (NCF) ni qo'shish;
3. **NLP** — foydalanuvchining matnli profilini qabul qilish (BERT/Transformer);
4. **Implicit feedback** — kasbga necha marta qarash, qancha vaqt sarflash;
5. **Mobile ilova** — React Native asosida;
6. **A/B test** — turli modellarni real bozorda taqqoslash.

### 4.4. Amaliy tavsiyalar

- O'zbekiston ta'lim vazirligi sotib olishi yoki integratsiya qilishi mumkin;
- Universitetlarning kasbga yo'naltirish markazlariga tarqatish;
- IT bootcamp va qayta tayyorlash kurslari uchun foydalanish.

---

## FOYDALANILGAN ADABIYOTLAR (30+ manba)

### Kitoblar

1. Holland, J. L. (1997). *Making Vocational Choices: A Theory of Vocational Personalities and Work Environments.* Psychological Assessment Resources.

2. Aggarwal, C. C. (2016). *Recommender Systems: The Textbook.* Springer.

3. Ricci, F., Rokach, L., Shapira, B. (2015). *Recommender Systems Handbook* (2nd ed.). Springer.

### Ilmiy maqolalar

4. Koren, Y., Bell, R., Volinsky, C. (2009). Matrix Factorization Techniques for Recommender Systems. *IEEE Computer*, 42(8), 30-37.

5. Lee, D. D., Seung, H. S. (1999). Learning the parts of objects by non-negative matrix factorization. *Nature*, 401, 788-791.

6. Burke, R. (2002). Hybrid Recommender Systems: Survey and Experiments. *User Modeling and User-Adapted Interaction*, 12(4), 331-370.

7. Lops, P., de Gemmis, M., Semeraro, G. (2011). Content-based Recommender Systems: State of the Art and Trends. In *Recommender Systems Handbook*, pp. 73-105.

8. Cremonesi, P., Koren, Y., Turrin, R. (2010). Performance of Recommender Algorithms on Top-N Recommendation Tasks. *RecSys'10*, 39-46.

9. Järvelin, K., Kekäläinen, J. (2002). Cumulated Gain-Based Evaluation of IR Techniques. *ACM TOIS*, 20(4), 422-446.

### Tegishli konferensiyalar

10. Aalbers, S. et al. (2018). A Recommendation System for Career Choices Based on Skills and Personality Traits. *Recsys'18 Workshop*.

11. Patel, B. et al. (2017). On-going Career Adaptation to Industry Demands using ML Approach. *ICACCI*.

### Online manbalar

12. Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. *JMLR*, 12, 2825-2830.

13. Hug, N. (2020). Surprise: A Python library for recommender systems. *JOSS*.

14. scikit-learn documentation: https://scikit-learn.org/

15. FastAPI documentation: https://fastapi.tiangolo.com/

### O'zbek tilidagi manbalar

16. O'zbekiston Respublikasi Statistika qo'mitasi. (2024). *Yoshlar bandligi va NEET ko'rsatkichlari hisoboti.*

17. Sayidova, M.A. (2020). Yoshlarning kasb tanlash motivatsiyasi. *O'zbekiston Pedagogika Universiteti Maqolalari*.

[Foydalanilgan adabiyotlarni 30+ ga to'ldirish kerak]

---

## ILOVALAR

### Ilova A: Manba kodi
Loyiha kodi: https://github.com/maxmudmx/career-guidance-ai (branch: `recsys-diploma`)

### Ilova B: Qo'shimcha grafiklar
`notebooks/figures/` papkasida:
- 01_riasec_distribution.png
- 02_category_counts.png
- 03_models_comparison.png
- 04_precision_at_k_curve.png
- 05_alpha_tuning.png
- 06_career_2d.png
- 07_confusion_matrix.png
- 08_explanation_examples.png

### Ilova C: Ma'lumotlar to'plami
- `results.csv` — barcha modellar metrikalari
- `alpha_tuning.csv` — α qiymatlari bo'yicha natijalar

### Ilova D: API dokumentatsiyasi
Backend API hujjatlari: https://career-guidance-ai-y3ku.onrender.com/docs

### Ilova E: Foydalanuvchi qo'llanmasi
1. Saytni oching: https://kasbim-frontend.onrender.com
2. Ro'yxatdan o'ting
3. RIASEC testni topshiring (5 daqiqa)
4. Qiziqishlar va fanlarni belgilang
5. Top-5 kasb tavsiyalarini oling

---

## Diplom himoyasiga tayyorlanish kontrol ro'yxati

- [ ] Annotatsiya 3 tilda tayyor (Uz, Rus, En)
- [ ] Mundarija va sahifalar to'g'ri ko'rsatilgan
- [ ] Barcha grafiklar yuqori sifatda
- [ ] Foydalanilgan adabiyotlar 30+
- [ ] Online demo ishlab turibdi (saytga 5 daqiqa oldin kiring)
- [ ] PowerPoint prezentatsiyasi (20-25 slayd)
- [ ] Demo videosi (3 daqiqalik backup, internet bo'lmasa)
- [ ] Source code GitHub'da ochiq (yoki rahbarga PDF berilgan)
- [ ] Rahbar bilan oxirgi maslahat
- [ ] Rasmiy hujjatlar (rahbar imzosi, kafedra muhri)

### Asosiy savollar himoyada (mumkin)

**1. "Nima uchun aynan Recommender System?"**
> Mavjud "Random Forest classifier" yondashuvi top-1 javob beradi. Bizning Hybrid System esa top-K ehtimollik bilan tavsiya beradi — bu real foydalanuvchi uchun ko'proq variant taqdim etadi.

**2. "Nima uchun α=1.0 chiqdi? CF foydasizmi?"**
> Yo'q. Bu cold-start senariosi natijasi. Real foydalanuvchilar 5-10 ta interaction'ga ega bo'lganida CF samaradorligi oshadi (Koren et al. 2009).

**3. "Datasetingiz sintetik. Bu ishonchli?"**
> Sintetik dataset content-based modelni va metodologiyani validatsiya qilish uchun yetarli. Production'da real foydalanuvchilar bilan online learning yo'lga qo'yiladi.

**4. "303 kasbga bo'lib chiqarish — overfitting bo'lmaydimi?"**
> Yo'q. Stratified train/test split orqali har kasbda hech bo'lmaganda 1 ta test sample bor. Va 100% coverage isboti — model 1 ta kasbga "yopishib qolmasdan" barchasini tavsiya qila oladi.

**5. "Nima uchun NDCG? Boshqa metrikalar yo'qmi?"**
> NDCG tartib sifatini o'lchaydi (yuqori pozitsiyadagi to'g'ri javob muhimroq). Bu kasb tavsiyasi uchun ahamiyatli — birinchi tavsiya foydalanuvchi e'tiborini ko'proq tortadi.
