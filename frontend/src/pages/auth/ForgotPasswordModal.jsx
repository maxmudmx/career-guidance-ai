import { useState } from 'react';
import { Mail, X, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui';
import { Field } from './Field';
import { authAPI } from '../../services/api';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Parolni unutdingizmi modal — email kiritish va havola yuborish.
 * Kasbim Dark Theme.
 */
export default function ForgotPasswordModal({ initialEmail = '', onClose }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError('Email kiriting');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError('Yaroqli email kiriting');
      return;
    }

    setError('');
    setServerError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(trimmed);
      setSent(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 429) {
        setServerError(
          typeof detail === 'string'
            ? detail
            : 'Iltimos, 1 daqiqa kuting va qayta urinib ko\'ring.',
        );
      } else {
        setServerError(
          typeof detail === 'string'
            ? detail
            : "Xatolik yuz berdi. Birozdan keyin urinib ko'ring.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl overflow-hidden relative animate-in"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-elevated, 0 16px 48px rgba(0,0,0,0.6))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              background:
                'radial-gradient(circle, rgba(96,165,250,0.4) 0%, transparent 70%)',
            }}
          />
          <div className="flex items-center gap-3 relative z-10">
            <button
              type="button"
              onClick={onClose}
              aria-label="Orqaga"
              className="text-white/90 hover:text-white transition p-1 -ml-1"
            >
              <ArrowLeft size={20} />
            </button>
            <h2
              className="text-white text-xl font-bold"
              style={{ letterSpacing: '-0.02em' }}
            >
              Parolni tiklash
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="text-white/70 hover:text-white transition p-1 relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 pt-6 pb-7">
          {sent ? (
            // ── Muvaffaqiyat ekrani ──
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.3)',
                }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: 'var(--success)' }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: 'var(--text)' }}
              >
                Havola yuborildi
              </h3>
              <p
                className="text-sm leading-relaxed mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Agar bu email tizimda ro'yxatdan o'tgan bo'lsa, parolni tiklash
                havolasi pochtangizga yuborildi.
              </p>
              <p className="text-sm font-medium mb-5" style={{ color: 'var(--accent)' }}>
                {email}
              </p>
              <p
                className="text-xs leading-relaxed mb-6"
                style={{ color: 'var(--text-faint)' }}
              >
                Pochtangizni (jumladan <strong>Spam</strong> va{' '}
                <strong>Promotions</strong> papkalarini) tekshiring. Havola 2
                soat amal qiladi.
              </p>
              <Button
                variant="primary"
                onClick={onClose}
                className="w-full"
              >
                Tushunarli
              </Button>
            </div>
          ) : (
            // ── Email kiritish formasi ──
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="text-center mb-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }}
                >
                  <Mail className="w-7 h-7" style={{ color: 'var(--accent)' }} />
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Hisobingiz bilan bog'langan emailni kiriting. Sizga parolni
                  tiklash uchun havola yuboramiz.
                </p>
              </div>

              <Field
                label="Email manzilingiz"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                  if (serverError) setServerError('');
                }}
                placeholder="example@gmail.com"
                autoComplete="email"
                error={error}
              />

              {serverError && (
                <div
                  className="p-3 rounded-lg text-sm flex items-start gap-2"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: 'var(--error)',
                  }}
                >
                  <span>{serverError}</span>
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
                  'Havolani yuborish'
                )}
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-sm font-medium transition-colors py-2"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = '#F1F5F9')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = '#94A3B8')
                }
              >
                Kirish sahifasiga qaytish
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
