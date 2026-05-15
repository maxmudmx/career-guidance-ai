import { useEffect, useState, useMemo } from 'react';
import {
  UserCog, Brain, Target, GraduationCap, Sparkles, Save,
  CheckCircle, Trophy, AlertCircle, Loader2, ChevronRight,
  FileQuestion, Lock, Award, TrendingUp, Star,
} from 'lucide-react';
import { Card, Tag, Button } from '../components/ui';
import PageHeader from '../components/PageHeader';
import SkillQuizModal from '../components/SkillQuizModal';
import { careerProfileAPI, predictAPI, progressAPI } from '../services/api';

// Daraja meta (frontend bilan sinxron)
const LEVEL_META = {
  expert:       { color: '#9333EA', label: 'Mutaxassis',     icon: Sparkles },
  advanced:     { color: '#16A34A', label: 'Yuqori',         icon: Award },
  intermediate: { color: '#2563EB', label: "O'rta",          icon: TrendingUp },
  beginner:     { color: '#F59E0B', label: 'Yangi boshlovchi', icon: Star },
};

function levelFromPercent(p) {
  if (p == null) return null;
  if (p >= 90) return 'expert';
  if (p >= 70) return 'advanced';
  if (p >= 40) return 'intermediate';
  return 'beginner';
}

const CATEGORY_NAMES = {
  R: 'Realistik (amaliy)',
  I: 'Tadqiqotchi (ilm)',
  A: 'Ijodkor (san\'at)',
  S: 'Ijtimoiy (odamlar)',
  E: 'Tadbirkor (rahbarlik)',
  C: 'Konvensional (tartib)',
};
const RIASEC_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

// ────────────────────────────────────────────────────────────
// Tab button
// ────────────────────────────────────────────────────────────
function Tab({ icon: Icon, label, active, onClick, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#FFFFFF' : 'var(--text-muted)',
      }}
      title={hint}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// Number / slider input
// ────────────────────────────────────────────────────────────
function ScoreSlider({ label, value, onChange, min = 0, max = 10, step = 1 }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        <span className="text-sm font-mono font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
          {value ?? '-'}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--accent)' }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Section header
// ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--accent-soft)' }}
      >
        <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        {desc && (
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────
export default function CareerProfilePage({ onBack, onMyGoal }) {
  const [profile, setProfile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  // Edit form state
  const [riasec, setRiasec] = useState({ R: 5, I: 5, A: 5, S: 5, E: 5, C: 5 });
  const [skills, setSkills] = useState([]);
  const [skillScores, setSkillScores] = useState({});   // {skill: percent}
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);  // skill nomi
  const [skillFilter, setSkillFilter] = useState('all');
  const [skillSearch, setSkillSearch] = useState('');
  const [gpa, setGpa] = useState(3.5);
  const [age, setAge] = useState(20);
  const [analytical, setAnalytical] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [interests, setInterests] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');

  // Load profile + metadata + available quizzes
  useEffect(() => {
    let mounted = true;
    Promise.all([
      careerProfileAPI.get(),
      predictAPI.getMetadata(),
      progressAPI.listAvailableQuizzes(),
    ])
      .then(([p, m, q]) => {
        if (!mounted) return;
        setProfile(p.data);
        setMetadata(m.data);
        setAvailableQuizzes(q.data?.skills || []);
        if (p.data?.exists) {
          setRiasec({ R: 5, I: 5, A: 5, S: 5, E: 5, C: 5, ...(p.data.riasec_scores || {}) });
          setSkills(p.data.skills || []);
          setSkillScores(p.data.skill_scores || {});
          setGpa(p.data.gpa ?? 3.5);
          setAge(p.data.age ?? 20);
          setAnalytical(p.data.analytical ?? 5);
          setCommunication(p.data.communication ?? 5);
          setInterests(p.data.interests || []);
          setSubjects(p.data.subjects || []);
        }
      })
      .catch((err) => mounted && setError(err.response?.data?.detail || 'Yuklashda xato'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const toggleIn = (arr, val, setter) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  // Quiz tugaganida — backend o'zi saqlagan, biz local state'ni yangilaymiz
  const handleQuizCompleted = async (quizSkill, percent) => {
    setSkillScores((prev) => ({ ...prev, [quizSkill]: percent }));
    // Yangi profilni o'qib olamiz (predictionlar ham yangilanishi mumkin)
    try {
      const res = await careerProfileAPI.get();
      setProfile(res.data);
      setSkills(res.data?.skills || []);
      setSkillScores(res.data?.skill_scores || {});
    } catch {
      // ignore
    }
  };

  const openQuizFor = (skill) => setActiveQuiz(skill);
  const closeQuiz = () => setActiveQuiz(null);

  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await careerProfileAPI.update({
        riasec_scores: riasec,
        skills,
        gpa,
        age,
        analytical,
        communication,
        interests,
        subjects,
      });
      setProfile(res.data);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      setTab('overview'); // Saqlashdan keyin yangi natijaga yo'naltirish
    } catch (err) {
      setError(err.response?.data?.detail || 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  const skillCategories = metadata?.skill_categories || {};
  const allSkillsFlat = useMemo(() => {
    return Object.entries(skillCategories).flatMap(([cat, list]) =>
      list.map((s) => ({ skill: s, category: cat })),
    );
  }, [skillCategories]);

  const filteredSkills = useMemo(() => {
    let arr = allSkillsFlat;
    if (skillFilter !== 'all') arr = arr.filter((x) => x.category === skillFilter);
    if (skillSearch) {
      const q = skillSearch.toLowerCase();
      arr = arr.filter((x) => x.skill.toLowerCase().includes(q));
    }
    return arr;
  }, [allSkillsFlat, skillFilter, skillSearch]);

  const interestList = metadata?.interests || [];
  const subjectList = metadata?.subjects || [];

  // Loading — barcha hook'lardan keyin
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--bg)' }}
      >
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Profil yuklanmoqda...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Karyera profilim"
          subtitle="Ma'lumotlaringizni istalgan paytda tahrirlang — natija avtomatik yangilanadi"
          onBack={onBack}
          icon={UserCog}
        />

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm border flex items-start gap-2"
            style={{
              background: 'var(--error-bg)',
              borderColor: 'var(--error-border)',
              color: 'var(--error)',
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {savedFlash && (
          <div
            className="mb-4 p-3 rounded-lg text-sm border flex items-start gap-2"
            style={{
              background: 'var(--success-bg)',
              borderColor: 'var(--success-border)',
              color: 'var(--success)',
            }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Profil saqlandi va kasb tavsiyalari yangilandi.
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 mb-4 overflow-x-auto p-1 rounded-xl border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Tab icon={Trophy} label="Umumiy" active={tab === 'overview'} onClick={() => setTab('overview')} />
          <Tab icon={Brain} label="RIASEC" active={tab === 'riasec'} onClick={() => setTab('riasec')} />
          <Tab icon={Target} label="Ko'nikmalar" active={tab === 'skills'} onClick={() => setTab('skills')} />
          <Tab icon={GraduationCap} label="Akademik" active={tab === 'academic'} onClick={() => setTab('academic')} />
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            {profile?.top_career ? (
              <Card
                className="p-6 mb-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--surface) 100%)',
                }}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
                      Joriy ma'lumotlar bo'yicha — eng mos kasb
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                      {profile.top_career.name_uz}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>
                        {profile.top_career.score}% moslik
                      </span>
                      {profile.top_career.category_uz && <Tag variant="primary">{profile.top_career.category_uz}</Tag>}
                    </div>
                  </div>
                </div>

                {profile.predictions?.length > 1 && (
                  <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                      Boshqa mos kasblar
                    </div>
                    <div className="space-y-1.5">
                      {profile.predictions.slice(1, 5).map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ background: 'var(--surface)' }}
                        >
                          <span className="text-sm" style={{ color: 'var(--text)' }}>
                            #{i + 2} {p.name_uz}
                          </span>
                          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                            {p.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex gap-2 flex-wrap">
                  {onMyGoal && (
                    <Button variant="primary" onClick={onMyGoal}>
                      <ChevronRight className="w-4 h-4" /> Maqsadimga o'tish
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center mb-4">
                <Sparkles className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  Profilingiz hali bo'sh
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  Quyidagi bo'limlarda ma'lumot kiritib, "Saqlash" tugmasini bosing.
                </p>
                <Button variant="primary" onClick={() => setTab('riasec')}>
                  RIASEC bo'limidan boshlash
                </Button>
              </Card>
            )}

            {profile?.updated_at && (
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Oxirgi yangilanish: {new Date(profile.updated_at).toLocaleString('uz-UZ')}
              </p>
            )}
          </>
        )}

        {/* RIASEC TAB */}
        {tab === 'riasec' && (
          <Card className="p-6 mb-4">
            <SectionHeader
              icon={Brain}
              title="RIASEC ballari"
              desc="Har bir tipga o'zingizni qanchalik mos his qilishingizni 0-10 oralig'ida belgilang"
            />
            <div className="space-y-4">
              {RIASEC_ORDER.map((k) => (
                <ScoreSlider
                  key={k}
                  label={`${k} — ${CATEGORY_NAMES[k]}`}
                  value={riasec[k]}
                  onChange={(v) => setRiasec({ ...riasec, [k]: v })}
                />
              ))}
            </div>
          </Card>
        )}

        {/* SKILLS TAB — Quiz orqali daraja aniqlash */}
        {tab === 'skills' && (
          <>
            {/* Tested skills with scores */}
            {Object.keys(skillScores).length > 0 && (
              <Card className="p-6 mb-4">
                <SectionHeader
                  icon={Award}
                  title="Tasdiqlangan ko'nikmalarim"
                  desc={`Quiz orqali daraja aniqlangan ${Object.keys(skillScores).length} ta ko'nikma`}
                />
                <div className="space-y-2">
                  {Object.entries(skillScores)
                    .sort((a, b) => b[1] - a[1])
                    .map(([sk, pct]) => {
                      const lv = levelFromPercent(pct);
                      const meta = LEVEL_META[lv];
                      const LvIcon = meta.icon;
                      return (
                        <div
                          key={sk}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{
                            background: 'var(--surface)',
                            borderColor: 'var(--border)',
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${meta.color}1F` }}
                          >
                            <LvIcon className="w-4 h-4" style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                              {sk}
                            </div>
                            <div className="text-xs" style={{ color: meta.color }}>
                              {meta.label} • {pct}%
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openQuizFor(sk)}
                            className="text-xs font-medium px-2.5 py-1 rounded-md border flex-shrink-0"
                            style={{
                              background: 'transparent',
                              color: 'var(--accent)',
                              borderColor: 'var(--accent-border)',
                            }}
                          >
                            Qayta urinish
                          </button>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Add new skill via quiz */}
            <Card className="p-6 mb-4">
              <SectionHeader
                icon={FileQuestion}
                title="Yangi ko'nikma qo'shish"
                desc="Ko'nikmani bosish bilan 5-10 ta savolli test ochiladi. Natija darajangizni belgilaydi."
              />

              {/* Search */}
              <input
                type="text"
                placeholder="Ko'nikmani qidirish..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />

              {/* Category filter */}
              <div className="flex gap-1.5 mb-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSkillFilter('all')}
                  className="px-3 py-1 text-xs rounded-full border"
                  style={{
                    background: skillFilter === 'all' ? 'var(--accent)' : 'transparent',
                    color: skillFilter === 'all' ? '#FFFFFF' : 'var(--text-muted)',
                    borderColor: skillFilter === 'all' ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  Hammasi
                </button>
                {Object.keys(skillCategories).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSkillFilter(cat)}
                    className="px-3 py-1 text-xs rounded-full border"
                    style={{
                      background: skillFilter === cat ? 'var(--accent)' : 'transparent',
                      color: skillFilter === cat ? '#FFFFFF' : 'var(--text-muted)',
                      borderColor: skillFilter === cat ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div
                className="flex flex-wrap gap-1.5 max-h-80 overflow-y-auto p-2 rounded-lg"
                style={{ background: 'var(--bg)' }}
              >
                {filteredSkills.map(({ skill }) => {
                  const hasScore = skill in skillScores;
                  const hasQuiz = availableQuizzes.includes(skill);

                  if (hasScore) {
                    return (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-full text-xs font-medium border opacity-50"
                        style={{
                          background: 'var(--success-bg)',
                          color: 'var(--success)',
                          borderColor: 'var(--success-border)',
                        }}
                        title="Allaqachon tasdiqlangan"
                      >
                        ✓ {skill}
                      </span>
                    );
                  }

                  if (!hasQuiz) {
                    return (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                        style={{
                          background: 'var(--surface-subtle)',
                          color: 'var(--text-faint)',
                          borderColor: 'var(--border)',
                        }}
                        title="Quiz hozircha mavjud emas"
                      >
                        <Lock className="w-3 h-3" /> {skill}
                      </span>
                    );
                  }

                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => openQuizFor(skill)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:opacity-80"
                      style={{
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        borderColor: 'var(--accent-border)',
                      }}
                    >
                      <FileQuestion className="w-3 h-3" /> {skill}
                    </button>
                  );
                })}
                {filteredSkills.length === 0 && (
                  <p className="text-sm w-full text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    Bu mezonga mos ko'nikma topilmadi
                  </p>
                )}
              </div>

              <div
                className="mt-3 p-3 rounded-lg text-xs flex items-start gap-2"
                style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--text)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <span>
                  <strong>Daraja shkalasi:</strong> 0-39% Yangi boshlovchi, 40-69% O'rta,
                  70-89% Yuqori, 90-100% Mutaxassis. 40%+ olgan ko'nikma profilingizga qo'shiladi.
                </span>
              </div>
            </Card>
          </>
        )}

        {/* ACADEMIC TAB */}
        {tab === 'academic' && (
          <Card className="p-6 mb-4">
            <SectionHeader
              icon={GraduationCap}
              title="Akademik va shaxsiy"
              desc="GPA, yosh, qiziqishlar va fanlar"
            />
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ScoreSlider label="GPA (0-5)" value={gpa} onChange={setGpa} min={0} max={5} step={0.1} />
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                    Yosh
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <ScoreSlider label="Analitik fikrlash (1-10)" value={analytical} onChange={setAnalytical} min={1} max={10} />
                <ScoreSlider label="Kommunikatsiya (1-10)" value={communication} onChange={setCommunication} min={1} max={10} />
              </div>

              {interestList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    Qiziqishlar ({interests.length} tanlangan)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {interestList.map((it) => {
                      const key = it.key || it;
                      const label = it.label || it;
                      const active = interests.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleIn(interests, key, setInterests)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium border"
                          style={{
                            background: active ? 'var(--accent-soft)' : 'var(--surface)',
                            color: active ? 'var(--accent)' : 'var(--text-muted)',
                            borderColor: active ? 'var(--accent-border)' : 'var(--border)',
                          }}
                        >
                          {active ? '✓ ' : ''}{label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {subjectList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    Fanlar ({subjects.length} tanlangan)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {subjectList.map((sb) => {
                      const key = sb.key || sb;
                      const label = sb.label || sb;
                      const active = subjects.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleIn(subjects, key, setSubjects)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium border"
                          style={{
                            background: active ? 'var(--accent-soft)' : 'var(--surface)',
                            color: active ? 'var(--accent)' : 'var(--text-muted)',
                            borderColor: active ? 'var(--accent-border)' : 'var(--border)',
                          }}
                        >
                          {active ? '✓ ' : ''}{label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Quiz modal */}
        <SkillQuizModal
          open={!!activeQuiz}
          skill={activeQuiz}
          occupationId={profile?.top_career?.id}
          onClose={closeQuiz}
          onCompleted={handleQuizCompleted}
        />

        {/* Sticky save bar (faqat tahrir tab'larida — Skills tab'da quiz orqali saqlanadi) */}
        {tab !== 'overview' && tab !== 'skills' && (
          <div className="sticky bottom-4 z-30 flex justify-center mt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={saveAll}
              disabled={saving}
              className="shadow-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda va qayta hisoblanmoqda...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Saqlash va kasb tavsiyasini yangilash
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
