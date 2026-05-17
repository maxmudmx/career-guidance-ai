import { useEffect, useState } from 'react';
import { Button, Card } from '../components/ui';
import { userAPI } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';

export default function HistoryPage({ onBack, onOpenTest }) {
  const { t, lang } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    userAPI.getHistory()
      .then((res) => setHistory(res.data?.history || []))
      .catch((err) => setError(err?.response?.data?.detail || t('common.error')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!confirm(t('history.confirm_delete'))) return;
    setDeletingId(id);
    try {
      await userAPI.deleteHistory(id);
      setHistory((h) => h.filter((item) => item.id !== id));
    } catch (err) {
      alert(t('history.delete_failed') + ' ' + (err?.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const localeMap = { uz: 'uz-UZ', en: 'en-US', ru: 'ru-RU' };
    return d.toLocaleString(localeMap[lang] || 'uz-UZ', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          {t('history.title')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          {t('history.subtitle')}
        </p>

        {loading && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('history.loading')}</p>
          </div>
        )}

        {!loading && error && (
          <Card className="p-6 text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>{error}</p>
            <Button variant="primary" onClick={load}>{t('history.btn.retry')}</Button>
          </Card>
        )}

        {!loading && !error && history.length === 0 && (
          <Card className="p-10 text-center">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
              {t('history.empty.title')}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {t('history.empty.subtitle')}
            </p>
            <Button variant="primary" onClick={onBack}>{t('history.empty.btn')}</Button>
          </Card>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              {t('history.total')} <strong style={{ color: 'var(--text)' }}>{history.length}</strong> {t('history.tests')}
            </p>
            {history.map((item, idx) => {
              const testNumber = history.length - idx;
              const topCareer = item.recommendations?.[0];
              return (
                <Card key={item.id} className="overflow-hidden">
                  <div className="flex items-stretch">
                    <button
                      onClick={() => onOpenTest?.(item, testNumber)}
                      className="flex-1 px-5 py-4 text-left transition-opacity hover:opacity-90"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>
                          #{testNumber}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text)' }}>
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      {topCareer && (
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {topCareer.name_uz || topCareer.name} · {Math.round((topCareer.score || 0) * 100)}%
                        </div>
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deletingId === item.id}
                      className="px-4 text-xs hover:opacity-70 transition-opacity disabled:opacity-50 border-l"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                      aria-label={t('history.btn.delete')}
                      title={t('history.btn.delete')}
                    >
                      {deletingId === item.id ? "..." : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/>
                          <path d="M14 11v6"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
