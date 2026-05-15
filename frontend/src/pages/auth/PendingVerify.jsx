import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Card } from '../../components/ui';

export default function PendingVerify({ email, fromRegister, resendState, onResend, onBack }) {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-[#EFF6FF] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-[#2563EB]" />
        </div>
        <h2 className="text-2xl text-[#111827] mb-2 font-semibold">Pochtangizni tekshiring</h2>
        <p className="text-[#4B5563] text-sm">
          {fromRegister
            ? "Ro'yxatdan o'tdingiz! Tasdiqlash havolasini yubordik:"
            : 'Tizimga kirish uchun avval emailingizni tasdiqlang. Havola yuborilgan manzil:'}
        </p>
        <p className="text-[#2563EB] text-sm break-all mt-2 font-medium">{email}</p>
      </div>

      <Card className="p-6">
        <p className="text-xs text-[#6B7280] mb-4 leading-relaxed">
          Pochtangizni (jumladan <strong>Spam</strong> va <strong>Promotions</strong>{' '}
          papkalarini) tekshiring. Havolani bosing — keyin tizimga kirishingiz mumkin.
        </p>

        {resendState.sent && (
          <div className="mb-3 p-2.5 bg-[#ECFDF5] border border-[#BBF7D0] rounded-lg text-xs text-[#16A34A] flex items-center gap-2">
            <CheckCircle size={14} /> Yangi havola yuborildi
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
          onClick={onResend}
          disabled={resendState.loading}
          className="w-full"
        >
          {resendState.loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Havola kelmadimi? Qayta yuborish'
          )}
        </Button>
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
