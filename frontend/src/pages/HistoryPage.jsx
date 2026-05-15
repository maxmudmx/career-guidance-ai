import { useEffect, useState } from 'react';
import {
  History as HistoryIcon, Star, Briefcase, ChevronDown,
  Trophy, GraduationCap, Calendar, DollarSign, Flame, Target,
  CheckCircle, XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Card, Tag } from '../components/ui';
import PageHeader from '../components/PageHeader';
import { historyAPI } from '../services/api';

// RIASEC standart tartibi
const RIASEC_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];
const RIASEC_LABELS = {
  R: 'Realistik',
  I: 'Tadqiqotchi',
  A: 'Ijodkor',
  S: 'Ijtimoiy',
  E: 'Tadbirkor',
  C: 'Konvensional',
};

export default function HistoryPage({ onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  useEffect(() => {
    historyAPI
      .getHistory()
      .then((res) => setHistory(res.data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Test tarixi"
          subtitle={
            loading
              ? 'Yuklanmoqda...'
              : history.length
                ? `Jami ${history.length} ta test natijalari`
                : "Hali test o'tkazmagansiz"
          }
          onBack={onBack}
          icon={HistoryIcon}
        />

        {loading ? (
          <div className="text-center py-16">
            <div
              className="w-10 h-10 mx-auto rounded-full border-[3px] border-t-transparent animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
            />
          </div>
        ) : !history.length ? (
          <Card className="p-10 text-center">
            <HistoryIcon
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: 'var(--text-faint)' }}
            />
            <p style={{ color: 'var(--text-muted)' }}>
              Hali test tarixi yo'q. Test boshlash orqali ilk natijangizni oling.
            </p>
          </Card>
        ) : (
          <>
            {/* RIASEC legenda */}
            <Card className="p-4 mb-4">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                RIASEC tiplari
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {RIASEC_ORDER.map((k) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                      }}
                    >
                      {k}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text)' }}>
                      {RIASEC_LABELS[k]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {history.length > 1 && (
              <Card className="p-6 mb-4">
                <h4
                  className="text-sm font-medium mb-4 flex items-center gap-2"
                  style={{ color: 'var(--text)' }}
                >
                  <HistoryIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  Moslik darajasi o'zgarishi
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={[...history].reverse().map((h, i) => ({
                      name: `#${i + 1}`,
                      moslik: h.top_career?.score || 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                      formatter={(v) => [`${v}%`, 'Moslik']}
                    />
                    <Line
                      type="monotone"
                      dataKey="moslik"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--accent)', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            <div className="space-y-3">
              {history.map((item, i) => {
                const isOpen = expandedId === item.id;
                return (
                <Card key={item.id} className="p-0 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="w-full text-left p-5 transition-colors"
                    style={{ background: isOpen ? 'var(--bg-hover)' : 'transparent' }}
                    onMouseEnter={(e) => {
                      if (!isOpen) e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isOpen) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {i === 0 && <Tag variant="primary">So'nggi</Tag>}
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(item.created_at).toLocaleString('uz-UZ', {
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
                          <Star
                            className="w-4 h-4"
                            style={{ color: 'var(--warning, #F59E0B)' }}
                          />
                          <span
                            className="text-sm font-semibold"
                            style={{ color: 'var(--text)' }}
                          >
                            {item.top_career.name_uz}
                          </span>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: 'var(--accent)' }}
                          >
                            {item.top_career.score}%
                          </span>
                        </div>
                      )}

                      {item.dominant_type && (
                        <div
                          className="mt-1 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Dominant: {item.dominant_type.name} (
                          {item.dominant_type.score}/10)
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Ko'nikmalar
                        </div>
                        <div
                          className="text-lg font-semibold"
                          style={{ color: 'var(--accent)' }}
                        >
                          {item.skills_count}
                        </div>
                      </div>
                      <ChevronDown
                        className="w-5 h-5 mt-1 transition-transform"
                        style={{
                          color: 'var(--text-faint)',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </div>
                  </div>

                  {item.riasec_scores && (
                    <div className="mt-4 flex gap-2">
                      {RIASEC_ORDER.filter((k) => k in item.riasec_scores).map((k) => {
                        const v = item.riasec_scores[k];
                        const isDominant = k === item.dominant_type?.code;
                        return (
                          <div
                            key={k}
                            className="flex-1 text-center"
                            title={`${RIASEC_LABELS[k]}: ${v}/10`}
                          >
                            <div className="text-[10px] font-mono font-semibold mb-1"
                              style={{ color: isDominant ? 'var(--accent)' : 'var(--text-muted)' }}
                            >
                              {v}
                            </div>
                            <div className="h-10 flex items-end justify-center">
                              <div
                                className="w-full max-w-[28px] rounded-t-md transition-all"
                                style={{
                                  height: `${(v / 10) * 40}px`,
                                  minHeight: 4,
                                  background: isDominant
                                    ? 'var(--accent)'
                                    : 'var(--surface-subtle)',
                                }}
                              />
                            </div>
                            <div
                              className="text-[10px] mt-1 font-semibold"
                              style={{ color: isDominant ? 'var(--accent)' : 'var(--text)' }}
                            >
                              {k}
                            </div>
                            <div
                              className="text-[9px] leading-tight"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {RIASEC_LABELS[k]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </button>

                  {/* Expand qism — bosilganda */}
                  {isOpen && (
                    <div
                      className="px-5 pb-5 pt-3 border-t space-y-5"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {/* Top kasblar */}
                      {item.top_careers?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            <Trophy className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                            Eng mos kasblar
                          </div>
                          <div className="space-y-2">
                            {item.top_careers.map((c, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg border flex items-center gap-3"
                                style={{
                                  background: idx === 0 ? 'var(--accent-soft)' : 'var(--bg)',
                                  borderColor: idx === 0 ? 'var(--accent-border)' : 'var(--border)',
                                }}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{
                                    background: idx === 0 ? 'var(--accent)' : 'var(--surface-subtle)',
                                    color: idx === 0 ? '#FFF' : 'var(--text-muted)',
                                  }}
                                >
                                  #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                                    {c.name_uz || c.name}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs flex-wrap mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {c.avg_salary && (
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> {c.avg_salary}
                                      </span>
                                    )}
                                    {c.demand && (
                                      <span className="flex items-center gap-1">
                                        <Flame className="w-3 h-3" /> {c.demand}
                                      </span>
                                    )}
                                    {c.category_uz && <span>{c.category_uz}</span>}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-base font-bold" style={{ color: idx === 0 ? 'var(--accent)' : 'var(--text)' }}>
                                    {c.score}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Akademik ma'lumotlar */}
                      {item.academic_data && Object.keys(item.academic_data).length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            <GraduationCap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                            Akademik ma'lumotlar
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(item.academic_data).filter(([k, v]) =>
                              k !== 'skills' && k !== 'interests' && k !== 'subjects' && k !== 'skill_levels' &&
                              v != null && v !== ''
                            ).map(([k, v]) => (
                              <div
                                key={k}
                                className="p-2.5 rounded-lg border"
                                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                              >
                                <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
                                  {k === 'gpa' ? 'GPA'
                                    : k === 'age' ? 'Yosh'
                                    : k === 'analytical' ? 'Analitik'
                                    : k === 'communication' ? 'Kommunikatsiya'
                                    : k.replace(/_/g, ' ')}
                                </div>
                                <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                  {typeof v === 'number' ? v : String(v)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ko'nikmalar */}
                      {item.user_skills?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                            Kiritilgan ko'nikmalar ({item.user_skills.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.user_skills.map((s) => (
                              <Tag key={s} variant="primary">{s}</Tag>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills gap */}
                      {item.skills_gap && (item.skills_gap.matched?.length > 0 || item.skills_gap.missing?.length > 0) && (
                        <div>
                          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                            Ko'nikmalar tahlili
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {item.skills_gap.matched?.length > 0 && (
                              <div
                                className="p-3 rounded-lg border"
                                style={{
                                  background: 'var(--success-bg)',
                                  borderColor: 'var(--success-border)',
                                }}
                              >
                                <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: 'var(--success)' }}>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Mavjud ({item.skills_gap.matched.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.skills_gap.matched.map((s) => (
                                    <Tag key={s} variant="success">{s}</Tag>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.skills_gap.missing?.length > 0 && (
                              <div
                                className="p-3 rounded-lg border"
                                style={{
                                  background: 'var(--error-bg)',
                                  borderColor: 'var(--error-border)',
                                }}
                              >
                                <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: 'var(--error)' }}>
                                  <XCircle className="w-3.5 h-3.5" />
                                  Yetishmayotgan ({item.skills_gap.missing.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.skills_gap.missing.map((s) => (
                                    <Tag key={s} variant="danger">{s}</Tag>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
