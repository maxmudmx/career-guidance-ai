/**
 * Admin paneli — faqat is_admin foydalanuvchilar uchun.
 * Tablar: Dashboard, Foydalanuvchilar, Test natijalari, Kasblar bazasi
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { adminAPI } from '../services/api';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Foydalanuvchilar' },
  { key: 'tests', label: 'Test natijalari' },
  { key: 'occupations', label: 'Kasblar bazasi' },
];

function StatCard({ label, value, accent = 'var(--text)' }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold" style={{ color: accent }}>
        {value ?? '—'}
      </div>
    </Card>
  );
}

function fmtDate(s) {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return d.toLocaleString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return s;
  }
}

// ─── Dashboard tab ──────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    adminAPI.getStats()
      .then((r) => setStats(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || 'Xato'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>;
  if (err) return <div className="text-sm" style={{ color: 'var(--danger, #C0392B)' }}>{String(err)}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Jami foydalanuvchi" value={stats.total_users} />
        <StatCard label="Tasdiqlangan" value={stats.verified_users} />
        <StatCard label="Adminlar" value={stats.admin_users} />
        <StatCard label="Jami testlar" value={stats.total_tests} />
        <StatCard label="Bugun test" value={stats.tests_today} accent="#2F6FB0" />
        <StatCard label="Hafta: testlar" value={stats.tests_this_week} accent="#1F9D6B" />
        <StatCard label="Hafta: yangi user" value={stats.users_this_week} accent="#E0A030" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Eng faol foydalanuvchilar
          </h3>
          {(stats.top_users || []).length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Hozircha ma'lumot yo'q</div>
          ) : (
            <ul className="space-y-2">
              {stats.top_users.map((u) => (
                <li key={u.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text)' }}>@{u.username}</span>
                  <span className="font-semibold" style={{ color: '#2F6FB0' }}>{u.test_count} ta test</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Oxirgi ro'yxatdan o'tganlar
          </h3>
          {(stats.recent_users || []).length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Hozircha ma'lumot yo'q</div>
          ) : (
            <ul className="space-y-2">
              {stats.recent_users.map((u) => (
                <li key={u.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text)' }}>@{u.username} <span style={{ color: 'var(--text-muted)' }}>· {u.email}</span></span>
                  <span style={{ color: 'var(--text-faint)' }}>{fmtDate(u.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Users tab ──────────────────────────────────────────────
function UsersTab() {
  const [q, setQ] = useState('');
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const load = () => {
    setLoading(true);
    setErr(null);
    adminAPI.listUsers({ q, limit, offset })
      .then((r) => setData(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || 'Xato'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [offset]);

  const onSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    load();
  };

  const onDelete = async (u) => {
    if (!confirm(`@${u.username} foydalanuvchisini o'chirishni tasdiqlaysizmi? Bu amal qaytarib bo'lmaydi.`)) return;
    try {
      await adminAPI.deleteUser(u.id);
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || "O'chirishda xato");
    }
  };

  const onToggleAdmin = async (u) => {
    const next = !u.is_admin;
    if (!confirm(`@${u.username} uchun admin huquqini ${next ? 'BERILSIN' : 'OLIB TASHLANSIN'}mi?`)) return;
    try {
      await adminAPI.setAdmin(u.id, next);
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || "Xato");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Username, email yoki ism bo'yicha qidirish..."
          className="flex-1"
        />
        <Button type="submit" variant="primary">Qidirish</Button>
      </form>

      {err && <div className="text-sm" style={{ color: '#C0392B' }}>{String(err)}</div>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface)' }}>
            <tr>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>ID</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Username</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Email</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Hudud</th>
              <th className="text-center p-3 font-semibold" style={{ color: 'var(--text)' }}>Test</th>
              <th className="text-center p-3 font-semibold" style={{ color: 'var(--text)' }}>Tasdiq</th>
              <th className="text-center p-3 font-semibold" style={{ color: 'var(--text)' }}>Admin</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Ro'yxat</th>
              <th className="text-right p-3 font-semibold" style={{ color: 'var(--text)' }}>Amal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>Topilmadi</td></tr>
            ) : data.items.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="p-3" style={{ color: 'var(--text-muted)' }}>{u.id}</td>
                <td className="p-3 font-medium" style={{ color: 'var(--text)' }}>@{u.username}</td>
                <td className="p-3" style={{ color: 'var(--text)' }}>{u.email}</td>
                <td className="p-3" style={{ color: 'var(--text-muted)' }}>{u.region || '—'}</td>
                <td className="p-3 text-center" style={{ color: 'var(--text)' }}>{u.test_count}</td>
                <td className="p-3 text-center">{u.is_verified ? '✓' : '—'}</td>
                <td className="p-3 text-center">
                  {u.is_admin
                    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#1F9D6B', color: 'white' }}>admin</span>
                    : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                </td>
                <td className="p-3 text-xs" style={{ color: 'var(--text-faint)' }}>{fmtDate(u.created_at)}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onToggleAdmin(u)}>
                      {u.is_admin ? "Adminni olib tashlash" : 'Admin qilish'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(u)}>
                      <span style={{ color: '#C0392B' }}>O'chirish</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>Jami: {data.total}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
            ← Oldingi
          </Button>
          <Button size="sm" variant="ghost" disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)}>
            Keyingi →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tests tab ──────────────────────────────────────────────
function TestsTab() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const load = () => {
    setLoading(true);
    adminAPI.listTests({ limit, offset })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [offset]);

  const onDelete = async (t) => {
    if (!confirm(`Test #${t.id} (foydalanuvchi @${t.username}) o'chirilsinmi?`)) return;
    try {
      await adminAPI.deleteTest(t.id);
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || 'Xato');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface)' }}>
            <tr>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>ID</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Foydalanuvchi</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Top tavsiya</th>
              <th className="text-center p-3 font-semibold" style={{ color: 'var(--text)' }}>Tavsiyalar</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Vaqt</th>
              <th className="text-right p-3 font-semibold" style={{ color: 'var(--text)' }}>Amal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>Test natijalari yo'q</td></tr>
            ) : data.items.map((t) => {
              const top = t.top_recommendation || {};
              const topName = top.name_uz || top.name || top.title || (top.occupation && (top.occupation.name_uz || top.occupation.name)) || '—';
              return (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="p-3" style={{ color: 'var(--text-muted)' }}>{t.id}</td>
                  <td className="p-3" style={{ color: 'var(--text)' }}>@{t.username}</td>
                  <td className="p-3" style={{ color: 'var(--text)' }}>{topName}</td>
                  <td className="p-3 text-center" style={{ color: 'var(--text)' }}>{t.recommendation_count}</td>
                  <td className="p-3 text-xs" style={{ color: 'var(--text-faint)' }}>{fmtDate(t.created_at)}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => onDelete(t)}>
                      <span style={{ color: '#C0392B' }}>O'chirish</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>Jami: {data.total}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
            ← Oldingi
          </Button>
          <Button size="sm" variant="ghost" disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)}>
            Keyingi →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Occupations tab ────────────────────────────────────────
function OccupationsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    adminAPI.getOccupations()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const f = filter.trim().toLowerCase();
    if (!f) return data.items;
    return data.items.filter((o) =>
      (o.name_uz || '').toLowerCase().includes(f) ||
      (o.name || '').toLowerCase().includes(f) ||
      (o.category || '').toLowerCase().includes(f)
    );
  }, [data, filter]);

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Jami kasblar" value={data.total} accent="#2F6FB0" />
        <StatCard label="Kategoriyalar" value={data.by_category.length} accent="#1F9D6B" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {data.by_category.map((c) => (
            <span key={c.category}
              className="px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'var(--surface)', color: 'var(--text)' }}>
              {c.category} <strong>{c.count}</strong>
            </span>
          ))}
        </div>
      </Card>

      <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Kasb yoki kategoriya bo'yicha filtrlash..." />

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface)' }}>
            <tr>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Kasb (UZ)</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Name (EN)</th>
              <th className="text-left p-3 font-semibold" style={{ color: 'var(--text)' }}>Kategoriya</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((o, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="p-3" style={{ color: 'var(--text)' }}>{o.name_uz || '—'}</td>
                <td className="p-3" style={{ color: 'var(--text-muted)' }}>{o.name || '—'}</td>
                <td className="p-3" style={{ color: 'var(--text)' }}>{o.category || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {filtered.length > 200 && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Birinchi 200 ta ko'rsatilmoqda. Aniqroq filtr kiriting.
        </div>
      )}
    </div>
  );
}

// ─── Asosiy sahifa ──────────────────────────────────────────
export default function AdminPanel({ onBack }) {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="min-h-screen pb-12 font-sans" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Admin paneli</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Tizimni boshqarish va statistika
            </p>
          </div>
          {onBack && <Button variant="ghost" size="sm" onClick={onBack}>← Bosh sahifa</Button>}
        </div>

        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2"
              style={{
                color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
                borderColor: tab === t.key ? 'var(--text)' : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'tests' && <TestsTab />}
        {tab === 'occupations' && <OccupationsTab />}
      </div>
    </div>
  );
}
