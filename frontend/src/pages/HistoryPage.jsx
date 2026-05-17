import { useEffect, useState } from 'react';
import { Button, Card } from '../components/ui';
import { userAPI } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';

export default function HistoryPage({ onBack }) {
  const { t, lang } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [openId, setOpenId] = useState(null);

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
            {history.map((item, idx) => (
              <HistoryItem
                key={item.id}
                item={item}
                index={history.length - idx}
                isOpen={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                onDelete={(e) => handleDelete(item.id, e)}
                isDeleting={deletingId === item.id}
                formatDate={formatDate}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function HistoryItem({ item, index, isOpen, onToggle, onDelete, isDeleting, formatDate, t }) {
  const recs = item.recommendations || [];
  const riasecScores = item.riasec_scores || {};
  const interests = item.academic_data?.interests || [];
  const subjects = item.academic_data?.subjects || [];
  const topCareer = recs[0];

  const riasecSorted = Object.entries(riasecScores)
    .map(([k, v]) => ({ key: k, value: Number(v) }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left transition-opacity hover:opacity-90"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>
              #{index}
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
        </div>
        <span
          className="text-lg transition-transform flex-shrink-0"
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </span>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          {/* Recommendations with explanation */}
          {recs.length > 0 && (
            <div className="mb-5 mt-4">
              <div className="text-xs uppercase font-semibold mb-3" style={{ color: 'var(--text-faint)' }}>
                {t('history.recommendations')}
              </div>
              <div className="space-y-2">
                {recs.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-sm font-bold w-6 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          #{i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {r.name_uz || r.name}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                            {r.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                        {Math.round((r.score || 0) * 100)}%
                      </div>
                    </div>

                    {/* Explanation — nima uchun mos */}
                    {r.explanation && r.explanation.length > 0 && (
                      <div className="ml-9 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-xs mb-1.5 font-medium" style={{ color: 'var(--text-faint)' }}>
                          {t('history.why_match')}
                        </div>
                        <ul className="space-y-1">
                          {r.explanation.map((ex, j) => (
                            <li
                              key={j}
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              · {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RIASEC */}
          {riasecSorted.length > 0 && (
            <div className="mb-5">
              <div className="text-xs uppercase font-semibold mb-3" style={{ color: 'var(--text-faint)' }}>
                {t('history.riasec_scores')}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {riasecSorted.map(({ key, value }) => (
                  <div
                    key={key}
                    className="text-center p-2 rounded-lg"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {key}
                    </div>
                    <div className="text-base font-bold" style={{ color: 'var(--text)' }}>
                      {value.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests + subjects */}
          {(interests.length > 0 || subjects.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {interests.length > 0 && (
                <div>
                  <div className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
                    {t('history.interests')}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {interests.join(', ')}
                  </div>
                </div>
              )}
              {subjects.length > 0 && (
                <div>
                  <div className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
                    {t('history.subjects')}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {subjects.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete button */}
          <div className="flex justify-end">
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="text-xs px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
            >
              {isDeleting ? "..." : t('history.btn.delete')}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
