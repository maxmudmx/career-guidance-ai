/**
 * TestDetailPage — bitta test natijasining to'liq sahifasi.
 * Tarixdan kartochka bosilganda yoki yangi test tugagandan keyin ko'rsatiladi.
 */

import { useTranslation } from '../contexts/LanguageContext';
import TestResultDetail from '../components/TestResultDetail';


export default function TestDetailPage({
  recommendations = [],
  riasecScores = {},
  interests = [],
  subjects = [],
  createdAt = null,
  testNumber = null,
  onBack,
  onRetake,
}) {
  const { t, lang } = useTranslation();

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const localeMap = { uz: 'uz-UZ', en: 'en-US', ru: 'ru-RU' };
    return d.toLocaleString(localeMap[lang] || 'uz-UZ', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header — back arrow + title */}
        <div className="flex items-start gap-3 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70 flex-shrink-0"
              style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
              aria-label="Back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {t('results.title')}
            </h1>
            {(createdAt || testNumber) && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {testNumber && `#${testNumber}`}
                {testNumber && createdAt && ' · '}
                {createdAt && formatDate(createdAt)}
              </p>
            )}
          </div>
        </div>

        {/* Asosiy boy detail */}
        <TestResultDetail
          recommendations={recommendations}
          riasecScores={riasecScores}
          interests={interests}
          subjects={subjects}
        />

        {/* Footer actions */}
        {onRetake && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onRetake}
              className="px-6 py-3 rounded-full font-semibold text-sm transition-opacity hover:opacity-85"
              style={{ background: 'var(--text)', color: 'var(--bg)' }}
            >
              {t('results.btn.retake')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
