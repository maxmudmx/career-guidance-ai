import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import WelcomePage from './pages/WelcomePage';
import RiasecTest from './pages/RiasecTest';
import AcademicSkills from './pages/AcademicSkills';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import { Brain, CheckCircle, User, UserCircle, Settings, LogOut, Sun, Moon, Camera, Users } from 'lucide-react';
import { authAPI, tokenStorage } from './services/api';
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
// Live Activity Banner  (profil dropdown + avatar upload shu yerda)
// ============================================================
function LiveBanner({ user, onLogout, onProfile, onAvatarUpdate, darkMode, onToggleDark }) {
  const [activeUsers, setActiveUsers] = useState(null);
  const [fading, setFading]           = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const menuRef   = useRef(null);
  const fileInput = useRef(null);

  /* ── Live users fetch ── */
  const fetchUsers = () => {
    fetch('/api/stats/live-users')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setFading(true);
        setTimeout(() => { setActiveUsers(data.active_users); setFading(false); }, 300);
      })
      .catch(() => {});
  };
  useEffect(() => {
    fetchUsers();
    const id = setInterval(fetchUsers, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ── Outside-click ── */
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  /* ── Avatar upload handler ── */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file re-selectable
    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('kasbyol_token');
      const res = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Yuklash xatosi');
      }
      const data = await res.json();
      onAvatarUpdate(data.avatar_url);
    } catch (err) {
      setUploadError(err.message || 'Xatolik');
      setTimeout(() => setUploadError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const count = activeUsers ?? 0;

  /* ── Shared dropdown item style ── */
  const ddItem = {
    display:'flex', alignItems:'center', gap:10,
    width:'100%', padding:'10px 14px',
    background:'none', border:'none',
    fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.85)',
    cursor:'pointer', textAlign:'left', fontFamily:'inherit',
    transition:'background 0.15s',
  };

  /* ── Avatar image src — uses /static proxy (no hardcoded host) ── */
  const avatarSrc = user?.avatar_url || null;

  /* AVATAR_SIZE — banner ham shunga moslashadi */
  const AVT = 44;
  const BANNER_H = AVT + 10; // 54px

  return (
    <div style={{
      background: 'linear-gradient(90deg,#0D0720 0%,#160A38 50%,#0D0720 100%)',
      borderBottom: '1px solid rgba(99,91,255,0.18)',
      height: BANNER_H,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      position: 'sticky', top: 0, zIndex: 300,
      flexShrink: 0,
    }}>

      {/* Shimmer overlay */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'linear-gradient(90deg,transparent 0%,rgba(99,91,255,0.06) 50%,transparent 100%)',
        backgroundSize:'200% 100%',
        animation:'shimmer 4s ease-in-out infinite',
      }} />

      {/* ── LEFT: Live indicator — ixcham, minimalist ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        position:'relative', flexShrink:0,
      }}>
        {/* Users icon */}
        <Users size={15} color="rgba(255,255,255,0.45)" strokeWidth={1.8} />

        {/* Count */}
        <span style={{
          fontFamily:'var(--font-mono)',
          fontSize:14, fontWeight:700,
          color:'rgba(255,255,255,0.88)',
          opacity: fading ? 0 : 1,
          transition:'opacity 0.3s ease',
          minWidth:24, textAlign:'right',
        }}>
          {count}
        </span>

        {/* Pulsing dot */}
        <span style={{
          width:8, height:8, borderRadius:'50%', flexShrink:0,
          background: count > 0 ? '#00D4AA' : '#EF4444',
          boxShadow: count > 0
            ? '0 0 8px rgba(0,212,170,0.8)'
            : '0 0 8px rgba(239,68,68,0.7)',
          animation:'livePulse 1.4s ease-in-out infinite',
        }} />
      </div>

      {/* ── RIGHT: Avatar + Dropdown ── */}
      <div ref={menuRef} style={{
        position:'relative', flexShrink:0,
        display:'flex', alignItems:'center',
      }}>

        {/* Hidden file input */}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display:'none' }}
          onChange={handleFileChange}
        />

        {user ? (
          <>
            {/* ── Big avatar button ── */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              title={user.full_name || user.username}
              style={{
                width:AVT, height:AVT, borderRadius:'50%', padding:0,
                background:'linear-gradient(135deg,#00D4AA,#635BFF)',
                border: menuOpen
                  ? '2.5px solid rgba(0,212,170,0.9)'
                  : '2.5px solid rgba(0,212,170,0.45)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                overflow:'hidden', flexShrink:0, position:'relative',
                boxShadow: menuOpen
                  ? '0 0 0 4px rgba(0,212,170,0.15), 0 0 24px rgba(0,212,170,0.6), 0 0 48px rgba(99,91,255,0.25)'
                  : '0 0 0 3px rgba(0,212,170,0.1), 0 0 16px rgba(0,212,170,0.35)',
                transition:'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                transform: menuOpen ? 'scale(1.06)' : 'scale(1)',
              }}
            >
              {uploading ? (
                <div style={{
                  width:18, height:18, borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.3)',
                  borderTopColor:'white',
                  animation:'spin 0.7s linear infinite',
                }} />
              ) : avatarSrc ? (
                <img src={avatarSrc} alt=""
                  style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
              ) : (
                <User size={20} color="white" />
              )}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div role="menu" style={{
                position:'absolute', top:'calc(100% + 8px)', right:0,
                width:240, zIndex:1000,
                background:'rgba(14,9,35,0.97)',
                backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
                border:'1px solid rgba(99,91,255,0.25)',
                borderRadius:18,
                boxShadow:'0 12px 48px rgba(0,0,0,0.65),0 0 0 1px rgba(99,91,255,0.1)',
                overflow:'hidden',
                animation:'fadeInUp 0.16s ease both',
              }}>

                {/* Header: Avatar + user info */}
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'13px 14px 10px'}}>
                  {/* Clickable avatar (upload trigger) */}
                  <div
                    onClick={() => !uploading && fileInput.current?.click()}
                    title="Rasm yuklash"
                    style={{
                      width:40, height:40, borderRadius:'50%', flexShrink:0,
                      overflow:'hidden', position:'relative', cursor:'pointer',
                      background:'linear-gradient(135deg,#00D4AA,#635BFF)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 0 14px rgba(0,212,170,0.4)',
                      border:'2px solid rgba(0,212,170,0.3)',
                      transition:'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(0,212,170,0.8)';
                      e.currentTarget.querySelector('.cam-overlay').style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(0,212,170,0.3)';
                      e.currentTarget.querySelector('.cam-overlay').style.opacity = '0';
                    }}
                  >
                    {uploading ? (
                      <div style={{
                        width:18, height:18, borderRadius:'50%',
                        border:'2px solid rgba(255,255,255,0.3)',
                        borderTopColor:'#00D4AA',
                        animation:'spin 0.7s linear infinite',
                      }} />
                    ) : avatarSrc ? (
                      <img src={avatarSrc} alt=""
                        style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    ) : (
                      <User size={18} color="white" />
                    )}
                    {/* Camera overlay on hover */}
                    <div className="cam-overlay" style={{
                      position:'absolute', inset:0, borderRadius:'50%',
                      background:'rgba(0,0,0,0.55)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      opacity:0, transition:'opacity 0.18s ease',
                    }}>
                      <Camera size={14} color="white" />
                    </div>
                  </div>

                  <div style={{overflow:'hidden', flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.95)',
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {user.full_name || user.username}
                    </div>
                    {user.email && (
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:1,
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {user.email}
                      </div>
                    )}
                    {/* Upload error inline */}
                    {uploadError && (
                      <div style={{fontSize:10,color:'#F87171',marginTop:2}}>{uploadError}</div>
                    )}
                  </div>
                </div>

                {/* "Rasm yuklash" quick-action row */}
                <button
                  type="button"
                  onClick={() => { fileInput.current?.click(); }}
                  disabled={uploading}
                  style={{
                    ...ddItem,
                    color: uploading ? 'rgba(255,255,255,0.35)' : 'rgba(0,212,170,0.9)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => !uploading && (e.currentTarget.style.background='rgba(0,212,170,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background='none')}
                >
                  {uploading ? (
                    <div style={{
                      width:15,height:15,borderRadius:'50%',
                      border:'2px solid rgba(0,212,170,0.3)',
                      borderTopColor:'#00D4AA',
                      animation:'spin 0.7s linear infinite',
                      flexShrink:0,
                    }} />
                  ) : (
                    <Camera size={15} color="#00D4AA" />
                  )}
                  {uploading ? 'Yuklanmoqda...' : 'Rasm yuklash'}
                </button>

                <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'2px 0'}} />

                {/* Theme toggle */}
                <button role="menuitem"
                  onClick={(e) => { e.stopPropagation(); onToggleDark(); }}
                  style={ddItem}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(99,91,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <span style={{width:20,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {darkMode ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#818CF8" />}
                  </span>
                  <span style={{flex:1}}>Mavzu: <strong>{darkMode ? "Yorug'" : "Qorong'u"}</strong></span>
                  <span style={{
                    display:'inline-flex',alignItems:'center',
                    width:34,height:18,borderRadius:9,padding:2,flexShrink:0,
                    background: darkMode ? 'rgba(245,158,11,0.18)' : 'rgba(99,91,255,0.18)',
                    border: darkMode ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(99,91,255,0.28)',
                    transition:'background 0.25s',
                  }}>
                    <span style={{
                      width:12,height:12,borderRadius:'50%',
                      background: darkMode ? '#F59E0B' : '#635BFF',
                      transform: darkMode ? 'translateX(16px)' : 'none',
                      transition:'transform 0.25s,background 0.25s',
                    }} />
                  </span>
                </button>

                <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'2px 0'}} />

                {/* Mening profilim */}
                <button role="menuitem"
                  onClick={() => { onProfile(); setMenuOpen(false); }}
                  style={ddItem}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,170,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <UserCircle size={15} color="#00D4AA" /> Mening profilim
                </button>

                {/* Sozlamalar */}
                <button role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  style={ddItem}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,170,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <Settings size={15} color="rgba(255,255,255,0.5)" /> Sozlamalar
                </button>

                <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'2px 0'}} />

                {/* Chiqish */}
                <button role="menuitem"
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  style={{...ddItem, color:'#F87171'}}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <LogOut size={15} color="#F87171" /> Chiqish
                </button>

              </div>
            )}
          </>
        ) : (
          <div style={{width:26}} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Tahlil ekrani
// ============================================================
function AnalyzingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    'RIASEC profilini tahlil qilmoqda...',
    'Random Forest modelni ishga tushirmoqda...',
    "Ko'nikmalar mosligini hisoblamoqda...",
    "15 ta kasb orasidan tanlayapti...",
    "Yo'l xaritasini tuzmoqda...",
  ];
  useEffect(() => {
    const t = setInterval(() => setStep(s=>s<steps.length-1?s+1:s), 700);
    return ()=>clearInterval(t);
  }, []);
  return (
    <div style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{
        background:'var(--card)',borderRadius:16,padding:48,maxWidth:460,width:'100%',
        textAlign:'center',border:'1px solid var(--border)',boxShadow:'var(--shadow-md)',
        animation:'fadeInUp 0.4s ease both',margin:'0 16px',
      }}>
        <div style={{
          width:64,height:64,borderRadius:'50%',margin:'0 auto 24px',
          background:'linear-gradient(135deg, #00D4AA, #635BFF)',
          display:'flex',alignItems:'center',justifyContent:'center',
          animation:'pulse 1.5s ease-in-out infinite',
        }}>
          <Brain size={32} color="white" />
        </div>
        <h3 style={{fontSize:22,fontWeight:700,color:'var(--primary)',marginBottom:8}}>
          AI tahlil qilmoqda
        </h3>
        <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:24}}>
          15 ta kasb orasidan sizga mos tanlanmoqda
        </p>
        {steps.map((s,i)=>(
          <div key={i} style={{
            display:'flex',alignItems:'center',gap:10,padding:'7px 0',
            opacity:i<=step?1:0.25,transition:'opacity 0.4s ease',
          }}>
            {i<step ? (
              <CheckCircle size={18} color="var(--accent)" />
            ) : i===step ? (
              <div style={{width:18,height:18,borderRadius:'50%',border:'2px solid var(--accent)',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />
            ) : (
              <div style={{width:18,height:18,borderRadius:'50%',border:'2px solid var(--border)'}} />
            )}
            <span style={{fontSize:13,fontWeight:i===step?600:400,color:i<=step?'var(--primary)':'var(--text-muted)'}}>
              {s}
            </span>
          </div>
        ))}
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
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );

  // ---- Auth holati ----
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleAuth = (user) => {
    setAuthUser(user);
  };

  const handleLogout = () => {
    tokenStorage.clear();
    setAuthUser(null);
    setShowProfile(false);
    setStep(0);
    setRiasecScores(null);
    setAcademicData(null);
    setPredictions(null);
    setAnalyzing(false);
  };

  const handleOpenProfile = () => setShowProfile(true);
  const handleCloseProfile = () => setShowProfile(false);
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
          riasec_scores: riasecScores, skills: data.skills,
          academic_data: { gpa:data.gpa, analytical:data.analyticalThinking, communication:data.communication },
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setTimeout(()=>{ setPredictions(result.predictions); setAnalyzing(false); }, 3500);
        return;
      }
    } catch {}
    setTimeout(()=>{ setPredictions(localPredict(riasecScores,data.skills,data)); setAnalyzing(false); }, 4000);
  };

  const handleReset = () => {
    setStep(0); setRiasecScores(null);
    setAcademicData(null); setPredictions(null); setAnalyzing(false);
  };

  const chatContext = predictions?.[0] ? `${predictions[0].name_uz} (${predictions[0].score}% moslik)` : null;

  // Token tekshiruvi hali tugamagan
  if (!authChecked) {
    return (
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'var(--bg)',
      }}>
        <div style={{
          width:48, height:48, borderRadius:'50%',
          border:'3px solid var(--border)', borderTopColor:'var(--accent)',
          animation:'spin 0.8s linear infinite',
        }}/>
      </div>
    );
  }

  /* ── Shared banner props ── */
  const bannerProps = {
    user: authUser,
    onLogout: handleLogout,
    onProfile: handleOpenProfile,
    onAvatarUpdate: handleAvatarUpdate,
    darkMode,
    onToggleDark: () => setDarkMode(d => !d),
  };

  // Kirmagan foydalanuvchi → Auth sahifasi
  if (!authUser) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <AuthPage
          onAuth={handleAuth}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
        />
      </>
    );
  }

  // Profil sahifasi
  if (showProfile) {
    return (
      <>
        <LiveBanner {...bannerProps} />
        <div style={{ minHeight:'100vh', background:'var(--bg)', transition:'background 0.3s' }}>
          <ProfilePage onBack={handleCloseProfile} authUser={authUser} />
          <ChatBot careerContext={null} />
        </div>
      </>
    );
  }

  // Kirgan foydalanuvchi → Asosiy app
  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'var(--bg)',transition:'background 0.3s'}}>
      <LiveBanner {...bannerProps} />
      {step > 0 && (
        <Navbar currentStep={step} />
      )}
      {step === 0 && (
        <WelcomePage onStart={() => setStep(1)} />
      )}
      {step === 1 && <RiasecTest onComplete={handleRiasecComplete} />}
      {step === 2 && <AcademicSkills onComplete={handleAcademicComplete} />}
      {step === 3 && analyzing && <AnalyzingScreen />}
      {step === 3 && !analyzing && predictions && (
        <Dashboard
          predictions={predictions}
          riasecScores={riasecScores}
          userSkills={academicData.skills}
          onReset={handleReset}
        />
      )}

      {/* AI Chatbot — always visible */}
      <ChatBot careerContext={chatContext} />
    </div>
  );
}
