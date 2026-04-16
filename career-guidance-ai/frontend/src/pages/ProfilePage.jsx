import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import {
  User, Mail, Calendar, Target, TrendingUp, CheckCircle, XCircle,
  Upload, Camera, ArrowLeft, Briefcase, BarChart3, Settings,
  Clock, Zap, Award, Edit3, Save, X, ChevronRight,
} from 'lucide-react';
import { authAPI, tokenStorage } from '../services/api';
import api from '../services/api';
import styles from './ProfilePage.module.css';

// ── API ────────────────────────────────────────────────────
const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/users/upload-avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getHistory: () => api.get('/users/history'),
  getOccupations: () => api.get('/users/occupations'),
};

// ── Yordamchi komponentlar ─────────────────────────────────
const CAT = { R:'Realistik', I:'Tadqiqotchi', A:'Ijodkor', S:'Ijtimoiy', E:'Tadbirkor', C:'Konvensional' };
const CAT_COLOR = { R:'#00D4AA', I:'#635BFF', A:'#FF6B35', S:'#F59E0B', E:'#EF4444', C:'#10B981' };

function StatCard({ icon: Icon, label, value, color = 'var(--accent)' }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: `${color}18`, color }}>
        <Icon size={18} />
      </div>
      <div>
        <div className={styles.statValue} style={{ color }}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function SkillChip({ name, has }) {
  return (
    <span className={`${styles.chip} ${has ? styles.chipGreen : styles.chipRed}`}>
      {has ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {name}
    </span>
  );
}

// ── Animatsiyali progress bar ──────────────────────────────
function AnimatedProgress({ percent, label }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let frame;
    const step = () => {
      setCurrent(prev => {
        if (prev >= percent) return percent;
        frame = requestAnimationFrame(step);
        return Math.min(prev + 1.5, percent);
      });
    };
    const delay = setTimeout(() => { frame = requestAnimationFrame(step); }, 400);
    return () => { clearTimeout(delay); cancelAnimationFrame(frame); };
  }, [percent]);

  const color = percent >= 70 ? '#00D4AA' : percent >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className={styles.progressHero}>
      <div className={styles.progressRingWrap}>
        <svg width={180} height={180} viewBox="0 0 180 180">
          <circle cx={90} cy={90} r={76} fill="none" stroke="var(--border)" strokeWidth={10} />
          <circle
            cx={90} cy={90} r={76} fill="none"
            stroke={color} strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 76}`}
            strokeDashoffset={`${2 * Math.PI * 76 * (1 - current / 100)}`}
            transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className={styles.progressRingCenter}>
          <span className={styles.progressNum} style={{ color }}>{Math.round(current)}%</span>
          <span className={styles.progressSub}>tayyor</span>
        </div>
      </div>
      <div className={styles.progressText}>
        <div className={styles.progressTitle}>
          Siz <span style={{ color }}>{label}</span> bo'lishga
        </div>
        <div className={styles.progressSubtitle} style={{ color }}>
          {Math.round(current)}% tayyorsiz
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${current}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

// ── Avatar yüklash ─────────────────────────────────────────
function AvatarUpload({ avatarUrl, username, onUploaded }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(avatarUrl);

  useEffect(() => setPreview(avatarUrl), [avatarUrl]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await usersAPI.uploadAvatar(file);
      onUploaded(res.data.avatar_url);
    } catch (err) {
      alert(err.response?.data?.detail || 'Avatar yuklanmadi');
      setPreview(avatarUrl);
    } finally {
      setUploading(false);
    }
  };

  const initials = (username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className={styles.avatarWrap} onClick={() => inputRef.current.click()}>
      {preview ? (
        <img
          src={preview.startsWith('blob:') ? preview : `http://localhost:8000${preview}`}
          alt="avatar"
          className={styles.avatarImg}
        />
      ) : (
        <div className={styles.avatarPlaceholder}>{initials}</div>
      )}
      <div className={styles.avatarOverlay}>
        {uploading ? <div className={styles.miniSpinner} /> : <Camera size={18} color="white" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
    </div>
  );
}

// ── Tarix elementi ─────────────────────────────────────────
function HistoryItem({ item, index }) {
  const date = item.created_at ? new Date(item.created_at) : null;
  const dateStr = date ? date.toLocaleDateString('uz-UZ', { year:'numeric', month:'short', day:'numeric' }) : '—';
  const timeStr = date ? date.toLocaleTimeString('uz-UZ', { hour:'2-digit', minute:'2-digit' }) : '';
  const radarData = Object.entries(item.riasec_scores || {}).map(([k, v]) => ({
    category: CAT[k] || k, value: v, fullMark: 10,
  }));

  return (
    <div className={styles.histItem} style={{ animationDelay: `${index * 0.07}s` }}>
      <div className={styles.histDot} />
      <div className={styles.histCard}>
        <div className={styles.histHeader}>
          <div>
            <div className={styles.histDate}>{dateStr} · {timeStr}</div>
            {item.top_career && (
              <div className={styles.histCareer}>
                <Briefcase size={13} />
                {item.top_career.name_uz}
                <span className={styles.histScore}>{item.top_career.score}%</span>
              </div>
            )}
          </div>
          {item.dominant_type && (
            <span className={styles.histDominant}
              style={{ background: `${CAT_COLOR[item.dominant_type.code]}18`, color: CAT_COLOR[item.dominant_type.code] }}>
              {item.dominant_type.code} — {item.dominant_type.name}
            </span>
          )}
        </div>
        <div className={styles.histBody}>
          <div style={{ flex: '0 0 130px', height: 130 }}>
            <ResponsiveContainer width="100%" height={130}>
              <RadarChart data={radarData} outerRadius={45}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="#635BFF" fill="#635BFF" fillOpacity={0.2} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.histSkills}>
            <div className={styles.histSkillsLabel}>Ko'nikmalar ({item.skills_count})</div>
            <div className={styles.histSkillList}>
              {(item.user_skills || []).slice(0, 8).map(s => (
                <span key={s} className={styles.histChip}>{s}</span>
              ))}
              {item.skills_count > 8 && <span className={styles.histChipMore}>+{item.skills_count - 8}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sozlamalar tab ─────────────────────────────────────────
function SettingsTab({ profile, occupations, onSaved }) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [targetOcc, setTargetOcc] = useState(profile?.target_occupation_id ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (fullName.trim()) payload.full_name = fullName.trim();
      if (targetOcc !== '') payload.target_occupation_id = Number(targetOcc);
      await usersAPI.updateProfile(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (err) {
      alert(err.response?.data?.detail || 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.settingsWrap}>
      <div className={styles.settingsCard}>
        <h4 className={styles.settingsTitle}><Edit3 size={16} /> Shaxsiy ma'lumotlar</h4>

        <div className={styles.settingsField}>
          <label>To'liq ism</label>
          <input
            className={styles.settingsInput}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ism Familiya"
          />
        </div>

        <div className={styles.settingsField}>
          <label>Maqsad kasb <span style={{ color:'var(--text-muted)',fontWeight:400 }}>(progress foizi shu kasb uchun hisoblanadi)</span></label>
          <select
            className={styles.settingsSelect}
            value={targetOcc}
            onChange={e => setTargetOcc(e.target.value)}
          >
            <option value="">— Avtomatik (oxirgi bashorat) —</option>
            {occupations.map(o => (
              <option key={o.id} value={o.id}>{o.name_uz} · {o.avg_salary}</option>
            ))}
          </select>
        </div>

        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? <span className={styles.miniSpinner} /> : saved ? <><CheckCircle size={15} /> Saqlandi!</> : <><Save size={15} /> Saqlash</>}
        </button>
      </div>

      <div className={styles.settingsCard}>
        <h4 className={styles.settingsTitle}><User size={16} /> Hisob ma'lumotlari</h4>
        <div className={styles.infoRow}><Mail size={14}/><span>{profile?.email}</span></div>
        <div className={styles.infoRow}><User size={14}/><span>@{profile?.username}</span></div>
        <div className={styles.infoRow}>
          <Calendar size={14}/>
          <span>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('uz-UZ', { year:'numeric', month:'long', day:'numeric' })
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Asosiy ProfilePage ─────────────────────────────────────
export default function ProfilePage({ onBack, authUser }) {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, hRes, oRes] = await Promise.all([
        usersAPI.getProfile(),
        usersAPI.getHistory(),
        usersAPI.getOccupations(),
      ]);
      setProfile(pRes.data);
      setHistory(hRes.data.history || []);
      setOccupations(oRes.data.occupations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAvatarUploaded = (url) => {
    setProfile(p => ({ ...p, avatar_url: url }));
    // localStorage da user ni yangilash
    const u = tokenStorage.getUser();
    if (u) tokenStorage.setUser({ ...u, avatar_url: url });
  };

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadSpinner} />
      <p>Profil yuklanmoqda...</p>
    </div>
  );

  const progress = profile?.progress;
  const radarData = history[0]?.riasec_scores
    ? Object.entries(history[0].riasec_scores).map(([k, v]) => ({ category: CAT[k]||k, value: v, fullMark: 10 }))
    : [];

  const tabs = [
    { id: 'overview', label: 'Umumiy analitika', icon: BarChart3 },
    { id: 'history', label: 'Testlar tarixi', icon: Clock },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
  ];

  return (
    <div className={styles.page}>
      {/* ── Orqa fon ── */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} /> Orqaga
        </button>
        <div className={styles.headerBadge}><Zap size={13} /> SUPER PROFIL</div>
      </div>

      <div className={styles.container}>

        {/* ── Profil kartasi ── */}
        <div className={styles.profileCard}>
          <div className={styles.profileCardBg} />
          <div className={styles.profileMain}>
            <AvatarUpload
              avatarUrl={profile?.avatar_url}
              username={profile?.username}
              onUploaded={handleAvatarUploaded}
            />
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{profile?.full_name || profile?.username}</h2>
              <p className={styles.profileUsername}>@{profile?.username}</p>
              <div className={styles.profileMeta}>
                <span><Mail size={12}/> {profile?.email}</span>
                <span><Calendar size={12}/> {profile?.created_at ? new Date(profile.created_at).getFullYear() : ''} yildan</span>
              </div>
            </div>
            <div className={styles.profileStats}>
              <StatCard icon={Clock} label="Testlar" value={profile?.stats?.test_count || 0} color="#635BFF" />
              <StatCard icon={Target} label="Progress" value={`${progress?.percent || 0}%`} color="#00D4AA" />
              <StatCard icon={Award} label="Skilllar" value={profile?.user_skills?.length || 0} color="#F59E0B" />
            </div>
          </div>
        </div>

        {/* ── Progress Hero ── */}
        {progress && (
          <div className={styles.progressCard}>
            <AnimatedProgress percent={progress.percent} label={progress.occupation_name} />
            <div className={styles.progressSkills}>
              <div className={styles.progressSkillsTitle}>
                <CheckCircle size={14} color="#00D4AA" />
                Mavjud ko'nikmalar ({progress.matched.length})
              </div>
              <div className={styles.chipGroup}>
                {progress.matched.map(s => <SkillChip key={s} name={s} has={true} />)}
              </div>
              <div className={styles.progressSkillsTitle} style={{ marginTop: 12 }}>
                <XCircle size={14} color="#EF4444" />
                Yetishmayotganlar ({progress.missing.length})
              </div>
              <div className={styles.chipGroup}>
                {progress.missing.map(s => <SkillChip key={s} name={s} has={false} />)}
              </div>
            </div>
          </div>
        )}

        {/* ── Tablar ── */}
        <div className={styles.tabs}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div className={styles.grid2}>
            {/* RIASEC Radar */}
            <div className={`${styles.card} animate-in`}>
              <h4 className={styles.cardTitle}>RIASEC Profilingiz</h4>
              <p className={styles.cardMeta}>Oxirgi test natijalari</p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyState}>
                  <BarChart3 size={40} color="var(--text-muted)" />
                  <p>Test natijasi yo'q. RIASEC testni o'ting!</p>
                </div>
              )}
            </div>

            {/* RIASEC bar scores */}
            <div className={`${styles.card} animate-in`}>
              <h4 className={styles.cardTitle}>Kategoriyalar bo'yicha</h4>
              <p className={styles.cardMeta}>Holland kodlari (0–10)</p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={radarData} layout="vertical">
                    <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'var(--text)' }} width={96} />
                    <Tooltip formatter={v => [`${v}/10`, 'Ball']} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {radarData.map((entry, i) => (
                        <Cell key={i} fill={Object.values(CAT_COLOR)[i % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyState}>
                  <p>Ma'lumot yo'q</p>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className={`${styles.card} ${styles.fullWidth} animate-in`}>
              <h4 className={styles.cardTitle}>Sizning ko'nikmalaringiz</h4>
              <p className={styles.cardMeta}>Oxirgi testdan ({profile?.user_skills?.length || 0} ta)</p>
              {profile?.user_skills?.length > 0 ? (
                <div className={styles.chipGroup} style={{ marginTop: 12 }}>
                  {profile.user_skills.map(s => (
                    <span key={s} className={styles.chip} style={{ background:'rgba(99,91,255,0.1)', color:'var(--accent-alt)', borderColor:'rgba(99,91,255,0.2)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}><p>Ko'nikmalar topilmadi</p></div>
              )}
            </div>
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className={`${styles.card} ${styles.emptyState}`}>
                <Clock size={48} color="var(--text-muted)" />
                <p>Hali test o'tilmagan. RIASEC testni boshlang!</p>
                <button className={styles.saveBtn} onClick={onBack}>
                  <ChevronRight size={15} /> Testni boshlash
                </button>
              </div>
            ) : (
              <div className={styles.timeline}>
                {history.map((item, i) => <HistoryItem key={item.id} item={item} index={i} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Settings tab ── */}
        {activeTab === 'settings' && (
          <SettingsTab profile={profile} occupations={occupations} onSaved={loadAll} />
        )}
      </div>
    </div>
  );
}
