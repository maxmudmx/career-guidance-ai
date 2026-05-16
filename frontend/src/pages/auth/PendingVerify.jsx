import { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
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
      setError(typeof detail === 'string' ? detail : "Kod noto'g'ri yoki muddati tugagan.");
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (isComplete && !verifying) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-[#EFF6FF] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-[#2563EB]" />
        </div>
        <h2 className="text-2xl text-[#111827] mb-2 font-semibold">Tasdiqlash kodini kiriting</h2>
        <p className="text-[#4B5563] text-sm">
          {fromRegister
            ? "Ro'yxatdan o'tdingiz! 6 raqamli kodni quyidagi manzilga yubordik:"
            : 'Tizimga kirish uchun emailingizni tasdiqlang. Kod yuborilgan manzil:'}
        </p>
        <p className="text-[#2563EB] text-sm break-all mt-2 font-medium">{email}</p>
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
              className="w-11 h-14 text-center text-2xl font-bold border-2 border-[#E5E7EB] rounded-lg focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-colors disabled:opacity-50 disabled:bg-gray-50"
            />
          ))}
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626] flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {resendState.sent && (
          <div className="mb-3 p-2.5 bg-[#ECFDF5] border border-[#BBF7D0] rounded-lg text-xs text-[#16A34A] flex items-center gap-2">
            <CheckCircle size={14} /> Yangi kod yuborildi
          </div>
        )}
        {resendState.error && (
          <div className="mb-3 p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626] flex items-center gap-2">
            <AlertCircle size={14} /> {resendState.error}
          </div>
        )}

        <Button
          variant="primary"
          type="button"
          onClick={handleVerify}
          disabled={!isComplete || verifying}
          className="w-full mb-3"
        >
          {verifying ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Tasdiqlash'
          )}
        </Button>

        <button
          type="button"
          onClick={onResend}
          disabled={resendState.loading || verifying}
          className="w-full text-xs text-[#4B5563] hover:text-[#2563EB] hover:underline transition-colors disabled:opacity-50"
        >
          {resendState.loading ? 'Yuborilmoqda...' : 'Kod kelmadimi? Qayta yuborish'}
        </button>

        <p className="text-xs text-[#6B7280] mt-4 leading-relaxed text-center">
          Pochtangizni (jumladan <strong>Spam</strong> papkasini) tekshiring. Kod 15 daqiqa amal qiladi.
        </p>
      </Card>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#4B5563] hover:text-[#111827] hover:underline transition-colors"
        >
          Kirish sahifasiga qaytish
        </button>
      </div>
    </div>
  );
}
