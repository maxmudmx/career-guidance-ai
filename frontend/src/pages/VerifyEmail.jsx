import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, ArrowRight, Brain } from 'lucide-react';
import { authAPI, tokenStorage } from '../services/api';
import { Button, Card } from '../components/ui';

export default function VerifyEmail({ token, onDone }) {
  const [state, setState] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage("Havola noto'g'ri.");
      return;
    }
    let cancelled = false;
    authAPI
      .verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        setState('success');
        setMessage(res.data?.message || 'Email muvaffaqiyatli tasdiqlandi.');
        if (res.data?.access_token && res.data?.user) {
          tokenStorage.set(res.data.access_token);
          tokenStorage.setUser(res.data.user);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState('error');
        setMessage(err?.response?.data?.detail || 'Tasdiqlashda xatolik yuz berdi.');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleContinue = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    onDone?.();
  };

  const isLoggedIn = !!tokenStorage.get();

  const statusConfig = {
    loading: {
      Icon: Loader2,
      iconColor: 'text-[#2563EB]',
      iconBg: 'bg-[#EFF6FF]',
      iconBorder: 'border-[#DBEAFE]',
      title: 'Tasdiqlanmoqda...',
      spinning: true,
    },
    success: {
      Icon: CheckCircle,
      iconColor: 'text-[#16A34A]',
      iconBg: 'bg-[#ECFDF5]',
      iconBorder: 'border-[#BBF7D0]',
      title: 'Email tasdiqlandi!',
      spinning: false,
    },
    error: {
      Icon: AlertCircle,
      iconColor: 'text-[#DC2626]',
      iconBg: 'bg-[#FEF2F2]',
      iconBorder: 'border-[#FECACA]',
      title: 'Tasdiqlash amalga oshmadi',
      spinning: false,
    },
  }[state];

  const { Icon } = statusConfig;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
        </div>

        <Card className="p-8 text-center">
          <div
            className={`w-16 h-16 mx-auto mb-5 rounded-full ${statusConfig.iconBg} border ${statusConfig.iconBorder} flex items-center justify-center`}
          >
            <Icon
              size={32}
              className={`${statusConfig.iconColor} ${statusConfig.spinning ? 'animate-spin' : ''}`}
            />
          </div>

          <h1 className="text-xl text-[#111827] mb-2 font-semibold">{statusConfig.title}</h1>

          <p className="text-sm text-[#4B5563] mb-6 leading-relaxed">
            {message || (state === 'loading' ? 'Iltimos kuting...' : '')}
          </p>

          {state !== 'loading' && (
            <Button variant="primary" size="md" onClick={handleContinue}>
              {isLoggedIn ? 'Asosiy sahifaga' : 'Kirish sahifasiga'}
              <ArrowRight size={16} />
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
