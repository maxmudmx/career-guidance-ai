import { useState, useRef, useEffect } from 'react';
import { Button, Card } from '../../components/ui';
import { authAPI, tokenStorage } from '../../services/api';

export default function PendingVerify({
  email,
  fromRegister,
  resendState,
  onResend,
  onBack,
  onVerified,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const code = digits.join('');
  const isComplete = code.length === 6 && /^\d{6}$/.test(code);

  const handleChange = (i, value) => {
    const v = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (error) setError('');
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      inputsRef.current[i + 1]?.focus();
    } else if (e.key === 'Enter' && isComplete) {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(next);
    setError('');
    const lastIdx = Math.min(pasted.length, 5);
    inputsRef.current[lastIdx]?.focus();
  };

  const handleVerify = async () => {
    if (!isComplete || verifying) return;
    setVerifying(true);
    setError('');
    try {
      const res = await authAPI.verifyEmail(email, code);
      if (res.data?.access_token && res.data?.user) {
        tokenStorage.set(res.data.access_token);
        tokenStorage.setUser(res.data.user);
      }
      onVerified?.(res.data?.user);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : "Kod noto'g'ri yoki muddati tugagan");
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (isComplete && !verifying) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Tasdiqlash kodini kiriting
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {fromRegister
            ? "Ro'yxatdan o'tdingiz! 6 raqamli kod yuborilgan manzil:"
            : 'Emailingizni tasdiqlash uchun kod yuborilgan manzil:'}
        </p>
        <p className="text-sm break-all mt-2 font-medium" style={{ color: 'var(--text)' }}>
          {email}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex justify-between gap-2 mb-4" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={verifying}
              className="w-11 h-14 text-center text-2xl font-bold rounded-lg outline-none transition-colors disabled:opacity-50"
              style={{
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '2px solid var(--border)',
              }}
            />
          ))}
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
            {error}
          </div>
        )}

        {resendState.sent && (
          <div className="mb-3 p-2.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
            Yangi kod yuborildi
          </div>
        )}
        {resendState.error && (
          <div className="mb-3 p-2.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
            {resendState.error}
          </div>
        )}

        <Button
          variant="primary"
          type="button"
          onClick={handleVerify}
          disabled={!isComplete || verifying}
          className="w-full mb-3"
        >
          {verifying ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
        </Button>

        <button
          type="button"
          onClick={onResend}
          disabled={resendState.loading || verifying}
          className="w-full text-xs hover:underline transition-colors disabled:opacity-50"
          style={{ color: 'var(--text-muted)' }}
        >
          {resendState.loading ? 'Yuborilmoqda...' : "Kod kelmadimi? Qayta yuborish"}
        </button>

        <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-faint)' }}>
          Pochtangizni (Spam papkasini ham) tekshiring. Kod 15 daqiqa amal qiladi.
        </p>
      </Card>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm hover:underline transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Kirish sahifasiga qaytish
        </button>
      </div>
    </div>
  );
}
