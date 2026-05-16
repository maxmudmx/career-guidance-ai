import { useState } from 'react';
import { Brain } from 'lucide-react';
import { authAPI, tokenStorage } from '../services/api';
import SignUpForm from './auth/SignUpForm';
import LoginForm from './auth/LoginForm';
import { Card } from '../components/ui';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function validateRegister({ username, email, password }) {
  const e = {};
  if (!username?.trim()) e.username = 'Username majburiy';
  else if (!/^[a-zA-Z0-9_.]+$/.test(username)) e.username = "Faqat harf, raqam, '_' va '.'";
  if (!email?.trim()) e.email = 'Email majburiy';
  else if (!isValidEmail(email)) e.email = 'Yaroqli email kiriting';
  if (!password) e.password = 'Parol majburiy';
  else if (password.length < 6) e.password = 'Kamida 6 ta belgi';
  return e;
}

function validateLogin({ username, password }) {
  const e = {};
  if (!username?.trim()) e.username = 'Username yoki email majburiy';
  if (!password) e.password = 'Parol majburiy';
  return e;
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setServerError('');
    setForm({ username: '', email: '', password: '' });
    setAgreed(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validate = mode === 'signup' ? validateRegister : validateLogin;
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const res = mode === 'signup'
        ? await authAPI.register({
            username: form.username,
            email: form.email,
            password: form.password,
            full_name: form.username,
          })
        : await authAPI.login({ username: form.username, password: form.password });

      tokenStorage.set(res.data.access_token);
      tokenStorage.setUser(res.data.user);
      onAuth(res.data.user, res.data.access_token);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : (typeof detail === 'string' ? detail : detail?.message) ||
          "Xatolik yuz berdi. Qayta urinib ko'ring.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

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
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: '#3B82F6',
              boxShadow: '0 0 28px rgba(59,130,246,0.45)',
            }}
          >
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h2
            className="text-3xl mb-2 font-bold"
            style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            {isSignup ? 'Hisob yaratish' : 'Xush kelibsiz'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isSignup
              ? "Kasbingizni topish uchun ro'yxatdan o'ting"
              : 'Hisobingizga kiring'}
          </p>
        </div>

        <Card className="p-6">
          {isSignup ? (
            <SignUpForm
              form={form}
              errors={errors}
              serverError={serverError}
              loading={loading}
              onChange={handleChange}
              onSubmit={handleSubmit}
              agreed={agreed}
              onAgreeChange={(e) => setAgreed(e.target.checked)}
            />
          ) : (
            <LoginForm
              form={form}
              errors={errors}
              serverError={serverError}
              loading={loading}
              onChange={handleChange}
              onSubmit={handleSubmit}
              remember={remember}
              onRememberChange={(e) => setRemember(e.target.checked)}
            />
          )}
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isSignup ? 'Hisobingiz bormi?' : "Hisobingiz yo'qmi?"}{' '}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? 'login' : 'signup')}
              className="font-semibold hover:underline transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              {isSignup ? 'Kirish' : "Ro'yxatdan o'tish"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
