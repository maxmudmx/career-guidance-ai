/**
 * Admin paneli — terminal/coding aesthetic.
 * O'z dizayniga ega (app theme'ga bog'liq emas): doimo qora fon, monospace shrift.
 * Klaviatura: "/" qidiruv, "1..4" tab almashinuvi, "Esc" modalni yopish.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { adminAPI } from '../services/api';

// ─── Dizayn tokenlar ────────────────────────────────────────
const T = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#1C2128',
  surface3: '#22272E',
  border: '#30363D',
  borderStrong: '#444C56',
  text: '#C9D1D9',
  muted: '#8B949E',
  faint: '#6E7681',
  green: '#3FB950',
  cyan: '#58A6FF',
  amber: '#D29922',
  red: '#F85149',
  purple: '#BC8CFF',
  pink: '#FF7B72',
};
const MONO = "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'Cascadia Code', monospace";

const TABS = [
  { key: 'dashboard', label: 'dashboard.tsx', icon: '◇' },
  { key: 'users',     label: 'users.sql',     icon: '◈' },
  { key: 'tests',     label: 'tests.json',    icon: '◆' },
  { key: 'careers',   label: 'careers.db',    icon: '◉' },
];

// ─── Yordamchilar ───────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '—';
  try {
    const d = new Date(s);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return s; }
}
function fmtBytes(b) {
  if (!b) return '0 B';
  const k = 1024;
  const u = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b)/Math.log(k));
  return `${(b/Math.pow(k,i)).toFixed(1)} ${u[i]}`;
}

// ─── Atom komponentlar ──────────────────────────────────────
function Dot({ color, glow = false }) {
  return <span style={{
    display: 'inline-block', width: 8, height: 8, borderRadius: 999,
    background: color,
    boxShadow: glow ? `0 0 8px ${color}` : 'none',
    verticalAlign: 'middle',
  }} />;
}

function Pill({ children, color = T.cyan, bg = null }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      fontSize: 11,
      fontFamily: MONO,
      borderRadius: 4,
      border: `1px solid ${color}55`,
      background: bg || `${color}18`,
      color,
      letterSpacing: 0.3,
    }}>{children}</span>
  );
}

function Btn({ children, onClick, color = T.text, disabled = false, title, danger = false, primary = false }) {
  const c = danger ? T.red : primary ? T.green : color;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      style={{
        fontFamily: MONO, fontSize: 12, padding: '5px 10px',
        background: disabled ? T.surface2 : 'transparent',
        color: disabled ? T.faint : c,
        border: `1px solid ${disabled ? T.border : c + '55'}`,
        borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .15s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = c + '15'; e.currentTarget.style.borderColor = c; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c + '55'; } }}
    >{children}</button>
  );
}

function Panel({ children, title, accent = T.cyan, style = {} }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
      overflow: 'hidden', ...style,
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderBottom: `1px solid ${T.border}`,
          fontFamily: MONO, fontSize: 11, color: T.muted, letterSpacing: 0.5,
          background: T.surface2,
        }}>
          <span style={{ color: accent }}>▍</span>
          <span style={{ textTransform: 'uppercase' }}>{title}</span>
        </div>
      )}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function Stat({ label, value, accent = T.green, hint }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
      padding: '14px 16px',
    }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: T.muted, letterSpacing: 0.5 }}>
        <span style={{ color: T.faint }}>{'>'} </span>{label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 28, color: accent, fontWeight: 700, marginTop: 6, letterSpacing: -0.5 }}>
        {value ?? '—'}
      </div>
      {hint && <div style={{ fontFamily: MONO, fontSize: 11, color: T.faint, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ─── Activity sparkline (SVG) ───────────────────────────────
function ActivityChart({ series }) {
  if (!series || series.length === 0) return null;
  const W = 600, H = 140, P = 24;
  const maxV = Math.max(1, ...series.flatMap(s => [s.users, s.tests]));
  const bw = (W - P*2) / series.length;
  const x = (i) => P + i * bw + bw/2;
  const y = (v) => H - P - (v / maxV) * (H - P*2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={P} x2={W-P} y1={H - P - f*(H - P*2)} y2={H - P - f*(H - P*2)}
              stroke={T.border} strokeDasharray="2,3" />
      ))}
      {/* tests bars */}
      {series.map((s, i) => {
        const bx = x(i) - 3.5;
        const by = y(s.tests);
        const bh = H - P - by;
        return <rect key={'t'+i} x={bx} y={by} width={7} height={bh} fill={T.green} opacity={0.85} rx={1} />;
      })}
      {/* users line */}
      <polyline
        fill="none" stroke={T.cyan} strokeWidth="1.8"
        points={series.map((s,i) => `${x(i)},${y(s.users)}`).join(' ')}
      />
      {series.map((s, i) => (
        <circle key={'u'+i} cx={x(i)} cy={y(s.users)} r="2.5" fill={T.cyan} />
      ))}
      {/* date labels */}
      {series.map((s, i) => i % Math.ceil(series.length/7) === 0 || i === series.length-1 ? (
        <text key={'l'+i} x={x(i)} y={H-6} textAnchor="middle"
              fontSize="9" fill={T.faint} fontFamily={MONO}>
          {s.date.slice(5)}
        </text>
      ) : null)}
    </svg>
  );
}

// ─── Modal ──────────────────────────────────────────────────
function Modal({ open, onClose, title, children, accent = T.cyan }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
        maxWidth: 900, width: '100%', maxHeight: '85vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: `0 0 0 1px ${accent}33, 0 30px 60px rgba(0,0,0,0.5)`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
          background: T.surface2, fontFamily: MONO,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <Dot color="#FF5F57" /><Dot color="#FEBC2E" /><Dot color="#28C840" />
          </div>
          <div style={{ color: T.muted, fontSize: 12 }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer',
            fontFamily: MONO, fontSize: 14,
          }}>✕</button>
        </div>
        <div style={{ overflow: 'auto', padding: 18, fontFamily: MONO, fontSize: 13, color: T.text }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD TAB ──────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [system, setSystem] = useState(null);
  const [activity, setActivity] = useState(null);
  const [topCareers, setTopCareers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getStats().then(r => r.data).catch(() => null),
      adminAPI.getSystem().then(r => r.data).catch(() => null),
      adminAPI.getActivity(14).then(r => r.data).catch(() => null),
      adminAPI.getTopCareers(8).then(r => r.data).catch(() => null),
    ]).then(([s, sys, act, top]) => {
      setStats(s); setSystem(sys); setActivity(act); setTopCareers(top);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ fontFamily: MONO, color: T.muted, fontSize: 13 }}>
    <span style={{ color: T.green }}>$</span> loading dashboard<span className="blink">_</span>
  </div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Stat label="total_users"        value={stats?.total_users}     accent={T.green} />
        <Stat label="verified_users"     value={stats?.verified_users}  accent={T.cyan} />
        <Stat label="admin_users"        value={stats?.admin_users}     accent={T.purple} />
        <Stat label="total_tests"        value={stats?.total_tests}     accent={T.amber} />
        <Stat label="tests_today"        value={stats?.tests_today}     accent={T.green} hint="// last 24h" />
        <Stat label="tests_this_week"    value={stats?.tests_this_week} accent={T.cyan}  hint="// 7 days" />
        <Stat label="users_this_week"    value={stats?.users_this_week} accent={T.purple} hint="// 7 days" />
      </div>

      {/* Activity chart */}
      <Panel title="// activity — last 14 days" accent={T.green}>
        {activity && <ActivityChart series={activity.series} />}
        <div style={{ display: 'flex', gap: 18, marginTop: 10, fontFamily: MONO, fontSize: 11, color: T.muted }}>
          <span><span style={{ display:'inline-block', width:10, height:10, background:T.green, marginRight:6, verticalAlign:'middle' }} />tests = {activity?.totals.tests ?? 0}</span>
          <span><span style={{ display:'inline-block', width:10, height:10, background:T.cyan, marginRight:6, verticalAlign:'middle' }} />new users = {activity?.totals.users ?? 0}</span>
        </div>
      </Panel>

      {/* Two columns: system + top careers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* System health */}
        <Panel title="// system health" accent={T.cyan}>
          {system && (
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.text, lineHeight: 1.8 }}>
              <Row label="backend"     value={<><Dot color={T.green} glow /> ok · py {system.backend.python}</>} />
              <Row label="database"    value={system.database.status === 'ok'
                ? <><Dot color={T.green} glow /> ok</>
                : <><Dot color={T.red} glow /> {system.database.error || 'error'}</>} />
              <Row label="ml_model"    value={system.ml_model.status === 'ok'
                ? <><Dot color={T.green} glow /> ok · {fmtBytes(system.ml_model.size_bytes)}</>
                : <><Dot color={T.amber} glow /> missing</>} />
              <Row label="super_admin" value={<span style={{ color: T.purple }}>{system.config.super_admin_email || '—'}</span>} />
              <Row label="brevo_email" value={system.config.has_brevo_api_key ? <Dot color={T.green} glow /> : <Dot color={T.faint} />} />
              <Row label="token_ttl"   value={`${system.config.token_ttl_minutes} min`} />
              <Row label="server_time" value={<span style={{ color: T.faint, fontSize: 11 }}>{system.server_time}</span>} />
            </div>
          )}
        </Panel>

        {/* Top careers */}
        <Panel title="// top recommended careers" accent={T.amber}>
          {(!topCareers || topCareers.items.length === 0) ? (
            <div style={{ fontFamily: MONO, fontSize: 12, color: T.faint }}>// no recommendations yet</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {topCareers.items.map((c, i) => {
                const max = topCareers.items[0].count || 1;
                const pct = Math.max(8, (c.count / max) * 100);
                return (
                  <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 40px', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T.faint }}>{String(i+1).padStart(2, '0')}</span>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 12, color: T.text, marginBottom: 4 }}>{c.name}</div>
                      <div style={{ height: 4, background: T.surface3, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: T.amber }} />
                      </div>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T.amber, textAlign: 'right' }}>{c.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Top users + recent signups */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <Panel title="// top active users" accent={T.green}>
          {(stats?.top_users || []).length === 0
            ? <div style={{ fontFamily: MONO, fontSize: 12, color: T.faint }}>// empty</div>
            : (stats.top_users.map((u) => (
              <Row key={u.id} label={'@' + u.username} value={<span style={{ color: T.green }}>{u.test_count} tests</span>} />
            )))}
        </Panel>
        <Panel title="// recent signups" accent={T.purple}>
          {(stats?.recent_users || []).length === 0
            ? <div style={{ fontFamily: MONO, fontSize: 12, color: T.faint }}>// empty</div>
            : (stats.recent_users.map((u) => (
              <Row key={u.id} label={'@' + u.username} value={<span style={{ color: T.faint, fontSize: 11 }}>{fmtDate(u.created_at)}</span>} />
            )))}
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0', fontFamily: MONO, fontSize: 12,
      borderBottom: `1px dashed ${T.border}`,
    }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ color: T.text }}>{value}</span>
    </div>
  );
}

// ─── USERS TAB ──────────────────────────────────────────────
function UsersTab({ searchRef }) {
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('all');
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState(null); // user detail modal
  const limit = 25;

  const load = () => {
    setLoading(true);
    adminAPI.listUsers({ q, only, limit, offset })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [offset, only]);

  const onSearch = (e) => { e.preventDefault(); setOffset(0); load(); };

  const onDelete = async (u) => {
    if (u.is_super_admin) return;
    if (!confirm(`@${u.username} ni o'chirishni tasdiqlaysizmi?`)) return;
    try { await adminAPI.deleteUser(u.id); load(); }
    catch (e) { alert(e?.response?.data?.detail || 'Xato'); }
  };

  const onToggleAdmin = async (u) => {
    if (u.is_super_admin) return;
    const next = !u.is_admin;
    if (!confirm(`@${u.username}: admin ${next ? 'BERILSIN' : 'OLIB TASHLANSIN'}mi?`)) return;
    try { await adminAPI.setAdmin(u.id, next); load(); }
    catch (e) { alert(e?.response?.data?.detail || 'Xato'); }
  };

  const openDetail = async (u) => {
    setDetail({ loading: true, user: u });
    try {
      const r = await adminAPI.getUser(u.id);
      setDetail({ loading: false, ...r.data });
    } catch (e) {
      setDetail({ loading: false, error: e?.response?.data?.detail || 'Xato' });
    }
  };

  const FILTERS = [
    { key: 'all', label: 'all' },
    { key: 'admins', label: 'admins' },
    { key: 'verified', label: 'verified' },
    { key: 'unverified', label: 'unverified' },
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Panel title="// query" accent={T.cyan}>
        <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontFamily: MONO, color: T.green, fontSize: 14 }}>$</span>
          <input
            ref={searchRef}
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="grep username|email|name..."
            style={{
              flex: 1, background: T.surface2, border: `1px solid ${T.border}`,
              borderRadius: 4, padding: '7px 12px', color: T.text,
              fontFamily: MONO, fontSize: 13, outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = T.cyan}
            onBlur={(e) => e.target.style.borderColor = T.border}
          />
          <Btn primary onClick={onSearch}>execute</Btn>
        </form>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: T.faint }}>--filter</span>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => { setOnly(f.key); setOffset(0); }}
              style={{
                fontFamily: MONO, fontSize: 11, padding: '3px 9px',
                background: only === f.key ? T.cyan + '20' : 'transparent',
                color: only === f.key ? T.cyan : T.muted,
                border: `1px solid ${only === f.key ? T.cyan : T.border}`,
                borderRadius: 3, cursor: 'pointer',
              }}>
              {f.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <Btn onClick={() => adminAPI.downloadUsersCsv()}>↓ export.csv</Btn>
          </div>
        </div>
      </Panel>

      <Panel title={`// rows ${data.items.length}/${data.total}`} accent={T.green}>
        <div style={{ overflowX: 'auto', margin: -14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surface2 }}>
                {['id','username','email','region','tests','verified','role','created_at',''].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'tests' || h === 'verified' || h === 'role' ? 'center' : 'left', color: T.muted, fontWeight: 500, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={9} style={{ padding: 18, textAlign: 'center', color: T.muted }}>// loading...</td></tr>
              : data.items.length === 0 ? <tr><td colSpan={9} style={{ padding: 18, textAlign: 'center', color: T.faint }}>// no rows</td></tr>
              : data.items.map((u) => (
                <tr key={u.id}
                  style={{ borderBottom: `1px solid ${T.border}`, transition: 'background .1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '8px 12px', color: T.faint }}>#{u.id}</td>
                  <td style={{ padding: '8px 12px', color: T.cyan, cursor: 'pointer' }} onClick={() => openDetail(u)}>@{u.username}</td>
                  <td style={{ padding: '8px 12px', color: T.text }}>{u.email}</td>
                  <td style={{ padding: '8px 12px', color: T.muted }}>{u.region || '·'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: T.amber }}>{u.test_count}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{u.is_verified ? <Dot color={T.green} /> : <Dot color={T.faint} />}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {u.is_super_admin ? <Pill color={T.pink}>SUPER</Pill>
                      : u.is_admin ? <Pill color={T.purple}>admin</Pill>
                      : <span style={{ color: T.faint, fontSize: 11 }}>user</span>}
                  </td>
                  <td style={{ padding: '8px 12px', color: T.faint, fontSize: 11 }}>{fmtDate(u.created_at)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Btn onClick={() => openDetail(u)} color={T.cyan}>view</Btn>{' '}
                    <Btn onClick={() => onToggleAdmin(u)} disabled={u.is_super_admin}
                         color={u.is_admin ? T.amber : T.purple}>
                      {u.is_admin ? '−admin' : '+admin'}
                    </Btn>{' '}
                    <Btn onClick={() => onDelete(u)} danger disabled={u.is_super_admin}
                         title={u.is_super_admin ? 'super-admin himoyalangan' : ''}>
                      del
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 12, color: T.muted }}>
        <span>page {Math.floor(offset/limit) + 1} / {Math.max(1, Math.ceil(data.total/limit))}  ·  total {data.total}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>← prev</Btn>
          <Btn disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)}>next →</Btn>
        </div>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.user ? `users/${detail.user.username}.json` : ''} accent={T.cyan}>
        {detail?.loading ? <div style={{ color: T.muted }}>// loading...</div>
        : detail?.error ? <div style={{ color: T.red }}>// {detail.error}</div>
        : detail && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 14px', marginBottom: 16 }}>
              <span style={{ color: T.muted }}>id:</span>            <span>#{detail.user.id}</span>
              <span style={{ color: T.muted }}>username:</span>      <span style={{ color: T.cyan }}>@{detail.user.username}</span>
              <span style={{ color: T.muted }}>email:</span>         <span>{detail.user.email}</span>
              <span style={{ color: T.muted }}>full_name:</span>     <span>{detail.user.full_name || '·'}</span>
              <span style={{ color: T.muted }}>region:</span>        <span>{detail.user.region || '·'}</span>
              <span style={{ color: T.muted }}>date_of_birth:</span> <span>{detail.user.date_of_birth || '·'}</span>
              <span style={{ color: T.muted }}>verified:</span>      <span>{String(detail.user.is_verified)}</span>
              <span style={{ color: T.muted }}>admin:</span>         <span>{detail.user.is_super_admin ? <Pill color={T.pink}>SUPER</Pill> : String(detail.user.is_admin)}</span>
              <span style={{ color: T.muted }}>test_count:</span>    <span style={{ color: T.amber }}>{detail.user.test_count}</span>
              <span style={{ color: T.muted }}>created_at:</span>    <span>{fmtDate(detail.user.created_at)}</span>
            </div>
            <div style={{ color: T.muted, fontSize: 11, marginBottom: 8 }}>// recent tests ({detail.tests.length})</div>
            {detail.tests.length === 0 ? <div style={{ color: T.faint }}>// no tests</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}`, color: T.muted }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>id</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>top_recommendation</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>recs</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>created_at</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.tests.map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', color: T.faint }}>#{t.id}</td>
                      <td style={{ padding: '6px 8px', color: T.text }}>{t.top_recommendation || '·'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: T.amber }}>{t.recommendation_count}</td>
                      <td style={{ padding: '6px 8px', color: T.faint }}>{fmtDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── TESTS TAB ──────────────────────────────────────────────
function TestsTab() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState(null);
  const limit = 25;

  const load = () => {
    setLoading(true);
    adminAPI.listTests({ limit, offset })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [offset]);

  const onDelete = async (t) => {
    if (!confirm(`Test #${t.id} (@${t.username}) o'chirilsinmi?`)) return;
    try { await adminAPI.deleteTest(t.id); load(); }
    catch (e) { alert(e?.response?.data?.detail || 'Xato'); }
  };

  const openDetail = async (t) => {
    setDetail({ loading: true, id: t.id });
    try {
      const r = await adminAPI.getTest(t.id);
      setDetail({ loading: false, data: r.data });
    } catch (e) {
      setDetail({ loading: false, error: e?.response?.data?.detail || 'Xato' });
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Panel title={`// rows ${data.items.length}/${data.total}`} accent={T.amber}>
        <div style={{ overflowX: 'auto', margin: -14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surface2 }}>
                {['id','user','top_recommendation','recs','created_at',''].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'recs' ? 'center' : 'left', color: T.muted, fontWeight: 500, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ padding: 18, textAlign: 'center', color: T.muted }}>// loading...</td></tr>
              : data.items.length === 0 ? <tr><td colSpan={6} style={{ padding: 18, textAlign: 'center', color: T.faint }}>// no tests</td></tr>
              : data.items.map((t) => (
                <tr key={t.id}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '8px 12px', color: T.faint }}>#{t.id}</td>
                  <td style={{ padding: '8px 12px', color: T.cyan }}>@{t.username}</td>
                  <td style={{ padding: '8px 12px', color: T.text }}>{t.top_recommendation || '·'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: T.amber }}>{t.recommendation_count}</td>
                  <td style={{ padding: '8px 12px', color: T.faint, fontSize: 11 }}>{fmtDate(t.created_at)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Btn onClick={() => openDetail(t)} color={T.cyan}>view</Btn>{' '}
                    <Btn onClick={() => onDelete(t)} danger>del</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 12, color: T.muted }}>
        <span>page {Math.floor(offset/limit) + 1} / {Math.max(1, Math.ceil(data.total/limit))}  ·  total {data.total}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>← prev</Btn>
          <Btn disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)}>next →</Btn>
        </div>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.data ? `tests/${detail.data.id}.json` : ''} accent={T.amber}>
        {detail?.loading ? <div style={{ color: T.muted }}>// loading...</div>
        : detail?.error ? <div style={{ color: T.red }}>// {detail.error}</div>
        : detail?.data && (() => {
          const d = detail.data;
          return (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 14px', marginBottom: 14 }}>
                <span style={{ color: T.muted }}>id:</span>         <span>#{d.id}</span>
                <span style={{ color: T.muted }}>user:</span>       <span style={{ color: T.cyan }}>@{d.user.username} <span style={{ color: T.faint }}>({d.user.email})</span></span>
                <span style={{ color: T.muted }}>created_at:</span> <span>{fmtDate(d.created_at)}</span>
              </div>
              <div style={{ color: T.muted, fontSize: 11, marginBottom: 6 }}>// riasec_scores</div>
              <pre style={{ background: T.surface2, padding: 12, borderRadius: 4, color: T.green, fontSize: 12, overflow: 'auto', margin: '0 0 14px' }}>
{JSON.stringify(d.riasec_scores, null, 2)}
              </pre>
              <div style={{ color: T.muted, fontSize: 11, marginBottom: 6 }}>// recommendations (top {(d.recommendations||[]).length})</div>
              <pre style={{ background: T.surface2, padding: 12, borderRadius: 4, color: T.cyan, fontSize: 12, overflow: 'auto', maxHeight: 280, margin: 0 }}>
{JSON.stringify(d.recommendations, null, 2)}
              </pre>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

// ─── CAREERS TAB ────────────────────────────────────────────
function CareersTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    adminAPI.getOccupations().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const f = filter.trim().toLowerCase();
    if (!f) return data.items;
    return data.items.filter((o) =>
      (o.name_uz || '').toLowerCase().includes(f) ||
      (o.name || '').toLowerCase().includes(f) ||
      (o.category || '').toLowerCase().includes(f));
  }, [data, filter]);

  if (loading) return <div style={{ fontFamily: MONO, color: T.muted, fontSize: 13 }}>$ loading careers<span className="blink">_</span></div>;
  if (!data) return null;

  const maxCat = Math.max(...data.by_category.map((c) => c.count), 1);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Stat label="total_careers" value={data.total} accent={T.cyan} />
        <Stat label="categories"    value={data.by_category.length} accent={T.green} />
      </div>

      <Panel title="// by category" accent={T.cyan}>
        <div style={{ display: 'grid', gap: 6 }}>
          {data.by_category.map((c) => (
            <div key={c.category} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: T.text }}>{c.category}</span>
              <div style={{ height: 6, background: T.surface3, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${(c.count/maxCat)*100}%`, height: '100%', background: T.cyan }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 12, color: T.cyan, textAlign: 'right' }}>{c.count}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="// careers list" accent={T.green}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, color: T.green }}>$</span>
          <input value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="grep careers..."
            style={{
              flex: 1, background: T.surface2, border: `1px solid ${T.border}`,
              borderRadius: 4, padding: '6px 10px', color: T.text,
              fontFamily: MONO, fontSize: 13, outline: 'none',
            }}/>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surface2 }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 500 }}>name_uz</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 500 }}>name_en</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 500 }}>category</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 250).map((o, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', color: T.text }}>{o.name_uz || '·'}</td>
                  <td style={{ padding: '6px 10px', color: T.muted }}>{o.name || '·'}</td>
                  <td style={{ padding: '6px 10px', color: T.cyan }}>{o.category || '·'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 250 && (
            <div style={{ fontFamily: MONO, fontSize: 11, color: T.faint, marginTop: 8 }}>
              // showing 250/{filtered.length}, narrow your filter
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

// ─── ASOSIY SAHIFA ──────────────────────────────────────────
export default function AdminPanel({ onBack }) {
  const [tab, setTab] = useState('dashboard');
  const [time, setTime] = useState(new Date());
  const searchRef = useRef(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcuts: /, 1..4, Esc
  useEffect(() => {
    const h = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); setTab('users'); }
      else if (e.key === '1') setTab('dashboard');
      else if (e.key === '2') setTab('users');
      else if (e.key === '3') setTab('tests');
      else if (e.key === '4') setTab('careers');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');
  const clock = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text, fontFamily: MONO,
      // Grid overlay (subtle)
      backgroundImage: `linear-gradient(${T.surface2} 1px, transparent 1px), linear-gradient(90deg, ${T.surface2} 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundPosition: '-1px -1px',
    }}>
      <style>{`
        .blink { animation: blink 1s steps(2) infinite; }
        @keyframes blink { to { opacity: 0; } }
        ::selection { background: ${T.cyan}55; color: ${T.text}; }
      `}</style>

      {/* Terminal window header */}
      <div style={{
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 20px',
                      display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <Dot color="#FF5F57" /><Dot color="#FEBC2E" /><Dot color="#28C840" />
          </div>
          <span style={{ fontSize: 13, color: T.muted, letterSpacing: 0.3 }}>
            <span style={{ color: T.green }}>kasbim-admin</span>
            <span style={{ color: T.faint }}> ~ </span>
            <span style={{ color: T.cyan }}>/{tab}</span>
            <span style={{ color: T.faint }}> $</span>
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: T.muted }}>
              <Dot color={T.green} glow /> <span style={{ marginLeft: 6 }}>online</span>
            </span>
            <span style={{ fontSize: 12, color: T.amber }}>{clock}</span>
            {onBack && (
              <button onClick={onBack} style={{
                background: 'transparent', border: `1px solid ${T.border}`, color: T.muted,
                borderRadius: 4, padding: '4px 10px', fontFamily: MONO, fontSize: 12, cursor: 'pointer',
              }}>← exit</button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs (code editor style) */}
      <div style={{
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'flex-end' }}>
          {TABS.map((t, i) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  fontFamily: MONO, fontSize: 12,
                  padding: '10px 16px',
                  background: active ? T.bg : 'transparent',
                  color: active ? T.text : T.muted,
                  border: 'none',
                  borderTop: active ? `2px solid ${T.cyan}` : '2px solid transparent',
                  borderRight: `1px solid ${T.border}`,
                  borderLeft: i === 0 ? `1px solid ${T.border}` : 'none',
                  cursor: 'pointer',
                  marginBottom: -1,
                  position: 'relative',
                }}>
                <span style={{ color: active ? T.cyan : T.faint, marginRight: 6 }}>{t.icon}</span>
                {t.label}
                <span style={{ color: T.faint, marginLeft: 8, fontSize: 10 }}>[{i+1}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'users'     && <UsersTab searchRef={searchRef} />}
        {tab === 'tests'     && <TestsTab />}
        {tab === 'careers'   && <CareersTab />}
      </div>

      {/* Footer */}
      <div style={{
        maxWidth: 1400, margin: '0 auto', padding: '12px 20px 28px',
        fontFamily: MONO, fontSize: 11, color: T.faint,
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <span>kasbim-admin v1.0 · <span style={{ color: T.muted }}>shortcuts:</span> <span style={{ color: T.cyan }}>1-4</span> tabs · <span style={{ color: T.cyan }}>/</span> search · <span style={{ color: T.cyan }}>Esc</span> close</span>
        <span>build · {new Date().toISOString().slice(0,10)}</span>
      </div>
    </div>
  );
}
