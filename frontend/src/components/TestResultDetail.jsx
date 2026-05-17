/**
 * TestResultDetail — boy va batafsil test natijasi paneli.
 * History ichida (ochilganda) va ResultsPage'da ishlatiladi.
 */

import { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const RIASEC_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];


export default function TestResultDetail({
  recommendations = [],
  riasecScores = {},
  interests = [],
  subjects = [],
  compact = false,
}) {
  const { t } = useTranslation();

  const riasecSorted = RIASEC_ORDER.map((k) => ({
    key: k,
    value: Number(riasecScores[k] || 0),
  })).sort((a, b) => b.value - a.value);

  const dominant = riasecSorted[0];
  const dominantValue = dominant?.value || 0;

  // Top 5 kategoriya statistikasi
  const top5 = recommendations.slice(0, 5);
  const categoryCounts = {};
  top5.forEach((r) => {
    const c = r.category || 'unknown';
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0];
  const topCategoryPercent = topCategory
    ? Math.round((topCategory[1] / top5.length) * 100)
    : 0;

  const avgScore = top5.length
    ? Math.round(
        (top5.reduce((sum, r) => sum + (r.score || 0), 0) / top5.length) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. RIASEC vizualizatsiya */}
      {riasecSorted.some((r) => r.value > 0) && (
        <Section title={t('detail.riasec_title')}>
          <div className="space-y-2.5">
            {RIASEC_ORDER.map((key) => {
              const value = Number(riasecScores[key] || 0);
              const percent = Math.min(100, (value / 10) * 100);
              const isDominant = key === dominant?.key;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div
                    className="w-32 text-xs flex-shrink-0"
                    style={{
                      color: isDominant ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: isDominant ? 700 : 500,
                    }}
                  >
                    {key} · {t(`riasec.cat.${key}.name`)}
                  </div>
                  <div
                    className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        background: 'var(--text)',
                        opacity: isDominant ? 1 : 0.5,
                      }}
                    />
                  </div>
                  <div
                    className="w-10 text-right text-sm font-mono"
                    style={{
                      color: isDominant ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: isDominant ? 700 : 400,
                    }}
                  >
                    {value.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* 2. Dominant tip tavsifi */}
      {dominant && dominantValue > 0 && (
        <Section title={t('detail.dominant_title')}>
          <div
            className="p-4 rounded-lg"
            style={{ background: 'var(--bg-hover)' }}
          >
            <div className="flex items-baseline gap-3 mb-2 flex-wrap">
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                {t(`riasec.cat.${dominant.key}.name`)}
              </div>
              <div className="text-xs uppercase font-semibold" style={{ color: 'var(--text-faint)' }}>
                {dominant.key} · {dominantValue.toFixed(1)}/10
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t(`detail.riasec_desc.${dominant.key}`)}
            </p>
          </div>
        </Section>
      )}

      {/* 3. Statistika */}
      {top5.length > 0 && (
        <Section title={t('detail.stats_title')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <StatBox label={t('detail.stat.tests_count')} value={top5.length} />
            <StatBox label={t('detail.stat.avg_match')} value={`${avgScore}%`} />
            {topCategory && (
              <StatBox
                label={t('detail.stat.top_category')}
                value={`${topCategoryPercent}%`}
                sub={topCategory[0]}
              />
            )}
          </div>
        </Section>
      )}

      {/* 4. Tavsiya kasblar (explanation bilan) */}
      {top5.length > 0 && (
        <Section title={t('detail.recommendations_title')}>
          <div className="space-y-3">
            {top5.map((r, i) => (
              <RecommendationCard key={i} rank={i + 1} career={r} t={t} />
            ))}
          </div>
        </Section>
      )}

      {/* 5. Profile data */}
      {(interests.length > 0 || subjects.length > 0) && !compact && (
        <Section title={t('detail.profile_title')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {interests.length > 0 && (
              <div>
                <div className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
                  {t('history.interests')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((it) => (
                    <span
                      key={it}
                      className="px-2.5 py-1 rounded-md text-xs"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {subjects.length > 0 && (
              <div>
                <div className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
                  {t('history.subjects')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-md text-xs"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}


function Section({ title, children }) {
  return (
    <div>
      <div className="text-xs uppercase font-semibold mb-3" style={{ color: 'var(--text-faint)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}


function StatBox({ label, value, sub }) {
  return (
    <div
      className="p-3 rounded-lg text-center"
      style={{ background: 'var(--bg-hover)' }}
    >
      <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}


function RecommendationCard({ rank, career, t }) {
  const [open, setOpen] = useState(false);
  const percent = Math.round((career.score || 0) * 100);
  const hasFullData = career.description_uz || career.required_skills?.length || career.roadmap?.length;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-hover)' }}
    >
      {/* Header (always visible, clickable to expand) */}
      <button
        onClick={() => hasFullData && setOpen(!open)}
        className={`w-full p-4 text-left ${hasFullData ? 'transition-opacity hover:opacity-90 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold leading-tight" style={{ color: 'var(--text)' }}>
              {career.name_uz || career.name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
              {career.category}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              {percent}%
            </div>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {t('detail.match')}
            </div>
          </div>
        </div>

        {/* Confidence bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden mb-3"
          style={{ background: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${percent}%`, background: 'var(--text)' }}
          />
        </div>

        {/* Why match */}
        {career.explanation && career.explanation.length > 0 && (
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-faint)' }}>
              {t('history.why_match')}
            </div>
            <ul className="space-y-1">
              {career.explanation.map((ex, j) => (
                <li key={j} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  · {ex}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expand hint */}
        {hasFullData && (
          <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            {open ? t('detail.collapse') : t('detail.show_more')}
            <span
              className="transition-transform"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▾
            </span>
          </div>
        )}
      </button>

      {/* Expanded full details */}
      {open && hasFullData && (
        <div
          className="px-4 pb-4 border-t space-y-4"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Description */}
          {career.description_uz && (
            <div className="pt-4">
              <div className="text-xs uppercase font-semibold mb-1.5" style={{ color: 'var(--text-faint)' }}>
                {t('detail.description')}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {career.description_uz}
              </p>
            </div>
          )}

          {/* Salary, demand, growth */}
          {(career.avg_salary || career.demand || career.growth) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {career.avg_salary && (
                <InfoBox label={t('detail.salary')} value={career.avg_salary} />
              )}
              {career.demand && (
                <InfoBox label={t('detail.demand')} value={career.demand} />
              )}
              {career.growth && (
                <InfoBox label={t('detail.growth')} value={career.growth} />
              )}
            </div>
          )}

          {/* Required skills */}
          {career.required_skills?.length > 0 && (
            <div>
              <div className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
                {t('detail.required_skills')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {career.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md text-xs"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Roadmap — 6 month learning plan */}
          {career.roadmap?.length > 0 && (
            <div>
              <div className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
                {t('detail.roadmap')}
              </div>
              <div className="space-y-2">
                {career.roadmap.map((phase, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-faint)' }}>
                        {phase.month}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {phase.title}
                      </span>
                    </div>
                    {phase.skills?.length > 0 && (
                      <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>{t('detail.skills_to_learn')}:</strong>{' '}
                        {phase.skills.join(', ')}
                      </div>
                    )}
                    {phase.resources?.length > 0 && (
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>{t('detail.resources')}:</strong>
                        <ul className="mt-1 ml-3 space-y-0.5">
                          {phase.resources.map((res, j) => (
                            <li key={j}>· {res}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function InfoBox({ label, value }) {
  return (
    <div
      className="p-3 rounded-lg"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>
        {label}
      </div>
      <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}
