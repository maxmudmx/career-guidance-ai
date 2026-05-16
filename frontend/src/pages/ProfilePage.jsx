import { useEffect, useState } from 'react';
import {
  User, Mail, Calendar, Lock, ArrowLeft, ClipboardCheck,
  AlertCircle, CheckCircle, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import { userAPI } from '../services/api';

export default function ProfilePage({ user, onBack }) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    userAPI.getStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">
        <Button variant="secondary" onClick={onBack} className="mb-6">
          <ArrowLeft size={16} /> Orqaga
        </Button>

        {/* Avatar va asosiy ma'lumot */}
        <Card className="p-8 mb-6 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              color: 'white',
            }}
          >
            {(user?.username || 'U').slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            {user?.full_name || user?.username}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            @{user?.username}
          </p>
        </Card>

        {/* Ma'lumotlar */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
            Akkaunt ma'lumotlari
          </h2>
          <div className="space-y-3">
            <InfoRow icon={Mail} label="Email" value={user?.email} />
            <InfoRow
              icon={User}
              label="Username"
              value={`@${user?.username}`}
            />
            <InfoRow
              icon={Calendar}
              label="Ro'yxatdan o'tilgan"
              value={formatDate(stats?.joined_at || user?.created_at)}
            />
            <InfoRow
              icon={ClipboardCheck}
              label="Topshirilgan testlar"
              value={
                statsLoading
                  ? '...'
                  : `${stats?.total_tests || 0} ta`
              }
            />
          </div>
        </Card>

        {/* Parolni o'zgartirish */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Lock size={18} style={{ color: 'var(--accent)' }} />
            Parolni o'zgartirish
          </h2>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--accent-soft)' }}
      >
        <Icon size={16} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div className="text-sm break-all" style={{ color: 'var(--text)' }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (next.length < 6) {
      setError('Yangi parol kamida 6 ta belgi');
      return;
    }
    if (next !== confirm) {
      setError('Yangi parol va tasdiqlash mos kelmadi');
      return;
    }

    setLoading(true);
    try {
      await userAPI.changePassword(current, next);
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <PasswordInput
        placeholder="Joriy parol"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        show={showPwd}
        onToggleShow={() => setShowPwd(!showPwd)}
      />
      <PasswordInput
        placeholder="Yangi parol (kamida 6 belgi)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        show={showPwd}
      />
      <PasswordInput
        placeholder="Yangi parolni tasdiqlang"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        show={showPwd}
      />

      {error && (
        <div className="p-2.5 rounded-lg text-xs flex items-center gap-2"
          style={{ background: 'var(--error-bg)', color: '#DC2626' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {success && (
        <div className="p-2.5 rounded-lg text-xs flex items-center gap-2"
          style={{ background: 'var(--success-bg)', color: '#16A34A' }}>
          <CheckCircle size={14} /> Parol muvaffaqiyatli o'zgartirildi
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={loading || !current || !next || !confirm}
        className="w-full"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Parolni saqlash'}
      </Button>
    </form>
  );
}

function PasswordInput({ placeholder, value, onChange, show, onToggleShow }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none border focus:border-blue-500"
        style={{
          background: 'var(--surface)',
          color: 'var(--text)',
          borderColor: 'var(--border)',
        }}
      />
      {onToggleShow && (
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}
