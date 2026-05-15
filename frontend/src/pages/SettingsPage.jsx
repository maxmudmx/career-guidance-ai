import { useState } from 'react';
import {
  Moon, Lock, Eye, EyeOff, Check,
  Settings as SettingsIcon, ChevronRight,
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { useTheme } from '../hooks/useTheme';

function PasswordField({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock
        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-faint)' }}
      />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
        style={{
          background: 'var(--surface)',
          color: 'var(--text)',
          borderColor: 'var(--border)',
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-faint)' }}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Toggle switch (iOS-style)
// ────────────────────────────────────────────────────────────
function ToggleSwitch({ active, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0"
      style={{
        background: active ? 'var(--accent)' : 'var(--surface-subtle)',
      }}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
        style={{
          transform: active ? 'translateX(24px)' : 'translateX(4px)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// Password sub-page
// ────────────────────────────────────────────────────────────
function ChangePasswordView({ onBack }) {
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdState, setPwdState] = useState({ loading: false, error: '', success: '' });

  const handleChangePassword = async () => {
    if (!curPwd || !newPwd) {
      setPwdState({ loading: false, error: "Barcha maydonlarni to'ldiring", success: '' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdState({ loading: false, error: 'Yangi parollar mos kelmayapti', success: '' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdState({ loading: false, error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak", success: '' });
      return;
    }
    setPwdState({ loading: true, error: '', success: '' });
    try {
      await api.post('/users/change-password', {
        current_password: curPwd,
        new_password: newPwd,
      });
      setPwdState({ loading: false, error: '', success: 'Parol muvaffaqiyatli yangilandi' });
      setCurPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setPwdState({
        loading: false,
        error: err.response?.data?.detail || 'Xatolik',
        success: '',
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Parolni almashtirish"
        subtitle="Hisobingiz xavfsizligi uchun yangi parol o'rnating"
        onBack={onBack}
        icon={Lock}
      />

      <Card className="p-6">
        <div className="space-y-3">
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Joriy parol
            </label>
            <PasswordField
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
              placeholder="Joriy parolingiz"
            />
          </div>
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Yangi parol
            </label>
            <PasswordField
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="kamida 6 ta belgi"
            />
          </div>
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Yangi parolni tasdiqlang
            </label>
            <PasswordField
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="qayta yozing"
            />
          </div>

          {pwdState.error && (
            <div
              className="p-2.5 rounded-lg text-xs border"
              style={{
                background: 'var(--error-bg)',
                borderColor: 'var(--error-border)',
                color: 'var(--error)',
              }}
            >
              {pwdState.error}
            </div>
          )}
          {pwdState.success && (
            <div
              className="p-2.5 rounded-lg text-xs border"
              style={{
                background: 'var(--success-bg)',
                borderColor: 'var(--success-border)',
                color: 'var(--success)',
              }}
            >
              ✓ {pwdState.success}
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleChangePassword}
            disabled={pwdState.loading || !curPwd || !newPwd || !confirmPwd}
            className="w-full"
          >
            {pwdState.loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" /> Parolni yangilash
              </>
            )}
          </Button>
        </div>
      </Card>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Main settings view
// ────────────────────────────────────────────────────────────
function MainSettingsView({ onBack, onOpenPassword }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <PageHeader
        title="Sozlamalar"
        subtitle="Hisobingiz va ko'rinish sozlamalari"
        onBack={onBack}
        icon={SettingsIcon}
      />

      {/* Settings list */}
      <Card className="overflow-hidden p-0">
        {/* Theme toggle row */}
        <div
          className="flex items-center justify-between gap-3 py-4 px-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-soft)' }}
            >
              <Moon className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-medium" style={{ color: 'var(--text)' }}>
                {isDark ? 'Tungi rejim' : 'Kunduzgi rejim'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isDark ? 'Qoramtir interfeys' : 'Yorug‘ interfeys'}
              </div>
            </div>
          </div>
          <ToggleSwitch active={isDark} onChange={toggleTheme} />
        </div>

        {/* Password row — clickable */}
        <button
          type="button"
          onClick={onOpenPassword}
          className="w-full flex items-center justify-between gap-3 py-4 px-4 text-left transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-soft)' }}
            >
              <Lock className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-medium" style={{ color: 'var(--text)' }}>
                Parolni almashtirish
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Yangi parol o'rnatish
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
        </button>
      </Card>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Page wrapper — view URL orqali boshqariladi (App.jsx)
// ────────────────────────────────────────────────────────────
export default function SettingsPage({ view = 'main', onBack, onOpenPassword, onClosePassword }) {
  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-2xl mx-auto">
        {view === 'main' && (
          <MainSettingsView
            onBack={onBack}
            onOpenPassword={onOpenPassword}
          />
        )}
        {view === 'password' && (
          <ChangePasswordView onBack={onClosePassword} />
        )}
      </div>
    </div>
  );
}
