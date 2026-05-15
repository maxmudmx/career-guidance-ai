-- ============================================================
-- Kasbim - Ma'lumotlar Bazasi
-- PostgreSQL init script
-- ============================================================

CREATE DATABASE career_guidance;
\c career_guidance;

-- 1. Foydalanuvchilar jadvali
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    avatar_url VARCHAR(500),
    region VARCHAR(100),
    date_of_birth DATE,
    target_occupation_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Kasblar jadvali
CREATE TABLE IF NOT EXISTS occupations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_uz VARCHAR(200) NOT NULL,
    description TEXT,
    description_uz TEXT,
    required_skills TEXT[] NOT NULL,           -- {"Python","SQL","ML"}
    avg_salary VARCHAR(50),
    riasec_profile JSONB NOT NULL,            -- {"R":3,"I":9,"A":4,"S":3,"E":2,"C":7}
    roadmap JSONB,                            -- 6 oylik yo'l xaritasi
    category VARCHAR(100),
    demand_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Test natijalari jadvali
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    riasec_scores JSONB NOT NULL,             -- {"R":7,"I":9,"A":3,"S":5,"E":4,"C":6}
    academic_data JSONB,                      -- {"gpa":4.2,"analytical":8,"communication":6}
    user_skills TEXT[],                       -- {"Python","SQL"}
    predictions JSONB,                        -- Top 3 kasblar va foizlar
    skills_gap JSONB,                         -- Yetishmayotgan ko'nikmalar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Rezume tahlili jadvali
CREATE TABLE IF NOT EXISTS resume_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    extracted_keywords TEXT[],
    matched_occupation_id INTEGER REFERENCES occupations(id),
    match_percentage DECIMAL(5,2),
    analysis_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. RIASEC savollari jadvali
CREATE TABLE IF NOT EXISTS riasec_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_text_uz TEXT NOT NULL,
    category CHAR(1) NOT NULL CHECK (category IN ('R','I','A','S','E','C')),
    order_num INTEGER NOT NULL
);

-- 6. Vakansiyalar jadvali (HH.uz scraper uchun)
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    occupation_id INTEGER NOT NULL,
    hh_id VARCHAR(50),
    title VARCHAR(300) NOT NULL,
    company VARCHAR(200),
    salary_from INTEGER,
    salary_to INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'UZS',
    location VARCHAR(100),
    employment_type VARCHAR(50),
    experience VARCHAR(100),
    link VARCHAR(500) NOT NULL,
    description VARCHAR(1000),
    source VARCHAR(50) NOT NULL DEFAULT 'hh.uz',
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Dublikatni oldini olish: bir xil kasb + HH ID
    CONSTRAINT uq_job_occ_hhid UNIQUE (occupation_id, hh_id)
);
CREATE INDEX IF NOT EXISTS idx_jobs_occ_fetched ON jobs (occupation_id, fetched_at DESC);

-- ============================================================
-- Boshlang'ich ma'lumotlarni kiritish
-- ============================================================

-- Kasblar
INSERT INTO occupations (name, name_uz, description, description_uz, required_skills, avg_salary, riasec_profile, roadmap, category, demand_level) VALUES
(
    'Data Scientist', 'Ma''lumotlar olimi',
    'Analyze data and build predictive models to support business decisions',
    'Ma''lumotlarni tahlil qilib, biznes qarorlarni qo''llab-quvvatlaydigan modellar yaratish',
    ARRAY['Python','Statistika','Machine Learning','SQL','Matematika','Data Visualization'],
    '$120,000',
    '{"R":3,"I":9,"A":4,"S":3,"E":2,"C":7}',
    '[{"month":"1-2 oy","title":"Python va Statistika asoslari","resources":["Coursera: Python for Everybody","Khan Academy: Statistics"]},{"month":"3-4 oy","title":"Machine Learning asoslari","resources":["Coursera: Andrew Ng ML","Kaggle Learn"]},{"month":"5-6 oy","title":"Deep Learning va Portfolio","resources":["Fast.ai","Kaggle Competitions"]}]',
    'Data & AI', 'high'
),
(
    'Backend Developer', 'Backend dasturchi',
    'Build server-side software and APIs',
    'Server tomonidagi dasturiy ta''minot va API''lar yaratish',
    ARRAY['Python','SQL','API Design','Docker','Git','System Design'],
    '$110,000',
    '{"R":5,"I":8,"A":2,"S":2,"E":3,"C":8}',
    '[{"month":"1-2 oy","title":"Python va SQL chuqurlashtirilgan","resources":["FreeCodeCamp","SQLBolt"]},{"month":"3-4 oy","title":"FastAPI/Django va Docker","resources":["FastAPI Docs","Docker Tutorial"]},{"month":"5-6 oy","title":"System Design va Deploy","resources":["System Design Primer","AWS Free Tier"]}]',
    'Software Engineering', 'high'
),
(
    'UI/UX Designer', 'UI/UX dizayner',
    'Design user interfaces and optimize user experience',
    'Foydalanuvchi interfeyslarini loyihalash va foydalanuvchi tajribasini optimallashtirish',
    ARRAY['Figma','Dizayn','Prototiplash','Foydalanuvchi tadqiqoti','Rang nazariyasi','Tipografiya'],
    '$95,000',
    '{"R":2,"I":5,"A":9,"S":6,"E":4,"C":3}',
    '[{"month":"1-2 oy","title":"Dizayn asoslari va Figma","resources":["Google UX Design Certificate","Figma YouTube"]},{"month":"3-4 oy","title":"UX Research va Prototiplash","resources":["Nielsen Norman Group","Coursera UX"]},{"month":"5-6 oy","title":"Portfolio va Real Projects","resources":["Dribbble","Behance"]}]',
    'Design', 'medium'
),
(
    'Project Manager', 'Loyiha menejeri',
    'Manage IT projects, coordinate teams and achieve goals',
    'IT loyihalarni boshqarish, jamoani muvofiqlashtirish va maqsadlarga erishish',
    ARRAY['Boshqaruv','Kommunikatsiya','Agile','Jira','Risk Analysis','Budjetlashtirish'],
    '$100,000',
    '{"R":2,"I":4,"A":3,"S":7,"E":8,"C":6}',
    '[{"month":"1-2 oy","title":"PM asoslari va Agile/Scrum","resources":["Google PM Certificate","Scrum Guide"]},{"month":"3-4 oy","title":"Jira, Risk va Budget","resources":["Atlassian University","Coursera PM"]},{"month":"5-6 oy","title":"PMP sertifikatsiya tayyorligi","resources":["PMI","Udemy PMP Prep"]}]',
    'Management', 'high'
),
(
    'Cybersecurity Analyst', 'Kiberxavfsizlik mutaxassisi',
    'Protect systems and data from cyber attacks',
    'Tizim va ma''lumotlarni kiberhujumlardan himoya qilish',
    ARRAY['Tarmoq xavfsizligi','Linux','Python','Penetration Testing','SIEM','Kriptografiya'],
    '$105,000',
    '{"R":6,"I":8,"A":2,"S":2,"E":3,"C":9}',
    '[{"month":"1-2 oy","title":"Tarmoq va Linux asoslari","resources":["CompTIA Network+","Linux Academy"]},{"month":"3-4 oy","title":"Xavfsizlik vositalari va Python","resources":["TryHackMe","Hack The Box"]},{"month":"5-6 oy","title":"CEH/Security+ tayyorligi","resources":["CompTIA Security+","CEH Prep"]}]',
    'Cybersecurity', 'high'
),
(
    'Mobile Developer', 'Mobil dasturchi',
    'Build mobile applications for iOS and Android',
    'iOS va Android uchun mobil ilovalar yaratish',
    ARRAY['React Native','JavaScript','UI Design','API Integration','Git','Firebase'],
    '$108,000',
    '{"R":5,"I":7,"A":6,"S":3,"E":3,"C":6}',
    '[{"month":"1-2 oy","title":"JavaScript va React asoslari","resources":["FreeCodeCamp React","JavaScript.info"]},{"month":"3-4 oy","title":"React Native va Firebase","resources":["React Native Docs","Firebase Tutorials"]},{"month":"5-6 oy","title":"App Store deploy va Portfolio","resources":["Expo Docs","Real Projects"]}]',
    'Software Engineering', 'high'
),
(
    'DevOps Engineer', 'DevOps muhandisi',
    'Automate software delivery and manage infrastructure',
    'Dasturiy ta''minotni avtomatlashtirish va infratuzilmani boshqarish',
    ARRAY['Linux','Docker','Kubernetes','CI/CD','AWS/Cloud','Terraform'],
    '$125,000',
    '{"R":7,"I":7,"A":2,"S":2,"E":3,"C":9}',
    '[{"month":"1-2 oy","title":"Linux va Docker chuqurlashtirilgan","resources":["Linux Foundation","Docker Mastery"]},{"month":"3-4 oy","title":"Kubernetes va CI/CD","resources":["KodeKloud","GitHub Actions Docs"]},{"month":"5-6 oy","title":"Cloud va Terraform","resources":["AWS Free Tier","Terraform Tutorials"]}]',
    'DevOps', 'high'
),
(
    'AI/ML Engineer', 'Sun''iy intellekt muhandisi',
    'Build AI models and neural networks',
    'Sun''iy intellekt modellari va neural tarmoqlar yaratish',
    ARRAY['Python','TensorFlow','PyTorch','Matematika','NLP','Computer Vision'],
    '$135,000',
    '{"R":4,"I":10,"A":5,"S":2,"E":2,"C":7}',
    '[{"month":"1-2 oy","title":"Matematika va Python ML","resources":["3Blue1Brown","Coursera ML Specialization"]},{"month":"3-4 oy","title":"Deep Learning va Frameworks","resources":["Fast.ai","PyTorch Tutorials"]},{"month":"5-6 oy","title":"NLP/CV va Research Papers","resources":["Hugging Face","Papers With Code"]}]',
    'Data & AI', 'high'
);

-- RIASEC savollari (30 ta)
INSERT INTO riasec_questions (question_text, question_text_uz, category, order_num) VALUES
-- Realistic (R)
('I enjoy working with tools and equipment', 'Men asbob-uskunalar bilan ishlashni yoqtiraman', 'R', 1),
('Building things with my hands gives me pleasure', 'Qo''lim bilan biror narsa yasash menga zavq beradi', 'R', 2),
('Solving technical problems interests me', 'Texnik muammolarni hal qilish menga qiziq', 'R', 3),
('Assembling/repairing computer hardware is interesting to me', 'Kompyuter qurilmalarini yig''ish/ta''mirlash men uchun qiziqarli', 'R', 4),
('I prefer practical, tangible results', 'Men amaliy, qo''lga ko''rinadigan natijalarni afzal ko''raman', 'R', 5),
-- Investigative (I)
('I enjoy reading scientific articles', 'Men ilmiy maqolalar o''qishni yoqtiraman', 'I', 6),
('Solving complex problems interests me', 'Murakkab masalalarni yechish menga qiziq', 'I', 7),
('I strive to understand inner workings of things', 'Men narsalarning ichki tuzilishini tushunishga intilaman', 'I', 8),
('I enjoy research and analysis', 'Tadqiqot va tahlil qilish menga yoqadi', 'I', 9),
('Logical thinking is my strength', 'Mantiqiy fikrlash mening kuchli tomonim', 'I', 10),
-- Artistic (A)
('Creative projects inspire me', 'Ijodiy loyihalar menga ilhom beradi', 'A', 11),
('I like to express myself artistically', 'Men o''zimni badiiy tomondan ifoda etishni yoqtiraman', 'A', 12),
('Design and aesthetics matter to me', 'Dizayn va estetika menga muhim', 'A', 13),
('I am active in generating new ideas', 'Men yangi g''oyalar yaratishda faolman', 'A', 14),
('I engage in music, art, or writing', 'Musiqa, san''at yoki yozuv bilan shug''ullanaman', 'A', 15),
-- Social (S)
('Helping people gives me pleasure', 'Odamlarga yordam berish menga zavq beradi', 'S', 16),
('I prefer working in teams', 'Men jamoada ishlashni afzal ko''raman', 'S', 17),
('I enjoy teaching or advising others', 'Boshqalarni o''qitish yoki maslahat berish menga yoqadi', 'S', 18),
('Communication is my strength', 'Muloqot qilish mening kuchli tomonim', 'S', 19),
('I am ready to solve others problems', 'Men boshqalarning muammolarini hal qilishga tayyor', 'S', 20),
-- Enterprising (E)
('I enjoy leading others', 'Men rahbarlik qilishni yoqtiraman', 'E', 21),
('Business and entrepreneurship interest me', 'Biznes va tadbirkorlik menga qiziq', 'E', 22),
('I can persuade others', 'Men boshqalarni ishontira olaman', 'E', 23),
('I am proactive in making decisions', 'Qaror qabul qilishda tashabbuskor bo''laman', 'E', 24),
('Competition and success motivate me', 'Raqobat va muvaffaqiyat menga motivatsiya beradi', 'E', 25),
-- Conventional (C)
('I prefer working in an orderly and systematic way', 'Tartibli va tizimli ishlashni afzal ko''raman', 'C', 26),
('I enjoy organizing data', 'Ma''lumotlarni tartibga solish menga yoqadi', 'C', 27),
('I believe following rules is important', 'Men qoidalarga rioya qilishni muhim deb bilaman', 'C', 28),
('Attention to detail is my strength', 'Detallarga e''tibor berish mening kuchli tomonim', 'C', 29),
('I am comfortable working with clear instructions', 'Aniq ko''rsatmalar bo''yicha ishlash menga qulay', 'C', 30);

-- Indekslar
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_resume_analyses_user ON resume_analyses(user_id);
CREATE INDEX idx_occupations_category ON occupations(category);
