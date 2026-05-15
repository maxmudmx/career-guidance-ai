import { useEffect, useState } from 'react';
import { Brain, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui';
import { PasswordField } from './auth/Field';
import { authAPI, tokenStorage } from '../services/api';

/* ── Stable wrappers (komponent ResetPassword'dan TASHQARIDA — fokus yo'qolmasligi uchun) ── */
function ResetContainer({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 font-sans relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          height: 350,
          background:
            'radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }}
      />
      <div className="w-full max-w-sm relative z-10">{children}</div>
    </div>
  );
}

function CheckingState() {
  return (
    <ResetContainer>
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: '#3B82F6',
            boxShadow: '0 0 28px rgba(59,130,246,0.45)',
          }}
        >
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div
          className="w-10 h-10 mx-auto rounded-full border-[3px] animate-spin"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            borderTopColor: '#3B82F6',
          }}
        />
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Havola tekshirilmoqda...
        </p>
      </div>
    </ResetContainer>
  );
}

function InvalidState({ tokenError, onBack }) {
  return (
    <ResetContainer>
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-elevated, 0 8px 32px rgba(0,0,0,0.5))',
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <AlertCircle className="w-8 h-8" style={{ color: 'var(--error)' }} />
        </div>
        <h2
          className="text-2xl mb-2 font-bold"
          style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
        >
          Havola yaroqsiz
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {tokenError}
        </p>
        <Button variant="primary" onClick={onBack} className="w-full">
          Kirish sahifasiga qaytish
        </Button>
      </div>
    </ResetContainer>
  );
}

function SuccessState() {
  return (
    <ResetContainer>
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-elevated, 0 8px 32px rgba(0,0,0,0.5))',
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.3)',
          }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: 'var(--success)' }} />
        </div>
        <h2
          className="text-2xl mb-2 font-bold"
          style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
        >
          Parol yangilandi
        </h2>
        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          Parol muvaffaqiyatli yangilandi va siz tizimga kirdingiz.
        </p>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Sahifa avtomatik o'tadi...
        </p>
      </div>
    </ResetContainer>
  );
}

/**
 * Parolni tiklash sahifasi — URL'da `?reset_token=xxx` bo'lganda ochiladi.
 */
export default function ResetPassword({ token, onDone }) {
  const [stage, setStage] = useState('checking'); // checking | form | success | invalid
  const [tokenError, setTokenError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tokenni tekshirish
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setStage('invalid');
      setTokenError("Havola noto'g'ri yoki bekor qilingan.");
      return;
    }
    authAPI
      .verifyResetToken(token)
      .then(() => {
        if (!cancelled) setStage('form');
      })
      .catch((err) => {
        if (cancelled) return;
        const detail = err.response?.data?.detail;
        setTokenError(
          typeof detail === 'string'
            ? detail
            : "Havola noto'g'ri yoki muddati tugagan.",
        );
        setStage('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!password) errs.password = 'Parol majburiy';
    else if (password.length < 6) errs.password = 'Kamida 6 ta belgi';
    if (!confirm) errs.confirm = 'Parolni tasdiqlang';
    else if (confirm !== password) errs.confirm = 'Parollar mos kelmaydi';

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setServerError('');
    setLoading(true);

    try {
      const res = await authAPI.resetPassword(token, password);
      if (res.data?.access_token) {
        tokenStorage.set(res.data.access_token);
        if (res.data.user) tokenStorage.setUser(res.data.user);
      }
      setStage('success');
      setTimeout(() => {
        onDone?.(res.data?.user || null);
      }, 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setServerError(
        typeof detail === 'string'
          ? detail
          : "Xatolik yuz berdi. Birozdan keyin urinib ko'ring.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'checking') return <CheckingState />;
  if (stage === 'invalid')
    return <InvalidState tokenError={tokenError} onBack={() => onDone?.(null)} />;
  if (stage === 'success') return <SuccessState />;

  // ── Form holati ──
  return (
    <ResetContainer>
      <div className="text-center mb-7">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: '#3B82F6',
            boxShadow: '0 0 28px rgba(59,130,246,0.45)',
          }}
        >
          <KeyRound className="w-7 h-7 text-white" />
        </div>
        <h2
          className="text-3xl mb-2 font-bold"
          style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
        >
          Yangi parol o'rnatish
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Hisobingiz uchun yangi parolni kiriting
        </p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-elevated, 0 8px 32px rgba(0,0,0,0.5))',
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <PasswordField
            label="Yangi parol"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: '' }));
            }}
            placeholder="Kamida 6 ta belgi"
            autoComplete="new-password"
            error={errors.password}
          />
          <PasswordField
            label="Parolni tasdiqlang"
            name="confirm"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((p) => ({ ...p, confirm: '' }));
            }}
            placeholder="Yana bir bor kiriting"
            autoComplete="new-password"
            error={errors.confirm}
          />

          {serverError && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--error)',
              }}
            >
              {serverError}
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Parolni yangilash'
            )}
          </Button>
        </form>
      </div>
    </ResetContainer>
  );
}
