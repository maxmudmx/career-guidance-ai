import { useEffect, useState } from 'react';
import { Button, Card } from '../components/ui';
import { recommendAPI } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';
import TestResultDetail from '../components/TestResultDetail';

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
          <TestResultDetail
            recommendations={results}
            riasecScores={riasecScores}
            interests={academicData?.interests || []}
            subjects={academicData?.subjects || []}
          />
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
