import { useState } from 'react';
import { Button, Card } from '../components/ui';
import { useTranslation } from '../contexts/LanguageContext';
import { userAPI } from '../services/api';


export default function ChangePasswordPage({ onBack }) {
  const { t } = useTranslation();
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

    if (!current || !next || !confirm) {
      setError(t('password.error.required'));
      return;
    }
    if (next.length < 6) {
      setError(t('password.error.min'));
      return;
    }
    if (next !== confirm) {
      setError(t('password.error.mismatch'));
      return;
    }
    if (current === next) {
      setError(t('password.error.same'));
      return;
    }

    setLoading(true);
    try {
      await userAPI.changePassword(current, next);
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
      setTimeout(() => {
        setSuccess(false);
        onBack?.();
      }, 1500);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          {t('password.title')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          {t('password.subtitle')}
        </p>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <PasswordInput
              label={t('password.current')}
              placeholder={t('password.current_placeholder')}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              show={showPwd}
              onToggleShow={() => setShowPwd(!showPwd)}
            />
            <PasswordInput
              label={t('password.new')}
              placeholder={t('password.new_placeholder')}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              show={showPwd}
            />
            <PasswordInput
              label={t('password.confirm')}
              placeholder={t('password.confirm_placeholder')}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              show={showPwd}
            />

            {error && (
              <div className="p-3 rounded-lg text-sm"
                style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg text-sm"
                style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
                {t('password.success')}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={onBack} disabled={loading} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || !current || !next || !confirm}
                className="flex-1"
              >
                {loading ? t('password.btn.saving') : t('password.btn.save')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}


function PasswordInput({ label, placeholder, value, onChange, show, onToggleShow }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2.5 pr-12 rounded-lg text-sm outline-none border focus:border-blue-500"
          style={{
            background: 'var(--bg)',
            color: 'var(--text)',
            borderColor: 'var(--border)',
          }}
        />
        {onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            aria-label={show ? 'Hide' : 'Show'}
          >
            {show ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
