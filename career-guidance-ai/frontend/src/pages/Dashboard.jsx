import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  BarChart3, Target, BookOpen, Briefcase, Sparkles, CheckCircle,
  TrendingUp, ExternalLink, Clock, RotateCcw, Upload, GitCompare,
  DollarSign, Flame, Share2, Download, MapPin, Building2, RefreshCw,
} from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import { jobsAPI } from '../services/api';
import styles from './Dashboard.module.css';

const CATEGORY_NAMES = { R:'Realistik',I:'Tadqiqotchi',A:'Ijodkor',S:'Ijtimoiy',E:'Tadbirkor',C:'Konvensional' };
const PIE_COLORS = ['#00D4AA','#635BFF','#FF6B35'];
const BAR_COLORS = ['#00D4AA','#635BFF','#FF6B35'];

const DEMAND_COLOR = {
  'Juda yuqori':'#EF4444','Juta yuqori':'#EF4444',
  'Yuqori':'#F59E0B','O\'rta':'#10B981','O\'sib bormoqda':'#635BFF',
};
const DEMAND_BG = {
  'Juda yuqori':'rgba(239,68,68,0.1)','Juta yuqori':'rgba(239,68,68,0.1)',
  'Yuqori':'rgba(245,158,11,0.1)','O\'rta':'rgba(16,185,129,0.1)','O\'sib bormoqda':'rgba(99,91,255,0.1)',
};

function DemandBadge({ demand }) {
  const color = DEMAND_COLOR[demand] || '#94A3B8';
  const bg = DEMAND_BG[demand] || 'rgba(148,163,184,0.1)';
  return (
    <span style={{
      padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,
      color, background:bg, border:`1px solid ${color}33`,
    }}>
      <Flame size={10} style={{display:'inline',marginRight:3}} />
      {demand}
    </span>
  );
}

function analyzeSkillsGap(userSkills, occupation) {
  const required = occupation.required_skills || occupation.requiredSkills || [];
  const matched = required.filter(s=>userSkills.includes(s));
  const missing = required.filter(s=>!userSkills.includes(s));
  const matchPercent = required.length ? Math.round(matched.length/required.length*100) : 0;
  return { matched, missing, matchPercent };
}

// Haftalik o'quv rejasi generatsiyasi
function generateWeeklyPlan(career) {
  const roadmap = career.roadmap || [];
  const weeks = [];
  roadmap.forEach((phase, phaseIdx) => {
    const weekCount = 8; // har faza 8 hafta (~2 oy)
    for (let w = 0; w < weekCount; w++) {
      const globalWeek = phaseIdx * weekCount + w + 1;
      const resource = phase.resources[w % phase.resources.length];
      weeks.push({
        week: globalWeek,
        phase: phaseIdx + 1,
        phaseName: phase.title,
        focus: w < 3 ? 'Nazariy' : w < 6 ? 'Amaliy' : 'Loyiha',
        task: w < 3
          ? `${phase.title} — nazariy qism. Resurs: ${resource}`
          : w < 6
          ? `${phase.title} — amaliy mashqlar va misollar`
          : `${phase.title} — kichik loyiha va portfolio`,
        color: ['#00D4AA','#635BFF','#FF6B35'][phaseIdx % 3],
      });
    }
  });
  return weeks.slice(0, 24); // 24 hafta = 6 oy
}

// ============================================================
// Vakansiya kartasi komponenti
// ============================================================
function JobCard({ job }) {
  return (
    <a
      href={job.link}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.jobCard}
    >
      <div className={styles.jobHeader}>
        <div className={styles.jobTitleWrap}>
          <h4 className={styles.jobTitle}>{job.title}</h4>
          <div className={styles.jobCompany}>
            <Building2 size={12} />
            <span>{job.company}</span>
          </div>
        </div>
        <ExternalLink size={15} className={styles.jobExtIcon} />
      </div>

      <div className={styles.jobMeta}>
        {job.salary && job.salary !== 'Kelishiladi' ? (
          <span className={styles.jobSalary}>
            <DollarSign size={13} /> {job.salary}
          </span>
        ) : (
          <span className={styles.jobSalaryNull}>Maosh kelishiladi</span>
        )}
        <span className={styles.jobLocation}>
          <MapPin size={12} /> {job.location}
        </span>
      </div>

      {job.experience && (
        <div className={styles.jobExp}>{job.experience}</div>
      )}

      {job.description && (
        <p className={styles.jobDesc}>{job.description.slice(0, 150)}{job.description.length > 150 ? '...' : ''}</p>
      )}

      <div className={styles.jobFooter}>
        {job.employment_type && (
          <span className={styles.jobBadge}>{job.employment_type}</span>
        )}
        <span className={styles.jobSource}>hh.uz</span>
      </div>
    </a>
  );
}

// ============================================================
// Vakansiyalar tab komponenti
// ============================================================
function JobsTab({ occupationId, careerName }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const loadJobs = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobsAPI.getJobs(occupationId, force);
      setJobs(res.data.jobs || []);
      setLastFetch(new Date());
    } catch (e) {
      setError('Vakansiyalarni yuklashda xatolik. Internet aloqasini tekshiring.');
    } finally {
      setLoading(false);
    }
  }, [occupationId]);

  useEffect(() => {
    loadJobs(false);
  }, [loadJobs]);

  return (
    <div>
      {/* Header */}
      <div className={`${styles.card} animate-in`} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h4 className={styles.cardTitle}>
              <Briefcase size={18} color="var(--accent-alt)" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Siz uchun mos vakansiyalar
            </h4>
            <p className={styles.cardMeta}>
              {careerName} bo'yicha HH.uz dan real vakansiyalar
              {lastFetch && (
                <span style={{ marginLeft: 8, opacity: 0.6 }}>
                  · {lastFetch.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} da yangilangan
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => loadJobs(true)}
            disabled={loading}
            className={styles.refreshBtn}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Yuklanmoqda...' : 'Yangilash'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`${styles.card} animate-in`} style={{ borderColor: '#EF4444', marginBottom: 16 }}>
          <p style={{ color: '#EF4444', fontSize: 14 }}>{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && jobs.length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={styles.jobSkeleton} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {/* Jobs grid */}
      {!loading && jobs.length === 0 && !error && (
        <div className={`${styles.card} animate-in`} style={{ textAlign: 'center', padding: 40 }}>
          <Briefcase size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Hozircha vakansiya topilmadi. "Yangilash" tugmasini bosing.
          </p>
        </div>
      )}

      {jobs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {jobs.map((job, i) => (
            <div key={job.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-in">
              <JobCard job={job} />
            </div>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Jami {jobs.length} ta vakansiya · Ma'lumot manbasi: hh.uz
        </p>
      )}
    </div>
  );
}

// ============================================================
// Asosiy Dashboard
// ============================================================
export default function Dashboard({ predictions, riasecScores, userSkills, onReset }) {
  const [selectedCareer, setSelectedCareer] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [compareMode, setCompareMode] = useState(false);
  const [compareIdx, setCompareIdx] = useState(1);
  const [weekFilter, setWeekFilter] = useState('all');

  const career = predictions[selectedCareer];
  const gap = analyzeSkillsGap(userSkills, career);
  const weeklyPlan = generateWeeklyPlan(career);

  const riasecData = Object.entries(riasecScores).map(([k,v])=>({
    category: CATEGORY_NAMES[k]||k, value:v, fullMark:10,
  }));

  const tabs = [
    { id:'overview', label:'Umumiy', icon:BarChart3 },
    { id:'skills', label:"Ko'nikmalar", icon:Target },
    { id:'weekly', label:'Haftalik reja', icon:Clock },
    { id:'compare', label:'Taqqoslash', icon:GitCompare },
    { id:'resume', label:'Rezume', icon:Upload },
    { id:'jobs', label:'Vakansiyalar', icon:Briefcase },
  ];

  const handleShare = () => {
    const text = `KasbYo'lAI natijalarim: #1 ${career.name_uz} (${career.score}% moslik) · ${career.avg_salary}/yil · ${career.growth} o'sish`;
    if (navigator.share) {
      navigator.share({ title: "KasbYo'lAI natijalarim", text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Natija nusxalandi!");
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.badge}><Sparkles size={14}/><span>ML BASHORAT NATIJALARI</span></div>
        <h2 className={styles.title}>Sizga mos kasblar</h2>
        <p className={styles.subtitle}>15 ta IT kasb orasidan Random Forest algoritmi tanladi</p>
        <button onClick={handleShare} className={styles.shareBtn}>
          <Share2 size={14}/> Natijani ulashish
        </button>
      </div>

      {/* Top 3 Cards */}
      <div className={styles.topCards}>
        {predictions.map((pred,i)=>(
          <div
            key={i}
            className={`${styles.topCard} ${selectedCareer===i?styles.topCardActive:''}`}
            onClick={()=>setSelectedCareer(i)}
            style={{animationDelay:`${i*0.1}s`}}
          >
            <div className={styles.topCardHeader}>
              <span className={styles.rank}>#{i+1}</span>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                <span className={styles.score}>{pred.score}%</span>
                {pred.demand && <DemandBadge demand={pred.demand}/>}
              </div>
            </div>
            <h3 className={styles.careerName}>{pred.name_uz||pred.nameUz}</h3>
            <p className={styles.careerMeta}>{pred.name} · {pred.avg_salary||pred.avgSalary}</p>
            {pred.growth && (
              <div style={{marginTop:8,display:'flex',alignItems:'center',gap:4}}>
                <TrendingUp size={12} color="#10B981"/>
                <span style={{fontSize:11,color:'#10B981',fontWeight:700}}>{pred.growth} yillik o'sish</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Salary comparison mini-bar */}
      <div className={styles.salaryBar}>
        {predictions.map((p,i)=>(
          <div key={i} className={styles.salaryItem}>
            <span className={styles.salaryLabel}>{p.name_uz}</span>
            <div className={styles.salaryTrack}>
              <div className={styles.salaryFill} style={{
                width:`${(parseInt(p.avg_salary?.replace(/\D/g,''))||80000)/1350}%`,
                background: BAR_COLORS[i],
                animationDelay:`${0.3+i*0.15}s`,
              }}/>
            </div>
            <span className={styles.salaryNum} style={{color:BAR_COLORS[i]}}>{p.avg_salary}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab=>(
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab===tab.id?styles.tabActive:''}`}
            onClick={()=>setActiveTab(tab.id)}
          >
            <tab.icon size={15}/>{tab.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW === */}
      {activeTab==='overview' && (
        <div className={styles.grid2}>
          <div className={`${styles.card} animate-in`}>
            <h4 className={styles.cardTitle}>RIASEC Profilingiz</h4>
            <p className={styles.cardMeta}>Holland Code psixometrik test natijalari</p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={riasecData}>
                <PolarGrid stroke="var(--border)"/>
                <PolarAngleAxis dataKey="category" tick={{fontSize:11,fill:'var(--text-muted)'}}/>
                <PolarRadiusAxis angle={30} domain={[0,10]} tick={false} axisLine={false}/>
                <Radar dataKey="value" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.2} strokeWidth={2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className={`${styles.card} animate-in animate-in-delay-1`}>
            <h4 className={styles.cardTitle}>Kasb ehtimolliklari</h4>
            <p className={styles.cardMeta}>RandomForest bashorat natijalari</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={predictions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fontFamily:'var(--font-mono)'}}/>
                <YAxis type="category" dataKey="name_uz" tick={{fontSize:11,fill:'var(--text)'}} width={140}/>
                <Tooltip formatter={v=>[`${v}%`,'Moslik']}/>
                <Bar dataKey="score" radius={[0,6,6,0]}>
                  {predictions.map((_,i)=><Cell key={i} fill={BAR_COLORS[i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`${styles.card} ${styles.fullWidth} animate-in animate-in-delay-2`}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
              <div>
                <h4 className={styles.cardTitle}>
                  <Briefcase size={18} color="var(--accent-alt)"/>
                  {career.name_uz||career.nameUz} haqida
                </h4>
                <p className={styles.cardDesc}>
                  {career.description_uz||career.description}
                </p>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10,minWidth:200}}>
                {[
                  {icon:DollarSign,label:"O'rtacha maosh",val:career.avg_salary,color:'#10B981'},
                  {icon:TrendingUp,label:'Yillik o\'sish',val:career.growth||'N/A',color:'#635BFF'},
                  {icon:Flame,label:'Bozor talabi',val:career.demand||'O\'rta',color:DEMAND_COLOR[career.demand]||'#94A3B8'},
                  {icon:Target,label:'Moslik darajasi',val:`${career.score}%`,color:'#00D4AA'},
                ].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)'}}>
                    <div style={{width:32,height:32,borderRadius:8,background:`${item.color}20`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <item.icon size={16} color={item.color}/>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{item.label}</div>
                      <div style={{fontSize:14,fontWeight:700,color:item.color,fontFamily:'var(--font-mono)'}}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === SKILLS === */}
      {activeTab==='skills' && (
        <div className={styles.grid2}>
          <div className={`${styles.card} animate-in`}>
            <h4 className={styles.cardTitle}>Ko'nikmalar moslik tahlili</h4>
            <p className={styles.cardMeta}>{career.name_uz} uchun Skills Gap Analysis</p>
            <div style={{display:'flex',justifyContent:'center',margin:'16px 0'}}>
              <div style={{position:'relative',width:180,height:180}}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={[
                      {name:'Mavjud',value:gap.matched.length||0.01},
                      {name:'Yetishmaydi',value:gap.missing.length||0.01},
                    ]} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      <Cell fill="#00D4AA"/>
                      <Cell fill="var(--border)"/>
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}>
                  <div style={{fontSize:26,fontWeight:800,color:'var(--accent)',fontFamily:'var(--font-mono)'}}>{gap.matchPercent}%</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>moslik</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.card} animate-in animate-in-delay-1`}>
            <h4 className={styles.cardTitle}>Batafsil tahlil</h4>
            <div style={{marginBottom:16}}>
              <div className={styles.skillLabel} style={{color:'var(--accent)',display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <CheckCircle size={14}/> Mavjud ko'nikmalar ({gap.matched.length})
              </div>
              <div className={styles.chipGroup}>
                {gap.matched.length>0 ? gap.matched.map(s=>(
                  <span key={s} className={styles.chipGreen}>{s}</span>
                )) : <span className={styles.cardMeta}>Hali yo'q</span>}
              </div>
            </div>
            <div>
              <div className={styles.skillLabel} style={{color:'var(--accent-warm)',display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <TrendingUp size={14}/> Yetishmayotgan ko'nikmalar ({gap.missing.length})
              </div>
              <div className={styles.chipGroup}>
                {gap.missing.map(s=>(
                  <span key={s} className={styles.chipOrange}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.fullWidth} animate-in animate-in-delay-2`}>
            <h4 className={styles.cardTitle}>Talab qilinadigan barcha ko'nikmalar</h4>
            {(career.required_skills||career.requiredSkills||[]).map((skill,i)=>{
              const has = userSkills.includes(skill);
              return (
                <div key={i} style={{marginBottom:12}}>
                  <div className={styles.skillRow}>
                    <span className={styles.skillName}>{skill}</span>
                    <span style={{color:has?'var(--accent)':'var(--accent-warm)',fontFamily:'var(--font-mono)',fontSize:11,fontWeight:700}}>
                      {has?'Mavjud ✓':'O\'rganing →'}
                    </span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressBar} style={{
                      width:has?'100%':'18%',
                      background:has?'var(--accent)':'rgba(255,107,53,0.35)',
                      animationDelay:`${i*0.1}s`,
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === HAFTALIK REJA === */}
      {activeTab==='weekly' && (
        <div>
          <div className={`${styles.card} animate-in`} style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
              <div>
                <h4 className={styles.cardTitle}>24 haftalik batafsil o'quv rejasi</h4>
                <p className={styles.cardMeta}>{career.name_uz} — hafta-hafta yo'l xaritasi</p>
              </div>
              <div style={{display:'flex',gap:8}}>
                {['all','1','2','3'].map(f=>(
                  <button key={f}
                    onClick={()=>setWeekFilter(f)}
                    style={{
                      padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
                      border:'1px solid',
                      borderColor:weekFilter===f?'var(--accent)':'var(--border)',
                      background:weekFilter===f?'var(--accent)':'var(--card)',
                      color:weekFilter===f?'white':'var(--text-muted)',
                      transition:'all 0.2s',
                    }}
                  >
                    {f==='all'?'Barchasi':`${f}-faza`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {weeklyPlan
              .filter(w=>weekFilter==='all'||String(w.phase)===weekFilter)
              .map((w,i)=>(
                <div key={i} className={`${styles.card} animate-in`}
                  style={{animationDelay:`${i*0.03}s`,borderLeft:`3px solid ${w.color}`}}
                >
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{
                      fontSize:11,fontWeight:700,fontFamily:'var(--font-mono)',
                      color:w.color,
                    }}>
                      {w.week}-HAFTA
                    </span>
                    <span style={{
                      fontSize:10,padding:'2px 8px',borderRadius:6,
                      background:`${w.color}20`,color:w.color,fontWeight:600,
                    }}>
                      {w.focus}
                    </span>
                  </div>
                  <p style={{fontSize:12,color:'var(--text)',lineHeight:1.5}}>{w.task}</p>
                  <div style={{marginTop:8,display:'flex',alignItems:'center',gap:4}}>
                    <div style={{flex:1,height:3,background:'var(--border)',borderRadius:2}}>
                      <div style={{
                        width:`${(w.week/24)*100}%`,height:'100%',
                        background:w.color,borderRadius:2,
                        transition:'width 0.5s ease',
                      }}/>
                    </div>
                    <span style={{fontSize:10,color:'var(--text-muted)'}}>{Math.round((w.week/24)*100)}%</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* === TAQQOSLASH === */}
      {activeTab==='compare' && (
        <div>
          <div className={`${styles.card} animate-in`} style={{marginBottom:20}}>
            <h4 className={styles.cardTitle}>Kasblarni taqqoslash</h4>
            <p className={styles.cardMeta}>Ikkita kasbni yonma-yon solishtiring</p>
            <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:180}}>
                <label style={{fontSize:12,color:'var(--text-muted)',display:'block',marginBottom:6}}>1-kasb</label>
                <select
                  value={selectedCareer}
                  onChange={e=>setSelectedCareer(+e.target.value)}
                  style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:13}}
                >
                  {predictions.map((p,i)=><option key={i} value={i}>{p.name_uz}</option>)}
                </select>
              </div>
              <div style={{flex:1,minWidth:180}}>
                <label style={{fontSize:12,color:'var(--text-muted)',display:'block',marginBottom:6}}>2-kasb</label>
                <select
                  value={compareIdx}
                  onChange={e=>setCompareIdx(+e.target.value)}
                  style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:13}}
                >
                  {predictions.map((p,i)=><option key={i} value={i}>{p.name_uz}</option>)}
                </select>
              </div>
            </div>
          </div>

          {[
            {label:'Moslik darajasi',key:'score',suffix:'%',type:'number'},
            {label:"O'rtacha maosh",key:'avg_salary',suffix:'',type:'string'},
            {label:'Yillik o\'sish',key:'growth',suffix:'',type:'string'},
            {label:'Bozor talabi',key:'demand',suffix:'',type:'string'},
          ].map((row,i)=>{
            const a = predictions[selectedCareer];
            const b = predictions[compareIdx];
            const aVal = a[row.key]; const bVal = b[row.key];
            const aNum = row.type==='number'?aVal:parseInt(String(aVal).replace(/\D/g,''))||0;
            const bNum = row.type==='number'?bVal:parseInt(String(bVal).replace(/\D/g,''))||0;
            const max = Math.max(aNum,bNum)||100;
            return (
              <div key={i} className={`${styles.card} animate-in`}
                style={{marginBottom:12,animationDelay:`${i*0.1}s`}}
              >
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <span style={{fontSize:13,color:'var(--text-muted)'}}>{row.label}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {[[a,aVal,aNum,'#00D4AA'],[b,bVal,bNum,'#635BFF']].map(([occ,val,num,color],j)=>(
                    <div key={j}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                        <span style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{occ.name_uz}</span>
                        <span style={{fontSize:12,fontWeight:700,color,fontFamily:'var(--font-mono)'}}>{val}{row.suffix}</span>
                      </div>
                      <div style={{height:6,background:'var(--border)',borderRadius:3}}>
                        <div style={{
                          width:row.type==='number'?`${(num/max)*100}%`:`${Math.min((num/max)*100,100)}%`,
                          height:'100%',background:color,borderRadius:3,
                          transition:'width 0.8s ease',
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Skills comparison */}
          <div className={`${styles.card} animate-in`}>
            <h4 className={styles.cardTitle}>Ko'nikmalar taqqoslash</h4>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:12}}>
              {[predictions[selectedCareer],predictions[compareIdx]].map((occ,j)=>{
                const g = analyzeSkillsGap(userSkills,occ);
                return (
                  <div key={j}>
                    <div style={{fontSize:13,fontWeight:700,color:BAR_COLORS[j],marginBottom:10}}>
                      {occ.name_uz} — {g.matchPercent}%
                    </div>
                    {(occ.required_skills||[]).map(s=>{
                      const has=userSkills.includes(s);
                      return (
                        <div key={s} style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:has?'#10B981':'var(--border)',flexShrink:0}}/>
                          <span style={{fontSize:12,color:has?'var(--text)':'var(--text-muted)'}}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* === RESUME === */}
      {activeTab==='resume' && <ResumeUpload selectedCareer={career}/>}

      {/* === VAKANSIYALAR === */}
      {activeTab==='jobs' && (
        <JobsTab
          occupationId={career.id ?? selectedCareer}
          careerName={career.name_uz || career.nameUz}
        />
      )}

      {/* Reset */}
      <div className={styles.resetWrap}>
        <button className={styles.resetBtn} onClick={onReset}>
          <RotateCcw size={16}/> Qaytadan boshlash
        </button>
      </div>
    </div>
  );
}
