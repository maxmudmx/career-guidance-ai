import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  BarChart3, Target, BookOpen, Briefcase, CheckCircle, XCircle,
  TrendingUp, ExternalLink, Clock, RotateCcw, Upload, GitCompare,
  DollarSign, Flame, Share2, MapPin, Building2, RefreshCw,
  Lightbulb, History, ChevronRight, Star, AlertCircle, Award,
  GraduationCap, PlayCircle, Globe, ArrowLeft,
} from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import api, { jobsAPI, historyAPI, predictAPI } from '../services/api';
import { Button, Card, Tag } from '../components/ui';

// ============================================================
// Helpers
// ============================================================
const CATEGORY_NAMES = {
  R: 'Realistik', I: 'Tadqiqotchi', A: 'Ijodkor',
  S: 'Ijtimoiy', E: 'Tadbirkor', C: 'Konvensional',
};
const PIE_COLORS = ['#2563EB', '#7C3AED', '#F59E0B', '#16A34A', '#DC2626'];

function demandVariant(d) {
  if (!d) return 'muted';
  if (d.includes('Juda') || d.includes('Juta')) return 'danger';
  if (d.includes('Yuqori')) return 'warning';
  if (d.includes('rta')) return 'success';
  if (d.includes('sib')) return 'primary';
  return 'muted';
}

function analyzeSkillsGap(userSkills, occupation) {
  const required = occupation.required_skills || occupation.requiredSkills || [];
  const matched = required.filter((s) => userSkills.includes(s));
  const missing = required.filter((s) => !userSkills.includes(s));
  const matchPercent = required.length
    ? Math.round((matched.length / required.length) * 100)
    : 0;
  return { matched, missing, matchPercent };
}

function generateWeeklyPlan(career, userSkills = []) {
  const roadmap = career.roadmap || [];
  const weeks = [];
  roadmap.forEach((phase, phaseIdx) => {
    const phaseSkills = phase.skills || [];
    const phaseKnown = phaseSkills.filter((s) => userSkills.includes(s));
    const isCompleted =
      phaseKnown.length === phaseSkills.length && phaseSkills.length > 0;
    const weekCount = 8;
    for (let w = 0; w < weekCount; w++) {
      const globalWeek = phaseIdx * weekCount + w + 1;
      const resource = phase.resources[w % phase.resources.length];
      weeks.push({
        week: globalWeek,
        phase: phaseIdx + 1,
        phaseName: phase.title,
        focus: w < 3 ? 'Nazariy' : w < 6 ? 'Amaliy' : 'Loyiha',
        task:
          w < 3
            ? `${phase.title} — nazariy qism. Resurs: ${resource}`
            : w < 6
            ? `${phase.title} — amaliy mashqlar va misollar`
            : `${phase.title} — kichik loyiha va portfolio`,
        isCompleted,
      });
    }
  });
  return weeks.slice(0, 24);
}

// ============================================================
// AI Explanation
// ============================================================
function AIExplanation({ career }) {
  const reasons = career.reasons || [];
  const breakdown = career.score_breakdown || {};
  const items = [
    { label: "RIASEC uyg'unlik", value: breakdown.riasec_fit || 0, max: 100 },
    { label: "Ko'nikmalar moslik", value: breakdown.skills_match || 0, max: 100 },
    { label: "Akademik ko'rsatkich", value: breakdown.academic || 0, max: 13 },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
        <h3 className="text-lg text-[#111827] font-semibold">
          Nima uchun {career.name_uz}?
        </h3>
      </div>
      <p className="text-sm text-[#4B5563] mb-6">
        AI tahlil natijalari — moslik sabablari va ball tarkibi
      </p>

      <div className="space-y-2 mb-6">
        {reasons.length > 0 ? (
          reasons.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg"
            >
              <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#111827] leading-relaxed">{r}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#6B7280]">Tushuntirish ma'lumoti mavjud emas</p>
        )}
      </div>

      <div className="border-t border-[#E5E7EB] pt-4">
        <div className="text-xs font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
          Ball tarkibi
        </div>
        {items.map((item, i) => {
          const pct = Math.min((item.value / item.max) * 100, 100);
          return (
            <div key={i} className="mb-3">
              <div className="flex justify-between mb-1.5">
                <span className="text-sm text-[#111827]">{item.label}</span>
                <span className="text-sm text-[#2563EB] font-medium">
                  {item.value}
                  {item.max === 100 ? '%' : `/${item.max}`}
                </span>
              </div>
              <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================
// Skill Gap Visual
// ============================================================
function SkillGapVisual({ career, userSkills }) {
  const required = career.required_skills || [];
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-[#16A34A]" />
        <h3 className="text-lg text-[#111827] font-semibold">Skill Gap tahlili</h3>
      </div>
      <p className="text-sm text-[#4B5563] mb-6">
        {career.name_uz} uchun kerakli ko'nikmalar holati
      </p>

      <div className="space-y-3">
        {required.map((skill, i) => {
          const has = userSkills.includes(skill);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      has ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                    }`}
                  />
                  <span className="text-sm text-[#111827]">{skill}</span>
                </div>
                <Tag variant={has ? 'success' : 'danger'}>
                  {has ? 'Mavjud' : "O'rganing"}
                </Tag>
              </div>
              <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: has ? '100%' : '15%',
                    background: has ? '#16A34A' : '#FCA5A5',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
        {[
          { label: 'Mavjud', count: career.matched_skills?.length || 0, color: 'text-[#16A34A]' },
          { label: 'Yetishmaydi', count: career.missing_skills?.length || 0, color: 'text-[#DC2626]' },
          { label: 'Moslik', count: `${career.skills_match_percent || 0}%`, color: 'text-[#2563EB]' },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className={`text-xl font-semibold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-[#4B5563]">{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// History Tab
// ============================================================
function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyAPI
      .getHistory()
      .then((res) => setHistory(res.data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!history.length) {
    return (
      <Card className="p-10 text-center">
        <History className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
        <p className="text-[#4B5563]">Hali test tarixi yo'q</p>
      </Card>
    );
  }

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-lg text-[#111827] font-semibold">Test tarixi</h3>
        </div>
        <p className="text-sm text-[#4B5563]">Jami {history.length} ta test natijalari</p>
      </Card>

      {history.length > 1 && (
        <Card className="p-6 mb-6">
          <h4 className="text-sm text-[#4B5563] font-medium mb-4">
            Moslik darajasi o'zgarishi
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={[...history].reverse().map((h, i) => ({
                name: `#${i + 1}`,
                moslik: h.top_career?.score || 0,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#4B5563' }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Moslik']} />
              <Line
                type="monotone"
                dataKey="moslik"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ fill: '#2563EB', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="space-y-3">
        {history.map((item, i) => (
          <Card key={item.id} className="p-5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {i === 0 && <Tag variant="primary">So'nggi</Tag>}
                  <span className="text-xs text-[#4B5563]">
                    {new Date(item.created_at).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {item.top_career && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Star className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-sm font-semibold text-[#111827]">
                      {item.top_career.name_uz}
                    </span>
                    <span className="text-sm font-semibold text-[#2563EB]">
                      {item.top_career.score}%
                    </span>
                  </div>
                )}
                {item.dominant_type && (
                  <div className="mt-1 text-xs text-[#4B5563]">
                    Dominant: {item.dominant_type.name} ({item.dominant_type.score}/10)
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-[#6B7280]">Ko'nikmalar</div>
                <div className="text-lg font-semibold text-[#2563EB]">
                  {item.skills_count}
                </div>
              </div>
            </div>

            {item.riasec_scores && (
              <div className="mt-4 flex gap-1.5">
                {Object.entries(item.riasec_scores).map(([k, v]) => (
                  <div key={k} className="flex-1 text-center">
                    <div className="h-10 flex items-end justify-center">
                      <div
                        className={`w-5 rounded-t-md ${
                          k === item.dominant_type?.code ? 'bg-[#2563EB]' : 'bg-[#E5E7EB]'
                        }`}
                        style={{ height: `${(v / 10) * 40}px`, minHeight: 4 }}
                      />
                    </div>
                    <div className="text-[10px] text-[#4B5563] mt-1">{k}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Jobs Tab
// ============================================================
function JobCard({ job }) {
  return (
    <a
      href={job.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-5 bg-white border border-[#E5E7EB] rounded-lg hover:border-[#2563EB] transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[#111827] mb-1 group-hover:text-[#2563EB] transition-colors line-clamp-2">
            {job.title}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{job.company}</span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
        {job.salary && job.salary !== 'Kelishiladi' ? (
          <span className="flex items-center gap-1 text-[#16A34A] font-medium">
            <DollarSign className="w-3 h-3" /> {job.salary}
          </span>
        ) : (
          <span className="text-[#9CA3AF]">Maosh kelishiladi</span>
        )}
        <span className="flex items-center gap-1 text-[#4B5563]">
          <MapPin className="w-3 h-3" /> {job.location}
        </span>
      </div>
      {job.experience && (
        <div className="text-xs text-[#6B7280] mb-2">{job.experience}</div>
      )}
      {job.description && (
        <p className="text-xs text-[#4B5563] line-clamp-2 mb-3">
          {job.description.slice(0, 150)}
          {job.description.length > 150 ? '...' : ''}
        </p>
      )}
      <div className="flex items-center justify-between">
        {job.employment_type ? <Tag variant="muted">{job.employment_type}</Tag> : <div />}
        <span className="text-xs text-[#9CA3AF]">hh.uz</span>
      </div>
    </a>
  );
}

function JobsTab({ occupationId, careerName }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const loadJobs = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await jobsAPI.getJobs(occupationId, force);
        setJobs(res.data.jobs || []);
        setLastFetch(new Date());
      } catch {
        setError('Vakansiyalarni yuklashda xatolik. Internet aloqasini tekshiring.');
      } finally {
        setLoading(false);
      }
    },
    [occupationId],
  );

  useEffect(() => {
    loadJobs(false);
  }, [loadJobs]);

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-[#7C3AED]" />
              <h3 className="text-lg text-[#111827] font-semibold">
                Siz uchun mos vakansiyalar
              </h3>
            </div>
            <p className="text-sm text-[#4B5563]">
              {careerName} bo'yicha HH.uz dan real vakansiyalar
              {lastFetch && (
                <span className="ml-2 text-[#9CA3AF]">
                  ·{' '}
                  {lastFetch.toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  da yangilangan
                </span>
              )}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => loadJobs(true)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Yuklanmoqda...' : 'Yangilash'}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 mb-4 border-[#FCA5A5]">
          <div className="flex items-center gap-2 text-[#DC2626]">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {loading && jobs.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && !error && (
        <Card className="p-10 text-center">
          <Briefcase className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#4B5563]">
            Hozircha vakansiya topilmadi. "Yangilash" tugmasini bosing.
          </p>
        </Card>
      )}

      {jobs.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <p className="text-center mt-5 text-xs text-[#6B7280]">
            Jami {jobs.length} ta vakansiya · Manba: hh.uz
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================
// Roadmap Tab
// ============================================================
function RoadmapTab({ career, userSkills }) {
  const [phaseFilter, setPhaseFilter] = useState('all');
  const weeks = generateWeeklyPlan(career, userSkills);
  const roadmap = career.roadmap || [];

  const completedPhases = roadmap.filter((p) => {
    const ps = p.skills || [];
    return ps.length > 0 && ps.every((s) => userSkills.includes(s));
  }).length;
  const progressPct = roadmap.length
    ? Math.round((completedPhases / roadmap.length) * 100)
    : 0;

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-[#7C3AED]" />
              <h3 className="text-lg text-[#111827] font-semibold">
                24 haftalik o'quv rejasi
              </h3>
            </div>
            <p className="text-sm text-[#4B5563]">
              {career.name_uz} — sizning skilllaringizga asoslangan
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-[#16A34A]">{progressPct}%</div>
            <div className="text-xs text-[#4B5563]">
              {completedPhases}/{roadmap.length} faza
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#16A34A] rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      {/* Phases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {roadmap.map((phase, i) => {
          const phaseSkills = phase.skills || [];
          const known = phaseSkills.filter((s) => userSkills.includes(s));
          const pct = phaseSkills.length
            ? Math.round((known.length / phaseSkills.length) * 100)
            : 0;
          const isDone = pct === 100 && phaseSkills.length > 0;
          return (
            <Card key={i} className="p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#2563EB] uppercase">
                  {phase.month}
                </span>
                {isDone && <Award className="w-4 h-4 text-[#F59E0B]" />}
              </div>
              <p className="text-sm font-medium text-[#111827] mb-3 leading-relaxed">
                {phase.title}
              </p>
              <div className="h-1 bg-[#F3F4F6] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: isDone ? '#16A34A' : '#2563EB',
                  }}
                />
              </div>
              <div className="text-xs text-[#4B5563]">
                {isDone ? '✓ Tugatildi' : `${known.length}/${phaseSkills.length} skill tayyor`}
              </div>
              {phaseSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {phaseSkills.map((s) => (
                    <Tag key={s} variant={userSkills.includes(s) ? 'success' : 'danger'}>
                      {s}
                    </Tag>
                  ))}
                </div>
              )}

              {/* YouTube video tavsiyalar */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[10px] uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                  <PlayCircle className="w-3 h-3" style={{ color: '#FF0000' }} />
                  Tavsiya etilgan videolar
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(phase.title + ' uzbek tili')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium"
                    style={{
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    🇺🇿 O'zbekcha
                  </a>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(phase.title + ' tutorial')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium"
                    style={{
                      background: 'var(--surface-subtle)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    🇬🇧 English
                  </a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', '1', '2', '3'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setPhaseFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              phaseFilter === f
                ? 'border-[#2563EB] bg-[#2563EB] text-white'
                : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#2563EB]'
            }`}
          >
            {f === 'all' ? 'Barchasi' : `${f}-faza`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {weeks
          .filter((w) => phaseFilter === 'all' || String(w.phase) === phaseFilter)
          .map((w, i) => (
            <Card key={i} className={`p-4 ${w.isCompleted ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#2563EB]">
                  {w.week}-HAFTA
                </span>
                <Tag variant="muted">{w.focus}</Tag>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  w.isCompleted ? 'text-[#6B7280] line-through' : 'text-[#111827]'
                }`}
              >
                {w.task}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-0.5 bg-[#F3F4F6] rounded-full">
                  <div
                    className="h-full bg-[#2563EB] rounded-full"
                    style={{ width: `${(w.week / 24) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#9CA3AF]">
                  {Math.round((w.week / 24) * 100)}%
                </span>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

// ============================================================
// Learning Path Tab
// ============================================================
function LearningPathTab({ career, userSkills }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    predictAPI
      .getLearningPath(career.id, userSkills)
      .then((res) => !cancelled && setData(res.data))
      .catch(() => !cancelled && setError("Ma'lumotni olishda xatolik."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [career.id, userSkills]);

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
        <p className="text-sm text-[#4B5563]">O'quv yo'li tayyorlanmoqda...</p>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-[#DC2626]">
          <AlertCircle className="w-4 h-4" /> {error || "Ma'lumot yo'q"}
        </div>
      </Card>
    );
  }

  const items = data.items || [];
  const allCovered = items.length === 0;

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-[#7C3AED]" />
              <h3 className="text-lg text-[#111827] font-semibold">
                {career.name_uz} bo'yicha o'quv yo'li
              </h3>
            </div>
            <p className="text-sm text-[#4B5563]">
              Yetishmayotgan ko'nikmalar uchun shaxsiylashtirilgan kurslar
            </p>
          </div>
          {!allCovered && (
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-xl font-semibold text-[#7C3AED]">
                  {data.total_skills}
                </div>
                <div className="text-xs text-[#4B5563]">ko'nikma</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-[#2563EB]">
                  ~{data.estimated_months}
                </div>
                <div className="text-xs text-[#4B5563]">oy</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-[#16A34A]">
                  {data.match_percent}%
                </div>
                <div className="text-xs text-[#4B5563]">tayyor</div>
              </div>
            </div>
          )}
        </div>

        {(data.matched_skills || []).length > 0 && (
          <div className="mt-5 pt-5 border-t border-[#E5E7EB]">
            <div className="text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
              Sizda allaqachon bor
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.matched_skills.map((s) => (
                <Tag key={s} variant="success">
                  <CheckCircle className="w-3 h-3" /> {s}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>

      {allCovered && (
        <Card className="p-10 text-center">
          <Award className="w-10 h-10 text-[#16A34A] mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-[#111827] mb-2">
            Tabriklaymiz! Barcha ko'nikmalar mavjud
          </h4>
          <p className="text-sm text-[#4B5563]">
            {career.name_uz} kasbi uchun talab qilinadigan barcha ko'nikmalarga egasiz.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((item, idx) => {
          const diffMap = {
            asoslari: { color: 'text-[#16A34A]', bg: 'bg-[#ECFDF5]', border: 'border-[#BBF7D0]', label: 'Asoslari' },
            "o'rta": { color: 'text-[#D97706]', bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]', label: "O'rta" },
            yuqori: { color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]', border: 'border-[#FECACA]', label: 'Yuqori' },
          };
          const meta = diffMap[item.difficulty] || diffMap["o'rta"];
          return (
            <Card key={item.skill} className="p-5">
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg ${meta.bg} ${meta.color} border ${meta.border} flex items-center justify-center text-xs font-bold flex-shrink-0`}
                  >
                    {item.priority}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#111827]">{item.skill}</div>
                    {item.is_foundational && (
                      <div className="text-xs text-[#16A34A] font-medium mt-0.5">
                        ⭐ Asos ko'nikma
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-md border ${meta.bg} ${meta.color} ${meta.border} whitespace-nowrap`}
                >
                  {meta.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#4B5563] mb-3">
                <Clock className="w-3 h-3" /> ~{item.weeks} hafta
              </div>

              <div className="space-y-2">
                {item.courses.map((c, ci) => (
                  <a
                    key={ci}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:border-[#2563EB] transition-colors"
                  >
                    <PlayCircle className={`w-4 h-4 ${meta.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#111827] truncate">
                        {c.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Globe className="w-3 h-3 text-[#9CA3AF]" />
                        <span className="text-[10px] text-[#4B5563]">{c.platform}</span>
                        {c.lang && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[#7C3AED] font-semibold">
                            {c.lang}
                          </span>
                        )}
                        <Tag variant={c.free ? 'success' : 'warning'}>
                          {c.free ? 'BEPUL' : 'PULLIK'}
                        </Tag>
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-[#9CA3AF]" />
                  </a>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Compare Tab
// ============================================================
function CompareTab({ predictions, selectedCareer, setSelectedCareer, userSkills }) {
  const [compareIdx, setCompareIdx] = useState(predictions.length > 1 ? 1 : 0);

  const rows = [
    { label: 'Moslik darajasi', key: 'score', suffix: '%', type: 'number' },
    { label: "O'rtacha maosh", key: 'avg_salary', suffix: '', type: 'string' },
    { label: "Yillik o'sish", key: 'growth', suffix: '', type: 'string' },
    { label: 'Bozor talabi', key: 'demand', suffix: '', type: 'string' },
    { label: 'Skill moslik', key: 'skills_match_percent', suffix: '%', type: 'number' },
  ];

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GitCompare className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-lg text-[#111827] font-semibold">Kasblarni taqqoslash</h3>
        </div>
        <p className="text-sm text-[#4B5563] mb-4">Ikkita kasbni yonma-yon solishtiring</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#4B5563] block mb-1">1-kasb</label>
            <select
              value={selectedCareer}
              onChange={(e) => setSelectedCareer(+e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
            >
              {predictions.map((p, i) => (
                <option key={i} value={i}>
                  {p.name_uz}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#4B5563] block mb-1">2-kasb</label>
            <select
              value={compareIdx}
              onChange={(e) => setCompareIdx(+e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
            >
              {predictions.map((p, i) => (
                <option key={i} value={i}>
                  {p.name_uz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="space-y-3 mb-6">
        {rows.map((row, i) => {
          const a = predictions[selectedCareer];
          const b = predictions[compareIdx];
          const aVal = a[row.key];
          const bVal = b[row.key];
          const aNum = row.type === 'number' ? aVal : parseInt(String(aVal).replace(/\D/g, '')) || 0;
          const bNum = row.type === 'number' ? bVal : parseInt(String(bVal).replace(/\D/g, '')) || 0;
          const max = Math.max(aNum, bNum) || 100;
          return (
            <Card key={i} className="p-5">
              <div className="text-sm text-[#4B5563] mb-3 font-medium">{row.label}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[[a, aVal, aNum, '#2563EB'], [b, bVal, bNum, '#7C3AED']].map(
                  ([occ, val, num, color], j) => (
                    <div key={j}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-medium text-[#111827]">{occ.name_uz}</span>
                        <span className="text-sm font-semibold" style={{ color }}>
                          {val}
                          {row.suffix}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min((num / max) * 100, 100)}%`,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h4 className="text-sm font-semibold text-[#111827] mb-4">
          Ko'nikmalar taqqoslash
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[predictions[selectedCareer], predictions[compareIdx]].map((occ, j) => {
            const g = analyzeSkillsGap(userSkills, occ);
            return (
              <div key={j}>
                <div
                  className="text-sm font-semibold mb-3"
                  style={{ color: j === 0 ? '#2563EB' : '#7C3AED' }}
                >
                  {occ.name_uz} — {g.matchPercent}%
                </div>
                {(occ.required_skills || []).map((s) => {
                  const has = userSkills.includes(s);
                  return (
                    <div key={s} className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${has ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`}
                      />
                      <span
                        className={`text-sm ${
                          has ? 'text-[#111827]' : 'text-[#4B5563]'
                        }`}
                      >
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// Main Dashboard
// ============================================================
export default function Dashboard({
  predictions,
  riasecScores,
  userSkills,
  authUser,
  onReset,
  onBack,
  onMyGoal,
}) {
  const [selectedCareer, setSelectedCareer] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [savingTarget, setSavingTarget] = useState(false);
  const [savedTargetId, setSavedTargetId] = useState(authUser?.target_occupation_id ?? null);

  const career = predictions[selectedCareer];
  const gap = analyzeSkillsGap(userSkills, career);

  const riasecData = Object.entries(riasecScores).map(([k, v]) => ({
    category: CATEGORY_NAMES[k] || k,
    value: v,
    fullMark: 10,
  }));

  const tabs = [
    { id: 'overview', label: 'Umumiy', icon: BarChart3 },
    { id: 'explain', label: 'Nima uchun?', icon: Lightbulb },
    { id: 'skills', label: "Ko'nikmalar", icon: Target },
    { id: 'learning', label: "O'quv yo'li", icon: GraduationCap },
    { id: 'roadmap', label: "Yo'l xaritasi", icon: BookOpen },
    { id: 'compare', label: 'Taqqoslash', icon: GitCompare },
    { id: 'history', label: 'Tarix', icon: History },
    { id: 'resume', label: 'Rezume', icon: Upload },
    { id: 'jobs', label: 'Vakansiyalar', icon: Briefcase },
  ];

  const handleShare = () => {
    const text = `Kasbim natijalarim: #1 ${career.name_uz} (${career.score}% moslik) · ${career.avg_salary}/yil`;
    if (navigator.share) {
      navigator.share({ title: 'Kasbim natijalarim', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Natija nusxalandi!');
    }
  };

  const handleSaveTarget = async () => {
    if (career.id == null) return;
    setSavingTarget(true);
    try {
      await api.patch('/users/me', { target_occupation_id: career.id });
      setSavedTargetId(career.id);
      // Saqlangandan so'ng — Maqsadim sahifasiga yo'naltirish
      if (onMyGoal) {
        setTimeout(() => onMyGoal(), 800);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Saqlashda xato');
    } finally {
      setSavingTarget(false);
    }
  };

  const isTargetSaved = savedTargetId === career.id;

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {onBack && (
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
              Ma'lumotlarga
            </Button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl text-[#111827] mb-1 font-semibold">
            Sizning natijalaringiz
          </h1>
          <p className="text-[#4B5563]">Eng mos kasblar va batafsil tahlil</p>
        </div>

        {/* Top 3 cards — horizontal */}
        <div className="space-y-3 mb-4">
          {predictions.map((pred, i) => {
            const isActive = selectedCareer === i;
            return (
              <div
                key={i}
                onClick={() => setSelectedCareer(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCareer(i);
                  }
                }}
                className="relative p-6 cursor-pointer rounded-xl border-2 transition-all"
                style={{
                  background: isActive ? 'var(--accent-soft)' : 'var(--surface)',
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  boxShadow: isActive ? '0 4px 16px rgba(59,130,246,0.15)' : 'none',
                }}
              >
                {/* Tanlangan badge */}
                {isActive && (
                  <div
                    className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                    style={{
                      background: 'var(--accent)',
                      color: '#FFFFFF',
                    }}
                  >
                    <CheckCircle className="w-3 h-3" /> Tanlangan
                  </div>
                )}

                {/* Chap-accent stripe */}
                {isActive && (
                  <div
                    className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}

                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0"
                      style={{
                        background: isActive ? 'var(--accent)' : 'var(--surface-subtle)',
                        color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                        border: isActive ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg text-[#111827] font-semibold">
                          {pred.name_uz || pred.nameUz}
                        </h3>
                        <span className="text-sm text-[#6B7280]">{pred.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="flex items-center gap-1.5 text-[#4B5563]">
                          <DollarSign className="w-4 h-4" />
                          {pred.avg_salary || pred.avgSalary}
                        </span>
                        {pred.growth && (
                          <span className="flex items-center gap-1.5 text-[#16A34A] font-medium">
                            <TrendingUp className="w-4 h-4" />
                            {pred.growth}
                          </span>
                        )}
                        {pred.demand && (
                          <Tag variant={demandVariant(pred.demand)}>
                            <Flame className="w-3 h-3" /> {pred.demand}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-[#111827] font-semibold mb-0.5">
                      {pred.score}%
                    </div>
                    <div className="text-xs text-[#4B5563]">Moslik</div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pred.score}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Hint text */}
        <div className="flex items-center gap-2 mb-8 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Target className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          Pastdagi ma'lumotlar tanlangan kasb uchun ko'rsatiladi. Boshqa kasbni tanlash uchun kartani bosing.
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-[#E5E7EB]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#4B5563] hover:bg-[#F9FAFB]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* === Overview === */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-sm font-semibold text-[#111827] mb-1">RIASEC Profilingiz</h4>
              <p className="text-xs text-[#4B5563] mb-4">Holland Code natijalari</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={riasecData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#4B5563' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h4 className="text-sm font-semibold text-[#111827] mb-1">Kasb ehtimolliklari</h4>
              <p className="text-xs text-[#4B5563] mb-4">RandomForest bashorat</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={predictions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#4B5563' }} />
                  <YAxis type="category" dataKey="name_uz" tick={{ fontSize: 11, fill: '#111827' }} width={120} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Moslik']} />
                  <Bar dataKey="score" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-[#7C3AED]" />
                    <h4 className="text-lg text-[#111827] font-semibold">
                      {career.name_uz || career.nameUz} haqida
                    </h4>
                  </div>
                  <p className="text-sm text-[#4B5563] leading-relaxed mb-3">
                    {career.description_uz || career.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {career.category_uz && (
                      <Tag variant="primary">📂 {career.category_uz}</Tag>
                    )}
                    {career.age_range && (
                      <Tag variant="success">
                        🎂 {career.age_range[0]}–{career.age_range[1]} yosh
                      </Tag>
                    )}
                  </div>

                  {career.subjects?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">
                        📚 Kerakli fanlar
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {career.subjects.slice(0, 6).map((s, i) => (
                          <Tag key={i} variant="secondary">{s}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {career.interests?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">
                        ❤️ Qiziqishlar
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {career.interests.slice(0, 5).map((it, i) => (
                          <Tag key={i} variant="muted">{it}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {career.reasons?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-[#4B5563] mb-2 font-medium">
                        Moslik sabablari
                      </div>
                      {career.reasons.slice(0, 2).map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1">
                          <ChevronRight className="w-3 h-3 text-[#16A34A] mt-1 flex-shrink-0" />
                          <span className="text-sm text-[#111827]">{r}</span>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setActiveTab('explain')}
                        className="mt-2 text-sm text-[#2563EB] hover:underline flex items-center gap-1"
                      >
                        <Lightbulb className="w-3 h-3" /> Batafsil tushuntirish →
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 min-w-[200px]">
                  {[
                    { icon: DollarSign, label: "O'rtacha maosh", val: career.avg_salary, color: 'text-[#16A34A]' },
                    { icon: TrendingUp, label: "Yillik o'sish", val: career.growth || 'N/A', color: 'text-[#7C3AED]' },
                    { icon: Flame, label: 'Bozor talabi', val: career.demand || "O'rta", color: 'text-[#DC2626]' },
                    { icon: Target, label: 'Moslik', val: `${career.score}%`, color: 'text-[#2563EB]' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-[#4B5563]">{item.label}</div>
                        <div className={`text-sm font-semibold ${item.color}`}>
                          {item.val}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* === Explain === */}
        {activeTab === 'explain' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIExplanation career={career} />
            <SkillGapVisual career={career} userSkills={userSkills} />
          </div>
        )}

        {/* === Skills === */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-sm font-semibold text-[#111827] mb-1">
                Ko'nikmalar moslik tahlili
              </h4>
              <p className="text-xs text-[#4B5563] mb-4">
                {career.name_uz} uchun Skills Gap
              </p>
              <div className="flex justify-center">
                <div className="relative w-44 h-44">
                  <ResponsiveContainer width={176} height={176}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Mavjud', value: gap.matched.length || 0.01 },
                          { name: 'Yetishmaydi', value: gap.missing.length || 0.01 },
                        ]}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#2563EB" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="text-3xl font-semibold text-[#2563EB]">
                      {gap.matchPercent}%
                    </div>
                    <div className="text-xs text-[#4B5563]">moslik</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="text-sm font-semibold text-[#111827] mb-4">Batafsil tahlil</h4>
              <div className="mb-5">
                <div className="flex items-center gap-1.5 text-[#16A34A] text-sm font-medium mb-2">
                  <CheckCircle className="w-4 h-4" /> Mavjud ({gap.matched.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gap.matched.length > 0 ? (
                    gap.matched.map((s) => (
                      <Tag key={s} variant="success">
                        {s}
                      </Tag>
                    ))
                  ) : (
                    <p className="text-xs text-[#6B7280]">Hali yo'q</p>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[#D97706] text-sm font-medium mb-2">
                  <TrendingUp className="w-4 h-4" /> Yetishmaydi ({gap.missing.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gap.missing.map((s) => (
                    <Tag key={s} variant="warning">
                      {s}
                    </Tag>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h4 className="text-sm font-semibold text-[#111827] mb-4">
                Talab qilinadigan barcha ko'nikmalar
              </h4>
              {(career.required_skills || career.requiredSkills || []).map((skill, i) => {
                const has = userSkills.includes(skill);
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-[#111827]">{skill}</span>
                      <span
                        className={`text-xs font-semibold ${has ? 'text-[#16A34A]' : 'text-[#D97706]'}`}
                      >
                        {has ? 'Mavjud ✓' : "O'rganing →"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: has ? '100%' : '18%',
                          background: has ? '#16A34A' : '#FCD34D',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {activeTab === 'learning' && <LearningPathTab career={career} userSkills={userSkills} />}
        {activeTab === 'roadmap' && <RoadmapTab career={career} userSkills={userSkills} />}
        {activeTab === 'compare' && (
          <CompareTab
            predictions={predictions}
            selectedCareer={selectedCareer}
            setSelectedCareer={setSelectedCareer}
            userSkills={userSkills}
          />
        )}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'resume' && <ResumeUpload selectedCareer={career} />}
        {activeTab === 'jobs' && (
          <JobsTab
            occupationId={career.id ?? selectedCareer}
            careerName={career.name_uz || career.nameUz}
          />
        )}

        {/* Closing CTA — sahifa oxiri */}
        <div className="mt-12">
          <Card
            className="p-6 sm:p-10 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--surface) 100%)',
            }}
          >
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <div
                className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                <Star className="w-7 h-7 text-white" />
              </div>

              <h2
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
              >
                Sizning eng mos kasbingiz
              </h2>

              <div
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{ color: 'var(--accent)' }}
              >
                {career.name_uz || career.nameUz}
              </div>

              <div className="flex items-center justify-center gap-3 mb-6 flex-wrap text-sm" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                  {career.score}% moslik
                </span>
                {career.avg_salary && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {career.avg_salary}/yil
                    </span>
                  </>
                )}
                {career.demand && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      {career.demand} talab
                    </span>
                  </>
                )}
              </div>

              <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                Bu kasbni o'z maqsadingiz qilib belgilang — biz progresingizni kuzatib boramiz va
                kerakli ko'nikmalarni rivojlantirishda yordam beramiz.
              </p>

              {/* Asosiy harakat — maqsad qilib saqlash */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                {!isTargetSaved ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSaveTarget}
                    disabled={savingTarget || career.id == null}
                  >
                    {savingTarget ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Star className="w-4 h-4" /> Maqsad qilib saqlash
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={onMyGoal}
                    disabled={!onMyGoal}
                  >
                    <CheckCircle className="w-4 h-4" /> Maqsadimga o'tish
                  </Button>
                )}
                <Button variant="ghost" size="lg" onClick={handleShare}>
                  <Share2 className="w-4 h-4" /> Ulashish
                </Button>
                <Button variant="ghost" size="lg" onClick={onReset}>
                  <RotateCcw className="w-4 h-4" /> Qayta test
                </Button>
              </div>

              {isTargetSaved && (
                <div
                  className="mb-4 p-3 rounded-lg text-sm flex items-start gap-2 text-left"
                  style={{
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    color: 'var(--success)',
                  }}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Saqlandi!</strong> Maqsadingiz har doim navbar'dagi
                    "Maqsadim" tugmasi orqali ochiq turadi — yo'l xaritasi, videolar va
                    vakansiyalar bilan birga.
                  </span>
                </div>
              )}

              {/* Keyingi qadamlar */}
              <div
                className="pt-6 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  💡 Keyingi qadamlar
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('learning');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3 rounded-lg border text-left transition-colors"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <GraduationCap className="w-5 h-5 mb-2" style={{ color: 'var(--accent)' }} />
                    <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      O'quv yo'lini ko'rish
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Tavsiya etilgan kurslar
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('roadmap');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3 rounded-lg border text-left transition-colors"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <BookOpen className="w-5 h-5 mb-2" style={{ color: 'var(--accent)' }} />
                    <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      Yo'l xaritasi
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      6 oylik reja
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('jobs');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3 rounded-lg border text-left transition-colors"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <Briefcase className="w-5 h-5 mb-2" style={{ color: 'var(--accent)' }} />
                    <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      Vakansiyalar
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Hozirgi ish o'rinlari
                    </div>
                  </button>
                </div>
              </div>

              {/* Tarix izohi */}
              <div
                className="mt-6 p-3 rounded-lg text-xs flex items-start gap-2 text-left"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <History className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <span>
                  <strong style={{ color: 'var(--text)' }}>Tarixda </strong>
                  ushbu testning <strong style={{ color: 'var(--text)' }}>#1 mos kasbi</strong>
                  ({predictions[0]?.name_uz}, {predictions[0]?.score}%) saqlangan —
                  uni avatar dropdown'idagi <strong style={{ color: 'var(--text)' }}>"Tarix"</strong> bo'limidan ko'rishingiz mumkin.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
