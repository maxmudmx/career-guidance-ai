import { useEffect, useState } from 'react';
import { Button, Card } from '../components/ui';
import { userAPI } from '../services/api';

export default function HistoryPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    userAPI.getHistory()
      .then((res) => setHistory(res.data?.history || []))
      .catch((err) => setError(err?.response?.data?.detail || "Yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!confirm("Bu test natijasini o'chirishni xohlaysizmi?")) return;
    setDeletingId(id);
    try {
      await userAPI.deleteHistory(id);
      setHistory((h) => h.filter((item) => item.id !== id));
    } catch (err) {
      alert("O'chirib bo'lmadi: " + (err?.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('uz-UZ', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          Mening testlarim
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Avvalgi test natijalaringiz va tavsiyalar
        </p>

        {loading && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</p>
          </div>
        )}

        {!loading && error && (
          <Card className="p-6 text-center">
            <p className="text-sm mb-4" style={{ color: '#DC2626' }}>{error}</p>
            <Button variant="primary" onClick={load}>Qaytadan</Button>
          </Card>
        )}

        {!loading && !error && history.length === 0 && (
          <Card className="p-10 text-center">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
              Hali test topshirmagansiz
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Birinchi testni topshirib, sizga mos kasblarni toping
            </p>
            <Button variant="primary" onClick={onBack}>Testni boshlash</Button>
          </Card>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Jami: <strong style={{ color: 'var(--text)' }}>{history.length}</strong> ta test
            </p>
            {history.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onDelete={() => handleDelete(item.id)}
                isDeleting={deletingId === item.id}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ item, onDelete, isDeleting, formatDate }) {
  const topCareer = item.recommendations?.[0];
  const riasecDominant = Object.entries(item.riasec_scores || {})
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {formatDate(item.created_at)}
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="text-xs px-2 py-1 rounded hover:opacity-70 transition-opacity disabled:opacity-50"
          style={{ background: 'var(--bg-hover)', color: '#DC2626' }}
        >
          {isDeleting ? "..." : "O'chirish"}
        </button>
      </div>

      {topCareer && (
        <div className="mb-3">
          <div className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-faint)' }}>
            Eng yaxshi tavsiya
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            {topCareer.name_uz}
          </div>
          <div className="text-xs" style={{ color: 'var(--accent)' }}>
            Mos kelish: {Math.round((topCareer.score || 0) * 100)}%
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Dominant RIASEC
          </div>
          <div style={{ color: 'var(--text)' }}>
            {riasecDominant ? `${riasecDominant[0]} = ${riasecDominant[1]}` : '—'}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Tavsiyalar soni
          </div>
          <div style={{ color: 'var(--text)' }}>
            {(item.recommendations || []).length}
          </div>
        </div>
      </div>

      {item.recommendations && item.recommendations.length > 1 && (
        <details className="mt-3">
          <summary
            className="text-xs cursor-pointer hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            Barcha tavsiyalarni ko'rish
          </summary>
          <ol className="mt-2 ml-4 space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {item.recommendations.map((r, i) => (
              <li key={i}>
                <span style={{ color: 'var(--text)' }}>{r.name_uz}</span>
                <span style={{ color: 'var(--text-faint)' }}> — {Math.round((r.score || 0) * 100)}%</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </Card>
  );
}
