import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, X } from 'lucide-react';
import { authAPI } from '../services/api';

export default function VerifyEmailBanner({ user, onDismiss }) {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | cooldown
  const [errorMsg, setErrorMsg] = useState('');
  const [hidden, setHidden] = useState(false);

  if (!user || user.is_verified || hidden) return null;

  const handleResend = async () => {
    if (status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    try {
      await authAPI.resendVerification(user.email);
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      const code = err?.response?.status;
      const detail = err?.response?.data?.detail || "Yuborib bo'lmadi.";
      if (code === 429) {
        setStatus('cooldown');
        setErrorMsg(detail);
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        setStatus('error');
        setErrorMsg(detail);
        setTimeout(() => setStatus('idle'), 4000);
      }
    }
  };

  const handleDismiss = () => {
    setHidden(true);
    onDismiss?.();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex-wrap">
        <div className="w-9 h-9 rounded-lg bg-white border border-[#FDE68A] flex items-center justify-center flex-shrink-0">
          <Mail className="w-4 h-4 text-[#F59E0B]" />
        </div>

        <div className="flex-1 min-w-[220px]">
          <div className="text-sm font-semibold text-[#92400E] mb-0.5">
            Email tasdiqlanmagan
          </div>
          <div className="text-xs text-[#92400E]/80 leading-relaxed">
            <strong className="text-[#92400E]">{user.email}</strong> manziliga yuborilgan
            6 raqamli kodni kiriting. Spam papkasini ham tekshiring.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'sent' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
              <CheckCircle className="w-3.5 h-3.5" /> Yuborildi
            </span>
          )}
          {(status === 'error' || status === 'cooldown') && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] max-w-[220px] leading-snug">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errorMsg}
            </span>
          )}
          {(status === 'idle' || status === 'sending') && (
            <button
              type="button"
              onClick={handleResend}
              disabled={status === 'sending'}
              className="px-3 py-1.5 rounded-lg border border-[#FDE68A] bg-white text-[#D97706] text-xs font-semibold hover:bg-[#FFFBEB] transition-colors disabled:cursor-wait whitespace-nowrap"
            >
              {status === 'sending' ? 'Yuborilmoqda...' : "Qayta jo'natish"}
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            title="Yopish"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#92400E] hover:bg-[#FEF3C7] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
