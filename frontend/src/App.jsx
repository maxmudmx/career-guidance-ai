import { useState, useEffect, useRef } from 'react';
import ChatBot from './components/ChatBot';
import WelcomePage from './pages/WelcomePage';
import RiasecTest from './pages/RiasecTest';
import AcademicSkills from './pages/AcademicSkills';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import ResetPassword from './pages/ResetPassword';
import VerifyEmailBanner from './components/VerifyEmailBanner';
import SettingsPage from './pages/SettingsPage';
import TestIntroPage from './pages/TestIntroPage';
import HistoryPage from './pages/HistoryPage';
import MyGoalPage from './pages/MyGoalPage';
import CareerProfilePage from './pages/CareerProfilePage';
import { Brain, CheckCircle, User, UserCircle, Settings, LogOut, Loader2, ClipboardList, History, Star, UserCog } from 'lucide-react';
import { authAPI, tokenStorage } from './services/api';
import { Card } from './components/ui';
import './index.css';

// ============================================================
// 15 ta kasb — local fallback prediction uchun
// ============================================================
const OCCUPATIONS_LOCAL = [
  { id:0, name:"Data Scientist", name_uz:"Ma'lumotlar olimi", avg_salary:"$120,000", demand:"Yuqori", growth:"+35%", riasec:{R:3,I:9,A:4,S:3,E:2,C:7}, required_skills:["Python","Statistika","Machine Learning","SQL","Matematika","Data Visualization"], description_uz:"Ma'lumotlarni tahlil qilib, biznes qarorlarni qo'llab-quvvatlaydigan modellar yaratish", roadmap:[{month:"1-2 oy",title:"Python va Statistika asoslari",resources:["Coursera: Python for Everybody","Khan Academy: Statistics"]},{month:"3-4 oy",title:"Machine Learning asoslari",resources:["Coursera: Andrew Ng ML","Kaggle Learn"]},{month:"5-6 oy",title:"Deep Learning va Portfolio",resources:["Fast.ai","Kaggle Competitions"]}]},
  { id:1, name:"Backend Developer", name_uz:"Backend dasturchi", avg_salary:"$110,000", demand:"Yuqori", growth:"+25%", riasec:{R:5,I:8,A:2,S:2,E:3,C:8}, required_skills:["Python","SQL","API Design","Docker","Git","System Design"], description_uz:"Server tomonidagi dasturiy ta'minot va API'lar yaratish", roadmap:[{month:"1-2 oy",title:"Python va SQL chuqurlashtirilgan",resources:["FreeCodeCamp","SQLBolt"]},{month:"3-4 oy",title:"FastAPI/Django va Docker",resources:["FastAPI Docs","Docker Tutorial"]},{month:"5-6 oy",title:"System Design va Deploy",resources:["System Design Primer","AWS Free Tier"]}]},
  { id:2, name:"UI/UX Designer", name_uz:"UI/UX dizayner", avg_salary:"$95,000", demand:"O'rta", growth:"+16%", riasec:{R:2,I:5,A:9,S:6,E:4,C:3}, required_skills:["Figma","Dizayn","Prototiplash","Foydalanuvchi tadqiqoti","Rang nazariyasi","Tipografiya"], description_uz:"Foydalanuvchi interfeyslarini loyihalash va tajribasini optimallashtirish", roadmap:[{month:"1-2 oy",title:"Dizayn asoslari va Figma",resources:["Google UX Design Certificate","Figma YouTube"]},{month:"3-4 oy",title:"UX Research va Prototiplash",resources:["Nielsen Norman Group","Coursera UX"]},{month:"5-6 oy",title:"Portfolio va Real Projects",resources:["Dribbble","Behance"]}]},
  { id:3, name:"Project Manager", name_uz:"Loyiha menejeri", avg_salary:"$100,000", demand:"Yuqori", growth:"+20%", riasec:{R:2,I:4,A:3,S:7,E:8,C:6}, required_skills:["Boshqaruv","Kommunikatsiya","Agile","Jira","Risk Analysis","Budjetlashtirish"], description_uz:"IT loyihalarni boshqarish, jamoani muvofiqlashtirish va maqsadlarga erishish", roadmap:[{month:"1-2 oy",title:"PM asoslari va Agile/Scrum",resources:["Google PM Certificate","Scrum Guide"]},{month:"3-4 oy",title:"Jira, Risk va Budget",resources:["Atlassian University","Coursera PM"]},{month:"5-6 oy",title:"PMP sertifikatsiya tayyorligi",resources:["PMI","Udemy PMP Prep"]}]},
  { id:4, name:"Cybersecurity Analyst", name_uz:"Kiberxavfsizlik mutaxassisi", avg_salary:"$105,000", demand:"Juda yuqori", growth:"+40%", riasec:{R:6,I:8,A:2,S:2,E:3,C:9}, required_skills:["Tarmoq xavfsizligi","Linux","Python","Penetration Testing","SIEM","Kriptografiya"], description_uz:"Tizim va ma'lumotlarni kiberhujumlardan himoya qilish", roadmap:[{month:"1-2 oy",title:"Tarmoq va Linux asoslari",resources:["CompTIA Network+","Linux Academy"]},{month:"3-4 oy",title:"Xavfsizlik vositalari va Python",resources:["TryHackMe","Hack The Box"]},{month:"5-6 oy",title:"CEH/Security+ tayyorligi",resources:["CompTIA Security+","CEH Prep"]}]},
  { id:5, name:"Mobile Developer", name_uz:"Mobil dasturchi", avg_salary:"$108,000", demand:"Yuqori", growth:"+22%", riasec:{R:5,I:7,A:6,S:3,E:3,C:6}, required_skills:["React Native","JavaScript","UI Design","API Integration","Git","Firebase"], description_uz:"iOS va Android uchun mobil ilovalar yaratish", roadmap:[{month:"1-2 oy",title:"JavaScript va React asoslari",resources:["FreeCodeCamp React","JavaScript.info"]},{month:"3-4 oy",title:"React Native va Firebase",resources:["React Native Docs","Firebase Tutorials"]},{month:"5-6 oy",title:"App Store deploy va Portfolio",resources:["Expo Docs","Real Projects"]}]},
  { id:6, name:"DevOps Engineer", name_uz:"DevOps muhandisi", avg_salary:"$125,000", demand:"Juda yuqori", growth:"+45%", riasec:{R:7,I:7,A:2,S:2,E:3,C:9}, required_skills:["Linux","Docker","Kubernetes","CI/CD","AWS/Cloud","Terraform"], description_uz:"Dasturiy ta'minotni avtomatlashtirish va infratuzilmani boshqarish", roadmap:[{month:"1-2 oy",title:"Linux va Docker chuqurlashtirilgan",resources:["Linux Foundation","Docker Mastery"]},{month:"3-4 oy",title:"Kubernetes va CI/CD",resources:["KodeKloud","GitHub Actions Docs"]},{month:"5-6 oy",title:"Cloud va Terraform",resources:["AWS Free Tier","Terraform Tutorials"]}]},
  { id:7, name:"AI/ML Engineer", name_uz:"Sun'iy intellekt muhandisi", avg_salary:"$135,000", demand:"Juta yuqori", growth:"+55%", riasec:{R:4,I:10,A:5,S:2,E:2,C:7}, required_skills:["Python","TensorFlow","PyTorch","Matematika","NLP","Computer Vision"], description_uz:"Sun'iy intellekt modellari va neural tarmoqlar yaratish", roadmap:[{month:"1-2 oy",title:"Matematika va Python ML",resources:["3Blue1Brown","Coursera ML Specialization"]},{month:"3-4 oy",title:"Deep Learning va Frameworks",resources:["Fast.ai","PyTorch Tutorials"]},{month:"5-6 oy",title:"NLP/CV va Research Papers",resources:["Hugging Face","Papers With Code"]}]},
  { id:8, name:"Frontend Developer", name_uz:"Frontend dasturchi", avg_salary:"$100,000", demand:"Yuqori", growth:"+28%", riasec:{R:3,I:7,A:8,S:3,E:3,C:5}, required_skills:["JavaScript","React","HTML/CSS","TypeScript","Git","Figma"], description_uz:"Veb saytlar va ilovalarning foydalanuvchi interfeysini yaratish", roadmap:[{month:"1-2 oy",title:"HTML/CSS va JavaScript asoslari",resources:["The Odin Project","CSS Tricks"]},{month:"3-4 oy",title:"React va TypeScript",resources:["React.dev","TypeScript Handbook"]},{month:"5-6 oy",title:"Portfolio va ishga kirish",resources:["Frontend Mentor","GitHub Portfolio"]}]},
  { id:9, name:"Full Stack Developer", name_uz:"Full Stack dasturchi", avg_salary:"$115,000", demand:"Juta yuqori", growth:"+32%", riasec:{R:4,I:8,A:5,S:3,E:3,C:7}, required_skills:["JavaScript","React","Node.js","SQL","Docker","Git"], description_uz:"Frontend va backend ikkalasini qamrab oluvchi to'liq dasturiy yechimlar yaratish", roadmap:[{month:"1-2 oy",title:"JavaScript va React asoslari",resources:["Full Stack Open","FreeCodeCamp"]},{month:"3-4 oy",title:"Node.js, Express va SQL",resources:["Node.js Docs","PostgreSQL Tutorial"]},{month:"5-6 oy",title:"Docker, Deploy va Portfolio",resources:["Docker Docs","Vercel/Railway"]}]},
  { id:10, name:"Data Engineer", name_uz:"Ma'lumotlar muhandisi", avg_salary:"$118,000", demand:"Juta yuqori", growth:"+38%", riasec:{R:4,I:9,A:3,S:2,E:2,C:9}, required_skills:["Python","SQL","Apache Spark","Kafka","AWS","Docker"], description_uz:"Katta hajmli ma'lumotlar quvurlarini (pipeline) loyihalash va qurish", roadmap:[{month:"1-2 oy",title:"SQL va Python ma'lumotlar asoslari",resources:["Mode SQL Tutorial","Python Data Science Handbook"]},{month:"3-4 oy",title:"Apache Spark va Kafka",resources:["Databricks Academy","Confluent Learn"]},{month:"5-6 oy",title:"Cloud (AWS/GCP) va Orchestration",resources:["AWS Data Analytics","Apache Airflow Docs"]}]},
  { id:11, name:"Cloud Engineer", name_uz:"Bulut muhandisi", avg_salary:"$122,000", demand:"Juta yuqori", growth:"+42%", riasec:{R:7,I:8,A:2,S:2,E:3,C:9}, required_skills:["AWS","Kubernetes","Terraform","Linux","Docker","Python"], description_uz:"Bulut infratuzilmasini loyihalash, qurish va boshqarish", roadmap:[{month:"1-2 oy",title:"Linux va Cloud asoslari",resources:["AWS Cloud Practitioner","Linux Foundation"]},{month:"3-4 oy",title:"Kubernetes va Terraform",resources:["KodeKloud K8s","HashiCorp Learn"]},{month:"5-6 oy",title:"AWS Solutions Architect",resources:["Adrian Cantrill Course","AWS Practice Exams"]}]},
  { id:12, name:"QA Engineer", name_uz:"Sifat nazorati muhandisi", avg_salary:"$88,000", demand:"O'rta", growth:"+15%", riasec:{R:4,I:7,A:3,S:4,E:2,C:9}, required_skills:["Selenium","Python","Testing","Agile","Git","Jira"], description_uz:"Dasturiy ta'minotning sifatini tekshirish va avtomatlashtirilgan test yozish", roadmap:[{month:"1-2 oy",title:"Dasturiy ta'minot testlash asoslari",resources:["ISTQB Foundation","Testing with Python"]},{month:"3-4 oy",title:"Selenium va API Testing",resources:["Selenium WebDriver","Postman Learning"]},{month:"5-6 oy",title:"CI/CD integratsiya va ISTQB",resources:["GitHub Actions","ISTQB Certification"]}]},
  { id:13, name:"Business Analyst", name_uz:"Biznes tahlilchi", avg_salary:"$92,000", demand:"O'rta", growth:"+18%", riasec:{R:2,I:6,A:3,S:7,E:7,C:7}, required_skills:["SQL","Excel","Kommunikatsiya","Agile","Vizualizatsiya","Boshqaruv"], description_uz:"Biznes jarayonlarni tahlil qilib, IT yechimlar orqali muammolarni hal qilish", roadmap:[{month:"1-2 oy",title:"SQL va Excel chuqurlashtirilgan",resources:["Mode SQL","Excel Jet"]},{month:"3-4 oy",title:"Biznes talablar va UML",resources:["BA Guild","Lucidchart UML"]},{month:"5-6 oy",title:"CBAP sertifikati tayyorligi",resources:["IIBA","Udemy BA Course"]}]},
  { id:14, name:"Blockchain Developer", name_uz:"Blokcheyn dasturchisi", avg_salary:"$130,000", demand:"O'sib bormoqda", growth:"+60%", riasec:{R:4,I:9,A:5,S:2,E:4,C:7}, required_skills:["Solidity","JavaScript","Web3","Smart Contracts","Kriptografiya","Python"], description_uz:"Blokcheyn platformalarda smart kontraktlar va desentrallashgan ilovalar (DApp) yaratish", roadmap:[{month:"1-2 oy",title:"Blokcheyn asoslari va Solidity",resources:["CryptoZombies","Ethereum.org Learn"]},{month:"3-4 oy",title:"Smart Kontraktlar va Hardhat",resources:["Hardhat Docs","OpenZeppelin"]},{month:"5-6 oy",title:"DeFi/NFT loyiha va Audit",resources:["Alchemy University","Code4rena"]}]},
];

function localPredict(riasecScores, skills, academicData) {
  const cats = ['R','I','A','S','E','C'];
  const results = OCCUPATIONS_LOCAL.map((occ) => {
    let dot=0, magA=0, magB=0;
    cats.forEach(c => {
      const u = riasecScores[c]||0, o = occ.riasec[c]||0;
      dot += u*o; magA += u*u; magB += o*o;
    });
    const cosine = magA>0&&magB>0 ? dot/(Math.sqrt(magA)*Math.sqrt(magB)) : 0;
    let score = cosine * 55;
    const matched = skills.filter(s => occ.required_skills.includes(s));
    score += (matched.length/occ.required_skills.length)*28;
    if (academicData.gpa) score += (academicData.gpa/5)*8;
    if (academicData.analyticalThinking) score += (academicData.analyticalThinking/10)*5;
    if (academicData.communication) score += (academicData.communication/10)*4;
    return { ...occ, score: Math.min(Math.max(Math.round(score),20),96) };
  });
  return results.sort((a,b)=>b.score-a.score).slice(0,3);
}

// ============================================================
// Top Navbar — Figma uslubida (h-14, w-8 logo, avatar dropdown)
// ============================================================
// Nav button — top navbar uchun primary harakatlar
// Mobile'da: faqat ikonka, tooltip bilan
// Desktop'da: ikonka + label
function NavLink({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function LiveBanner({ user, onLogout, onProfile, onSettings, onTestStart, onHistory, onMyGoal, onCareerProfile, currentRoute }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const avatarSrc = user?.avatar_url || null;

  return (
    <nav
      className="sticky top-0 z-50 font-sans"
      style={{
        background: 'var(--bg-glass)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Nav links */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: '#3B82F6',
                  boxShadow: '0 0 16px rgba(59,130,246,0.35)',
                }}
              >
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-[17px] font-bold"
                style={{ letterSpacing: '-0.02em', color: 'var(--text)' }}
              >
                Kasbim
              </span>
            </div>

            {/* Top nav — mobile va desktop'da ko'rinadi */}
            {user && (
              <nav className="flex items-center gap-1">
                <NavLink
                  icon={ClipboardList}
                  label="Test boshlash"
                  onClick={onTestStart}
                  active={currentRoute === '/test'}
                />
                <NavLink
                  icon={Star}
                  label="Maqsadim"
                  onClick={onMyGoal}
                  active={currentRoute === '/my-goal'}
                />
                <NavLink
                  icon={History}
                  label="Tarix"
                  onClick={onHistory}
                  active={currentRoute === '/history'}
                />
              </nav>
            )}
          </div>

          {/* Right: avatar */}
          <div ref={menuRef} className="relative">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                  title={user.full_name || user.username}
                  className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden transition-all hover:opacity-90 ${
                    menuOpen ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{
                    background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
                    boxShadow: menuOpen ? '0 0 0 2px #3B82F6, 0 0 0 4px var(--bg)' : 'none',
                  }}
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 rounded-xl overflow-hidden"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-elevated, 0 4px 24px rgba(0,0,0,0.5))',
                    }}
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 px-3 py-3 border-b border-[#F3F4F6]">
                      <div className="relative w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#111827] truncate">
                          {user.full_name || user.username}
                        </div>
                        {user.email && (
                          <div className="text-xs text-[#6B7280] truncate">{user.email}</div>
                        )}
                      </div>
                    </div>

                    {/* Account items */}
                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onProfile();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#111827] hover:bg-[#F9FAFB]"
                      >
                        <UserCircle className="w-4 h-4 text-[#2563EB]" /> Mening profilim
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onCareerProfile?.();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#111827] hover:bg-[#F9FAFB]"
                      >
                        <UserCog className="w-4 h-4 text-[#2563EB]" /> Karyera profilim
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onSettings?.();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#111827] hover:bg-[#F9FAFB]"
                      >
                        <Settings className="w-4 h-4 text-[#9CA3AF]" /> Sozlamalar
                      </button>
                    </div>

                    <div className="border-t border-[#F3F4F6] py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onLogout();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2]"
                      >
                        <LogOut className="w-4 h-4" /> Chiqish
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-6" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// AI tahlil ekrani — Figma uslubida (RIASEC profili + skills + steps)
// ============================================================
const RIASEC_LABELS = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

function AnalyzingScreen({ riasecScores, userSkills }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showRiasec, setShowRiasec] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const stepDefs = [
    { text: 'Random Forest modelini yuklash...', duration: 300 },
    { text: 'RIASEC vektorni hisoblash...', duration: 500 },
    { text: '270+ kasb bilan solishtirish...', duration: 700 },
    { text: 'Skill match algoritmi...', duration: 500 },
    { text: 'Ball tarkibini hisoblash...', duration: 400 },
    { text: "Top 3 tanlash va roadmap qurish...", duration: 600 },
  ];

  useEffect(() => {
    let i = 0;
    let timer;
    const run = () => {
      if (i >= stepDefs.length) return;
      setCurrentStep(i);
      if (i === 1) setShowRiasec(true);
      if (i === 3) {
        setShowSkills(true);
        const inc = setInterval(() => {
          setConfidence((c) => {
            if (c >= 91) {
              clearInterval(inc);
              return 91;
            }
            return c + 1;
          });
        }, 12);
      }
      timer = setTimeout(() => {
        i += 1;
        run();
      }, stepDefs[i].duration);
    };
    run();
    return () => clearTimeout(timer);
  }, []);

  const riasecRows = Object.keys(RIASEC_LABELS).map((k) => ({
    type: k,
    label: RIASEC_LABELS[k],
    value: showRiasec ? Math.round(((riasecScores?.[k] ?? 0) / 10) * 100) : 0,
  }));

  const previewSkills = (userSkills && userSkills.length > 0
    ? userSkills.slice(0, 5)
    : ['Python', 'JavaScript', 'Problem Solving', 'Git', 'Communication']);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 font-sans relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Hero glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 400,
          background:
            'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
        }}
      />
      <div className="w-full max-w-5xl relative z-10">
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <Brain className="w-8 h-8 animate-pulse" style={{ color: 'var(--accent)' }} />
            </div>
            <h2
              className="text-2xl mb-2 font-bold"
              style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
            >
              AI tahlil qilmoqda
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              270+ kasb orasidan sizga eng mos kasblar tanlanmoqda
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* RIASEC Profile */}
            <div>
              <h3 className="text-sm text-[#6B7280] mb-4 font-medium">RIASEC profilingiz</h3>
              <div className="space-y-3">
                {riasecRows.map((row) => (
                  <div key={row.type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[#111827]">
                        {row.type} — {row.label}
                      </span>
                      <span className="text-sm text-[#4B5563]">{row.value}%</span>
                    </div>
                    <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Match */}
            <div>
              <h3 className="text-sm text-[#6B7280] mb-4 font-medium">Ko'nikmalar mosligi</h3>
              <div className="space-y-2">
                {previewSkills.map((skill) => (
                  <div
                    key={skill}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      showSkills
                        ? 'border-[#16A34A] bg-[#ECFDF5]'
                        : 'border-[#E5E7EB]'
                    }`}
                  >
                    <span className="text-sm text-[#111827]">{skill}</span>
                    {showSkills && <CheckCircle className="w-4 h-4 text-[#16A34A]" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2 mb-6">
            {stepDefs.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  i <= currentStep ? 'bg-[#F9FAFB]' : ''
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                ) : i === currentStep ? (
                  <Loader2 className="w-5 h-5 text-[#2563EB] flex-shrink-0 animate-spin" />
                ) : (
                  <div className="w-5 h-5 border-2 border-[#E5E7EB] rounded-full flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    i <= currentStep ? 'text-[#111827]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {s.text}
                </span>
              </div>
            ))}
          </div>

          {/* Tech stats */}
          {currentStep >= 3 && (
            <div className="border-t border-[#E5E7EB] pt-6 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-xs text-[#6B7280] mb-1">Kasb soni</div>
                <div className="text-xl text-[#111827] font-semibold">270+</div>
              </div>
              <div>
                <div className="text-xs text-[#6B7280] mb-1">Confidence</div>
                <div className="text-xl text-[#2563EB] font-semibold">{confidence}%</div>
              </div>
              <div>
                <div className="text-xs text-[#6B7280] mb-1">Model</div>
                <div className="text-xl text-[#2563EB] font-semibold">RandomForest</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// App
// ============================================================
export default function App() {
  const [step, setStep] = useState(0);
  const [riasecScores, setRiasecScores] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // ---- Auth holati ----
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ---- URL-asosidagi routing (browser back/forward ishlasin) ----
  const [route, setRoute] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (path) => {
    if (typeof window === 'undefined') return;
    if (path === window.location.pathname) return;
    window.history.pushState(null, '', path);
    setRoute(path);
  };

  const showProfile = route === '/profile';
  const showSettings = route.startsWith('/settings');
  const settingsView = route === '/settings/password' ? 'password' : 'main';
  const showTestIntro = route === '/test';
  const showHistory = route === '/history';
  const showMyGoal = route === '/my-goal';
  const showCareerProfile = route === '/career-profile';

  // ---- Password reset token (URL'dan) ----
  const [resetToken, setResetToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('reset_token');
  });

  // Ilova ochilganda tokenni tekshirish
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    // Token mavjud — serverda validate qilamiz
    authAPI.me()
      .then(res => setAuthUser(res.data))
      .catch(() => tokenStorage.clear())
      .finally(() => setAuthChecked(true));
  }, []);

  const handleAuth = (user) => {
    setAuthUser(user);
  };

  const handleLogout = () => {
    tokenStorage.clear();
    setAuthUser(null);
    navigate('/');
    setStep(0);
    setRiasecScores(null);
    setAcademicData(null);
    setPredictions(null);
    setAnalyzing(false);
  };

  const handleOpenProfile = () => navigate('/profile');
  const handleCloseProfile = () => navigate('/');
  const handleOpenSettings = () => navigate('/settings');
  const handleCloseSettings = () => navigate('/');
  // Test boshlash → Intro sahifasiga olib boradi (state'larni tozalab)
  const handleTestStart = () => {
    setStep(0);
    setRiasecScores(null);
    setAcademicData(null);
    setPredictions(null);
    setAnalyzing(false);
    navigate('/test');
  };

  // Intro'dagi "Davom etish" — to'g'ridan-to'g'ri RIASEC testga o'tadi
  const handleTestContinue = () => {
    setStep(1);
    navigate('/');
  };

  const handleOpenHistory = () => navigate('/history');
  const handleOpenMyGoal = () => navigate('/my-goal');
  const handleOpenCareerProfile = () => navigate('/career-profile');
  const handleAvatarUpdate = (avatarUrl) =>
    setAuthUser(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev);

  const handleRiasecComplete = (scores) => { setRiasecScores(scores); setStep(2); };

  const handleAcademicComplete = async (data) => {
    setAcademicData(data); setAnalyzing(true); setStep(3);
    try {
      const token = tokenStorage.get();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/predict/career', {
        method:'POST', headers,
        body: JSON.stringify({
          riasec_scores: riasecScores,
          skills: data.skills,
          academic_data: { gpa:data.gpa, analytical:data.analyticalThinking, communication:data.communication },
          age: data.age,
          interests: data.interests || [],
          subjects: data.subjects || [],
          skill_levels: data.skill_levels || {},
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setTimeout(()=>{ setPredictions(result.predictions); setAnalyzing(false); }, 3500);
        return;
      }
    } catch {}
    // Backend ishlamasa — eski 15 IT kasb bo'yicha fallback
    setTimeout(()=>{ setPredictions(localPredict(riasecScores,data.skills,data)); setAnalyzing(false); }, 4000);
  };

  const handleReset = () => {
    setStep(0); setRiasecScores(null);
    setAcademicData(null); setPredictions(null); setAnalyzing(false);
  };

  const chatContext = predictions?.[0] ? `${predictions[0].name_uz} (${predictions[0].score}% moslik)` : null;


  // Parolni tiklash — URL'da ?reset_token=xxx bo'lsa
  if (resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={(user) => {
          // URL'dan reset_token ni olib tashlaymiz
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            window.history.replaceState({}, '', window.location.pathname);
          }
          setResetToken(null);
          if (user) setAuthUser(user);
        }}
      />
    );
  }

  // Token tekshiruvi hali tugamagan
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 rounded-full border-[3px] border-[#E5E7EB] border-t-[#2563EB] animate-spin" />
      </div>
    );
  }

  const bannerProps = {
    user: authUser,
    onLogout: handleLogout,
    onProfile: handleOpenProfile,
    onSettings: handleOpenSettings,
    onTestStart: handleTestStart,
    onHistory: handleOpenHistory,
    onMyGoal: handleOpenMyGoal,
    onCareerProfile: handleOpenCareerProfile,
    onAvatarUpdate: handleAvatarUpdate,
    currentRoute: route,
  };

  // Kirmagan foydalanuvchi → Auth sahifasi
  if (!authUser) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // Sozlamalar sahifasi
  if (showSettings) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <SettingsPage
          view={settingsView}
          onBack={handleCloseSettings}
          onOpenPassword={() => navigate('/settings/password')}
          onClosePassword={() => navigate('/settings')}
        />
        <ChatBot careerContext={null} />
      </>
    );
  }

  // Test intro sahifasi
  if (showTestIntro) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <TestIntroPage
          onStart={handleTestContinue}
          onBack={() => navigate('/')}
        />
        <ChatBot careerContext={null} />
      </>
    );
  }

  // Tarix sahifasi
  if (showHistory) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <HistoryPage onBack={() => navigate('/')} />
        <ChatBot careerContext={null} />
      </>
    );
  }

  // Maqsadim sahifasi
  if (showMyGoal) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <MyGoalPage
          onBack={() => navigate('/')}
          onTakeTest={handleTestStart}
        />
        <ChatBot careerContext={null} />
      </>
    );
  }

  // Karyera profili sahifasi
  if (showCareerProfile) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <CareerProfilePage
          onBack={() => navigate('/')}
          onMyGoal={handleOpenMyGoal}
        />
        <ChatBot careerContext={null} />
      </>
    );
  }

  // Profil sahifasi
  if (showProfile) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <div className="min-h-screen bg-white">
          <ProfilePage
            onBack={handleCloseProfile}
            authUser={authUser}
            onLogout={handleLogout}
          />
          <ChatBot careerContext={null} />
        </div>
      </>
    );
  }

  // RIASEC test sahifasi
  if (step === 1) {
    return (
      <div className="min-h-screen bg-white">
        <LiveBanner {...bannerProps} />
        <RiasecTest onComplete={handleRiasecComplete} onBack={() => setStep(0)} />
      </div>
    );
  }

  // Ma'lumotlar sahifasi
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white">
        <LiveBanner {...bannerProps} />
        <AcademicSkills onComplete={handleAcademicComplete} onBack={() => setStep(1)} />
      </div>
    );
  }

  // Natijalar sahifasi
  if (step === 3) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <div className="min-h-screen bg-white">
          {analyzing && (
            <AnalyzingScreen
              riasecScores={riasecScores}
              userSkills={academicData?.skills || []}
            />
          )}
          {!analyzing && predictions && (
            <Dashboard
              predictions={predictions}
              riasecScores={riasecScores}
              userSkills={academicData.skills}
              academicData={academicData}
              authUser={authUser}
              onReset={handleReset}
              onBack={() => setStep(2)}
              onMyGoal={handleOpenMyGoal}
            />
          )}
        </div>
      </>
    );
  }

  // Kirgan foydalanuvchi → Bosh sahifa
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LiveBanner {...bannerProps} />
      <VerifyEmailBanner user={authUser} />
      {step === 0 && <WelcomePage onStart={() => setStep(1)} />}

      <ChatBot careerContext={chatContext} />
    </div>
  );
}
