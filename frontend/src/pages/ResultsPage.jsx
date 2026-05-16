import { useEffect, useState } from 'react';
import { Button, Card } from '../components/ui';
import { recommendAPI } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';

export default function ResultsPage({ riasecScores, academicData, onBack, onRetake }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [method, setMethod] = useState('');
  const [totalCareers, setTotalCareers] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const profile = {
      riasec_scores: riasecScores,
      interests: academicData?.interests || [],
      subjects: academicData?.subjects || [],
      top_k: 5,
    };

    recommendAPI
      .recommend(profile)
      .then((res) => {
        if (cancelled) return;
        setResults(res.data?.recommendations || []);
        setMethod(res.data?.method || '');
        setTotalCareers(res.data?.total_careers || 0);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err?.response?.data?.detail || t('common.error');
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [riasecScores, academicData]);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            {t('results.title')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('results.subtitle_prefix')} ({totalCareers || '…'} {t('results.subtitle_suffix')})
          </p>
          {method && (
            <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-faint)' }}>
              {t('results.algorithm_label')} {method}
            </p>
          )}
        </div>

        {loading && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('results.loading')}
            </p>
          </div>
        )}

        {!loading && error && (
          <Card className="p-6 text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>{error}</p>
            <Button variant="primary" onClick={onRetake}>
              {t('results.btn.retry')}
            </Button>
          </Card>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-4">
            {results.map((r, i) => (
              <CareerResultCard key={r.id} rank={i + 1} career={r} />
            ))}
          </div>
        )}

        {!loading && (
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" onClick={onBack}>
              {t('results.btn.back')}
            </Button>
            <Button variant="primary" onClick={onRetake}>
              {t('results.btn.retake')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CareerResultCard({ rank, career }) {
  const { t } = useTranslation();
  const confidence = Math.round(career.score * 100);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-faint)' }}
        >
          #{rank}  ·  {career.category}
        </span>
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
        {career.name_uz}
      </h3>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-muted)' }}>{t('results.match')}</span>
          <span className="font-bold" style={{ color: 'var(--accent)' }}>{confidence}%</span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-hover)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${confidence}%`,
              background: 'var(--text)',
            }}
          />
        </div>
      </div>

      {career.explanation?.length > 0 && (
        <ul className="space-y-1 mt-2">
          {career.explanation.map((ex, idx) => (
            <li
              key={idx}
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              · {ex}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
