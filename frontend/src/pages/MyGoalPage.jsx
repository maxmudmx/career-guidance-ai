import { useEffect, useState, useMemo } from 'react';
import {
  Star, Briefcase, BookOpen, Target, ExternalLink,
  CheckCircle, Circle, DollarSign, Flame, TrendingUp, PlayCircle,
  AlertCircle, Sparkles, Calendar, Award, Zap, ChevronRight,
  ArrowUpRight, Clock, FileQuestion, Lock, BookMarked,
} from 'lucide-react';
import { Card, Tag, Button } from '../components/ui';
import PageHeader from '../components/PageHeader';
import SkillQuizModal from '../components/SkillQuizModal';
import api, { predictAPI, jobsAPI, progressAPI, careerProfileAPI } from '../services/api';

// Daraja meta
const LEVEL_META = {
  expert:       { color: '#9333EA', label: 'Mutaxassis' },
  advanced:     { color: '#16A34A', label: 'Yuqori' },
  intermediate: { color: '#2563EB', label: "O'rta" },
  beginner:     { color: '#F59E0B', label: 'Yangi boshlovchi' },
};

function levelFromPercent(p) {
  if (p == null) return null;
  if (p >= 90) return 'expert';
  if (p >= 70) return 'advanced';
  if (p >= 40) return 'intermediate';
  return 'beginner';
}

// Daraja asosida rivojlantirish tavsiyalari
function devTipsForLevel(skill, level) {
  if (level === 'expert') {
    return [`${skill}: Ilg'or — boshqalarga o'rgating, real loyihalar qiling`];
  }
  if (level === 'advanced') {
    return [
      `${skill} bo'yicha kichik real loyiha qiling`,
      `Mutaxassis darajaga ko'tarilish — chuqur amaliyot`,
    ];
  }
  if (level === 'intermediate') {
    return [
      `${skill} bo'yicha ko'proq mashq qiling`,
      `Yuqori darajadagi kurslarni ko'ring`,
      `Quizni qaytadan topshirib, darajani ko'taring`,
    ];
  }
  return [
    `${skill} asoslarini o'rganing — boshlang'ich darslar`,
    `Har kuni 30 daqiqa mashq qilish`,
    `Quizni qayta topshiring`,
  ];
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const youtubeSearchUrl = (q, lang = 'uz') =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    lang === 'uz' ? `${q} o'zbek tilida` : `${q} tutorial`,
  )}`;

// Bir hafta uchun ~3 ko'nikma o'rgansa = haftalik tezlik
function estimateWeeks(missingCount, weeklyRate = 1) {
  if (!missingCount) return 0;
  return Math.max(1, Math.ceil(missingCount / weeklyRate));
}

// ────────────────────────────────────────────────────────────
// Circular progress (SVG)
// ────────────────────────────────────────────────────────────
function ProgressRing({ percent, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-subtle)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
          {percent}%
        </div>
        <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          tayyor
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// KPI tile
// ────────────────────────────────────────────────────────────
function KpiTile({ icon: Icon, value, label, color = 'var(--accent)' }) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold mb-0.5 tabular-nums" style={{ color: 'var(--text)' }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Skill row — daraja badge bilan
// ────────────────────────────────────────────────────────────
function SkillRow({ skill, completed, fromTest, hasQuiz, score, onStartQuiz }) {
  const level = score != null ? levelFromPercent(score) : null;
  const lvMeta = level ? LEVEL_META[level] : null;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
      style={{
        background: completed ? 'var(--success-bg)' : 'var(--surface)',
        borderColor: completed ? 'var(--success-border)' : 'var(--border)',
      }}
    >
      <div className="flex-shrink-0">
        {completed ? (
          <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
        ) : (
          <Circle className="w-5 h-5" style={{ color: 'var(--text-faint)' }} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-medium truncate"
            style={{ color: completed ? 'var(--success)' : 'var(--text)' }}
          >
            {skill}
          </span>
          {lvMeta && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
              style={{ background: `${lvMeta.color}1F`, color: lvMeta.color }}
            >
              {lvMeta.label} {score}%
            </span>
          )}
        </div>
        {completed && !lvMeta && fromTest && (
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Test paytida o'zingiz aytgansiz
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <a
          href={youtubeSearchUrl(skill)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md"
          style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}
          title="YouTube video qidirish"
        >
          <PlayCircle className="w-3 h-3" /> Video
        </a>
        {hasQuiz ? (
          <button
            type="button"
            onClick={() => onStartQuiz(skill)}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border"
            style={{
              background: score != null ? 'transparent' : 'var(--accent)',
              color: score != null ? 'var(--accent)' : '#FFFFFF',
              borderColor: 'var(--accent-border)',
            }}
          >
            <FileQuestion className="w-3 h-3" />
            {score != null ? 'Qayta urinish' : 'Quiz'}
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md"
            style={{ background: 'var(--surface-subtle)', color: 'var(--text-faint)' }}
            title="Bu ko'nikma uchun quiz hozircha mavjud emas"
          >
            <Lock className="w-3 h-3" /> Soon
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────
export default function MyGoalPage({ onBack, onTakeTest }) {
  const [profile, setProfile] = useState(null);
  const [career, setCareer] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [completed, setCompleted] = useState([]);  // quiz orqali tasdiqlangan
  const [fromTest, setFromTest] = useState([]);    // test paytida aytgan
  const [availableQuizzes, setAvailableQuizzes] = useState([]);  // quiz mavjud ko'nikmalar
  const [skillScores, setSkillScores] = useState({});  // {skill: percent}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);  // hozir ochilgan quiz skill nomi

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .get('/users/me')
      .then(async (res) => {
        if (!mounted) return;
        setProfile(res.data);
        const targetId = res.data?.target_occupation_id;
        if (targetId == null) {
          setLoading(false);
          return;
        }

        const [occRes, rmRes, jbRes, prRes, qzRes, cpRes] = await Promise.allSettled([
          api.get('/users/occupations'),
          predictAPI.getRoadmap(targetId),
          jobsAPI.getJobs(targetId),
          progressAPI.get(targetId),
          progressAPI.listAvailableQuizzes(),
          careerProfileAPI.get(),
        ]);

        if (!mounted) return;

        if (occRes.status === 'fulfilled') {
          const occ = (occRes.value.data?.occupations || []).find((o) => o.id === targetId);
          if (occ) setCareer(occ);
        }
        if (rmRes.status === 'fulfilled') setRoadmap(rmRes.value.data);
        if (jbRes.status === 'fulfilled') setJobs(jbRes.value.data);
        if (prRes.status === 'fulfilled') {
          setFromTest(prRes.value.data?.user_skills || []);
          setCompleted(prRes.value.data?.completed_skills || []);
        }
        if (qzRes.status === 'fulfilled') {
          setAvailableQuizzes(qzRes.value.data?.skills || []);
        }
        if (cpRes.status === 'fulfilled') {
          setSkillScores(cpRes.value.data?.skill_scores || {});
        }
      })
      .catch((err) => mounted && setError(err.response?.data?.detail || 'Yuklashda xato'))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  // Quiz tugaganda — backend allaqachon saqlagan. Lokal state'da ham yangilaymiz.
  const handleQuizCompleted = async (quizSkill, percent) => {
    setSkillScores((prev) => ({ ...prev, [quizSkill]: percent }));
    if (percent >= 70) {
      setCompleted((prev) => (prev.includes(quizSkill) ? prev : [...prev, quizSkill]));
    }
    // Profilni qayta o'qib olamiz (predictionlar ham yangilanishi mumkin)
    try {
      const res = await careerProfileAPI.get();
      setSkillScores(res.data?.skill_scores || {});
    } catch {
      // ignore
    }
  };

  const startQuiz = (skill) => setActiveQuiz(skill);
  const closeQuiz = () => setActiveQuiz(null);

  // Test'dan kelgan + quiz orqali tasdiqlangan ko'nikmalar — barchasi "o'zlashtirilgan"
  const allMastered = useMemo(
    () => [...new Set([...fromTest, ...completed])],
    [fromTest, completed],
  );

  // Rivojlanishga muhtoj ko'nikmalar — past darajadagilar
  const skillsToImprove = useMemo(() => {
    return Object.entries(skillScores)
      .filter(([s, p]) => p < 70 && (career?.required_skills || []).includes(s))
      .sort((a, b) => a[1] - b[1])
      .slice(0, 4);
  }, [skillScores, career]);

  // ────────── Calculated values
  const required = career?.required_skills || roadmap?.required_skills || [];
  const completedCount = useMemo(
    () => required.filter((s) => allMastered.includes(s)).length,
    [required, allMastered],
  );
  const missingSkills = useMemo(
    () => required.filter((s) => !allMastered.includes(s)),
    [required, allMastered],
  );
  const realProgress = required.length
    ? Math.round((completedCount / required.length) * 100)
    : 0;
  const weeksLeft = estimateWeeks(missingSkills.length);
  const monthsLeft = Math.max(1, Math.ceil(weeksLeft / 4));

  // Phased roadmap (3 ta bosqich)
  const phases = roadmap?.roadmap || [];
  const phaseProgress = phases.map((phase) => {
    const skills = phase.skills || [];
    if (!skills.length) return { ...phase, pct: 0, done: 0, total: 0 };
    const done = skills.filter((s) => allMastered.includes(s)).length;
    return {
      ...phase,
      pct: Math.round((done / skills.length) * 100),
      done,
      total: skills.length,
    };
  });

  // ────────── Loading
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Maqsadingiz yuklanmoqda...
        </p>
      </div>
    );
  }

  // ────────── Empty state
  if (!profile?.target_occupation_id) {
    return (
      <div
        className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans"
        style={{ background: 'var(--bg)' }}
      >
        <div className="max-w-2xl mx-auto">
          <PageHeader
            title="Mening maqsadim"
            subtitle="Hali maqsad belgilanmagan"
            onBack={onBack}
            icon={Star}
          />
          <Card className="p-10 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)' }}
            >
              <Target className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
              Hali maqsad belgilanmagan
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Testdan o'tib, eng mos kasbingizni "Maqsad qilib saqlash" tugmasi orqali
              belgilang. Keyin shu yerdan progresingizni kuzatib boring.
            </p>
            <Button variant="primary" onClick={onTakeTest}>
              Testni boshlash
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ────────── Next action (eng prioritet ko'nikma)
  const nextSkill = missingSkills[0];

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Mening maqsadim"
          subtitle={career?.name_uz || career?.name || 'Kasb'}
          onBack={onBack}
          icon={Star}
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

        {/* HERO: Career + Progress ring */}
        {career && (
          <Card className="p-6 mb-4">
            <div className="flex items-center gap-6 flex-wrap">
              <ProgressRing percent={realProgress} />

              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--accent)' }}
                >
                  Maqsadli kasb
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
                >
                  {career.name_uz || career.name}
                </h2>
                <div
                  className="flex items-center gap-3 flex-wrap text-sm mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {career.category_uz && <Tag variant="primary">{career.category_uz}</Tag>}
                  {career.avg_salary && (
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {career.avg_salary}
                    </span>
                  )}
                  {career.demand && (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> {career.demand}
                    </span>
                  )}
                </div>

                {realProgress < 100 && missingSkills.length > 0 && (
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--text)' }}
                  >
                    <Clock className="inline w-3.5 h-3.5 mr-1 mb-0.5" style={{ color: 'var(--accent)' }} />
                    Taxminiy:{' '}
                    <strong style={{ color: 'var(--accent)' }}>
                      ~{monthsLeft} oy
                    </strong>{' '}
                    ichida tayyor (haftasiga 1 ta ko'nikma tezligida)
                  </div>
                )}
                {realProgress === 100 && (
                  <div
                    className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg"
                    style={{
                      background: 'var(--success-bg)',
                      color: 'var(--success)',
                      border: '1px solid var(--success-border)',
                    }}
                  >
                    <Award className="w-4 h-4" /> Tabriklaymiz! Kasbga to'liq tayyorsiz
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KpiTile
            icon={TrendingUp}
            value={`${realProgress}%`}
            label="Umumiy progress"
          />
          <KpiTile
            icon={CheckCircle}
            value={`${completedCount}/${required.length}`}
            label="O'zlashtirildi"
            color="var(--success)"
          />
          <KpiTile
            icon={Target}
            value={missingSkills.length}
            label="Qoldi"
            color="var(--warning)"
          />
          <KpiTile
            icon={Calendar}
            value={`~${monthsLeft} oy`}
            label="Taxminiy vaqt"
          />
        </div>

        {/* Next action card */}
        {nextSkill && (
          <Card
            className="p-5 mb-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--surface) 100%)',
            }}
          >
            <div className="flex items-start gap-4 flex-wrap">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--accent)' }}
                >
                  Keyingi vazifa
                </div>
                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: 'var(--text)' }}
                >
                  {nextSkill} ni o'rganing
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  Bu eng prioritet ko'nikma. Video kursni ko'ring va tugatganingizdan
                  so'ng pastdagi checklist'da belgilang.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={youtubeSearchUrl(nextSkill, 'uz')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                      background: 'var(--accent)',
                      color: '#FFFFFF',
                    }}
                  >
                    <PlayCircle className="w-4 h-4" /> O'zbek video
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <a
                    href={youtubeSearchUrl(nextSkill, 'en')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <PlayCircle className="w-4 h-4" /> English video
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  {availableQuizzes.includes(nextSkill) ? (
                    <button
                      type="button"
                      onClick={() => startQuiz(nextSkill)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border"
                      style={{
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        borderColor: 'var(--success-border)',
                      }}
                    >
                      <FileQuestion className="w-4 h-4" /> Quiz topshirish
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border"
                      style={{
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-faint)',
                        borderColor: 'var(--border)',
                      }}
                      title="Bu ko'nikma uchun quiz hozircha mavjud emas"
                    >
                      <Lock className="w-4 h-4" /> Quiz tayyorlanmoqda
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Phased timeline */}
        {phaseProgress.length > 0 && (
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Yo'l xaritasi
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {phaseProgress.filter((p) => p.pct === 100).length} / {phaseProgress.length} bosqich
              </span>
            </div>

            <div className="space-y-4">
              {phaseProgress.map((phase, i) => {
                const isDone = phase.pct === 100 && phase.total > 0;
                const isCurrent =
                  !isDone &&
                  i === phaseProgress.findIndex((p) => p.pct < 100);
                return (
                  <div key={i} className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: isDone ? 'var(--success)' : isCurrent ? 'var(--accent)' : 'var(--surface-subtle)',
                          color: isDone || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                        }}
                      >
                        {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {phase.month}
                          </span>
                          {isCurrent && (
                            <Tag variant="primary">Hozir bu yerda</Tag>
                          )}
                          {isDone && <Tag variant="success">Tugatildi</Tag>}
                        </div>
                        <div
                          className="text-sm font-semibold mt-0.5"
                          style={{ color: 'var(--text)' }}
                        >
                          {phase.title}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="text-sm font-bold tabular-nums"
                          style={{ color: isDone ? 'var(--success)' : 'var(--accent)' }}
                        >
                          {phase.pct}%
                        </div>
                        {phase.total > 0 && (
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {phase.done}/{phase.total}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="h-1.5 rounded-full overflow-hidden ml-11"
                      style={{ background: 'var(--surface-subtle)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${phase.pct}%`,
                          background: isDone ? 'var(--success)' : 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Skills checklist */}
        {required.length > 0 && (
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Ko'nikmalar
              </h3>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {completedCount} / {required.length} o'zlashtirildi
              </span>
            </div>

            {/* Yetishmayotgan (yuqorida) */}
            {missingSkills.length > 0 && (
              <div className="mb-4">
                <div
                  className="text-[10px] uppercase tracking-wider mb-2 font-semibold"
                  style={{ color: 'var(--text-faint)' }}
                >
                  O'rganish kerak ({missingSkills.length})
                </div>
                <div className="space-y-2">
                  {missingSkills.map((s) => (
                    <SkillRow
                      key={s}
                      skill={s}
                      completed={false}
                      fromTest={false}
                      hasQuiz={availableQuizzes.includes(s)}
                      score={skillScores[s]}
                      onStartQuiz={startQuiz}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tugatilgan (pastda) */}
            {completedCount > 0 && (
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-2 font-semibold"
                  style={{ color: 'var(--text-faint)' }}
                >
                  O'zlashtirildi ({completedCount})
                </div>
                <div className="space-y-2">
                  {required
                    .filter((s) => allMastered.includes(s))
                    .map((s) => (
                      <SkillRow
                        key={s}
                        skill={s}
                        completed={true}
                        fromTest={fromTest.includes(s) && !completed.includes(s)}
                        hasQuiz={availableQuizzes.includes(s)}
                        score={skillScores[s]}
                        onStartQuiz={startQuiz}
                      />
                    ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Rivojlantirish tavsiyalari — past darajadagi ko'nikmalar uchun */}
        {skillsToImprove.length > 0 && (
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <BookMarked className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Rivojlantirishingiz kerak
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Darajangizni oshirish uchun ustuvor ko'nikmalar
              </span>
            </div>

            <div className="space-y-3">
              {skillsToImprove.map(([sk, pct]) => {
                const lv = levelFromPercent(pct);
                const lvMeta = LEVEL_META[lv];
                const tips = devTipsForLevel(sk, lv);
                return (
                  <div
                    key={sk}
                    className="p-4 rounded-lg border"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            {sk}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: `${lvMeta.color}1F`, color: lvMeta.color }}
                          >
                            {lvMeta.label} {pct}%
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--surface-subtle)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: lvMeta.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-1 mb-3">
                      {tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <ChevronRight
                            className="w-3 h-3 mt-0.5 flex-shrink-0"
                            style={{ color: 'var(--accent)' }}
                          />
                          {tip}
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-1.5">
                      <a
                        href={youtubeSearchUrl(sk)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md"
                        style={{
                          background: 'var(--surface-subtle)',
                          color: 'var(--text)',
                        }}
                      >
                        <PlayCircle className="w-3 h-3" /> O'zbek videolar
                      </a>
                      <button
                        type="button"
                        onClick={() => startQuiz(sk)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border"
                        style={{
                          background: 'transparent',
                          color: 'var(--accent)',
                          borderColor: 'var(--accent-border)',
                        }}
                      >
                        <FileQuestion className="w-3 h-3" /> Quizni qaytarish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Jobs */}
        {jobs?.jobs?.length > 0 && (
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Briefcase className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Hozirgi vakansiyalar
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {jobs.jobs.length} ta
              </span>
            </div>
            <div className="space-y-2">
              {jobs.jobs.slice(0, 5).map((job, i) => (
                <a
                  key={i}
                  href={job.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {job.title}
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {job.company}{job.location && ` • ${job.location}`}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: 'var(--text-faint)' }} />
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!phaseProgress.length && !required.length && !jobs?.jobs?.length && (
          <Card className="p-6 text-center">
            <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Bu kasb uchun batafsil ma'lumotlar tayyorlanmoqda.
            </p>
          </Card>
        )}
      </div>

      {/* Quiz modal */}
      <SkillQuizModal
        open={!!activeQuiz}
        skill={activeQuiz}
        occupationId={profile?.target_occupation_id}
        onClose={closeQuiz}
        onCompleted={handleQuizCompleted}
      />
    </div>
  );
}
