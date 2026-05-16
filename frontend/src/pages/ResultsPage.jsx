import { useEffect, useState } from 'react';
import {
  Brain, Sparkles, ArrowLeft, RotateCcw, TrendingUp, Award, Loader2,
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import { recommendAPI } from '../services/api';

/**
 * Top-5 kasb tavsiya sahifasi.
 * Backend ML recommender (Content-Based) chaqiriladi.
 *
 * Props:
 *   - riasecScores  — {R,I,A,S,E,C} 0-10
 *   - academicData  — {age, gpa, interests[], subjects[], skill_levels{}}
 *   - onBack        — orqaga qaytish callback
 *   - onRetake      — testni qaytadan topshirish
 */
export default function ResultsPage({ riasecScores, academicData, onBack, onRetake }) {
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
        const msg = err?.response?.data?.detail || 'Xatolik yuz berdi';
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
        {/* Sarlavha */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--accent)' }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Sizga eng mos kasblar
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            ML Recommender System tavsiyalari ({totalCareers || '…'} kasbdan top 5)
          </p>
          {method && (
            <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-faint)' }}>
              Algoritm: {method}
            </p>
          )}
        </div>

        {/* Yuklanmoqda */}
        {loading && (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              ML model tavsiyalarni hisoblamoqda...
            </p>
          </div>
        )}

        {/* Xato */}
        {!loading && error && (
          <Card className="p-6 text-center">
            <p className="text-sm mb-4" style={{ color: '#DC2626' }}>{error}</p>
            <Button variant="primary" onClick={onRetake}>
              Qaytadan urinish
            </Button>
          </Card>
        )}

        {/* Natijalar */}
        {!loading && !error && results.length > 0 && (
          <div className="space-y-4">
            {results.map((r, i) => (
              <CareerResultCard key={r.id} rank={i + 1} career={r} />
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft size={16} /> Orqaga
            </Button>
            <Button variant="primary" onClick={onRetake}>
              <RotateCcw size={16} /> Testni qaytadan topshirish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CareerResultCard({ rank, career }) {
  const medals = ['🥇', '🥈', '🥉'];
  const medal = medals[rank - 1];
  const confidence = Math.round(career.score * 100);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
          style={{ background: 'var(--accent-soft)' }}
        >
          {medal || <Award className="w-6 h-6" style={{ color: 'var(--accent)' }} />}
        </div>
        <div className="flex-1 min-w-0">
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

          {/* Confidence bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Mos kelish darajasi</span>
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
                  background: 'linear-gradient(90deg, var(--accent), #06b6d4)',
                }}
              />
            </div>
          </div>

          {/* Explanation */}
          {career.explanation?.length > 0 && (
            <ul className="space-y-1 mt-2">
              {career.explanation.map((ex, idx) => (
                <li
                  key={idx}
                  className="text-xs flex items-start gap-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span style={{ color: 'var(--accent)' }}>·</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
