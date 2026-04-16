import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI, tokenStorage } from '../services/api';
import styles from './AuthPage.module.css';

// ---- Validatsiya ----
function validateRegister({ username, email, password, full_name }) {
  const errors = {};
  if (!full_name?.trim()) errors.full_name = "Ism majburiy";
  if (!username?.trim()) errors.username = "Username majburiy";
  else if (username.length < 3) errors.username = "Username kamida 3 ta belgi";
  else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = "Faqat harf, raqam va _ mumkin";
  if (!email?.trim()) errors.email = "Email majburiy";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email formati noto'g'ri";
  if (!password) errors.password = "Parol majburiy";
  else if (password.length < 6) errors.password = "Parol kamida 6 ta belgi";
  return errors;
}

function validateLogin({ username, password }) {
  const errors = {};
  if (!username?.trim()) errors.username = "Username majburiy";
  if (!password) errors.password = "Parol majburiy";
  return errors;
}

// ---- Input komponenti ----
function Field({ label, name, type = 'text', value, onChange, error, icon: Icon, placeholder, rightEl }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.inputError : ''}`}>
        {Icon && <Icon size={16} className={styles.inputIcon} />}
        <input
          className={styles.input}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name === 'password' ? 'current-password' : name}
        />
        {rightEl}
      </div>
      {error && (
        <span className={styles.errorMsg}>
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
}

// ---- Asosiy komponent ----
export default function AuthPage({ onAuth, darkMode, onToggleDark }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
    if (serverError) setServerError('');
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setServerError('');
    setForm({ username: '', email: '', password: '', full_name: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validate = mode === 'register' ? validateRegister : validateLogin;
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      const res = mode === 'register'
        ? await authAPI.register({ username: form.username, email: form.email, password: form.password, full_name: form.full_name })
        : await authAPI.login({ username: form.username, password: form.password });

      tokenStorage.set(res.data.access_token);
      tokenStorage.setUser(res.data.user);
      onAuth(res.data.user, res.data.access_token);
    } catch (err) {
      const msg = err.response?.data?.detail || "Xatolik yuz berdi. Qayta urinib ko'ring.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Orqa fon */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Dark mode toggle */}
      <button className={styles.darkToggle} onClick={onToggleDark} title="Rejimni o'zgartirish">
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className={styles.wrapper}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Brain size={28} color="white" />
          </div>
          <div>
            <h1 className={styles.brandName}>KasbYo'lAI</h1>
            <p className={styles.brandTagline}>AI asosida kasbga yo'naltiruvchi tizim</p>
          </div>
        </div>

        {/* Karta */}
        <div className={styles.card}>
          {/* Tab */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
              onClick={() => switchMode('login')}
              type="button"
            >
              Kirish
            </button>
            <button
              className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
              onClick={() => switchMode('register')}
              type="button"
            >
              Ro'yxatdan o'tish
            </button>
            <div className={`${styles.tabSlider} ${mode === 'register' ? styles.tabSliderRight : ''}`} />
          </div>

          {/* Sarlavha */}
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>
              {mode === 'login' ? 'Xush kelibsiz!' : 'Hisob yarating'}
            </h2>
            <p className={styles.cardSub}>
              {mode === 'login'
                ? 'Davom ettirish uchun tizimga kiring'
                : "AI karyera yordamchisidan foydalaning"}
            </p>
          </div>

          {/* Forma */}
          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <Field
                label="To'liq ismingiz"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                error={errors.full_name}
                icon={User}
                placeholder="Ism Familiya"
              />
            )}

            <Field
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              icon={User}
              placeholder="username"
            />

            {mode === 'register' && (
              <Field
                label="Email manzil"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                icon={Mail}
                placeholder="email@example.com"
              />
            )}

            <Field
              label="Parol"
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              icon={Lock}
              placeholder={mode === 'register' ? 'Kamida 6 ta belgi' : 'Parolni kiriting'}
              rightEl={
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {/* Server xatosi */}
            {serverError && (
              <div className={styles.serverError}>
                <AlertCircle size={15} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Switch */}
          <p className={styles.switchText}>
            {mode === 'login' ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}
            {' '}
            <button
              className={styles.switchLink}
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              type="button"
            >
              {mode === 'login' ? "Ro'yxatdan o'ting" : 'Kiring'}
            </button>
          </p>
        </div>

        {/* Imtiyozlar */}
        <div className={styles.perks}>
          {[
            "AI asosida kasb tavsiyalari",
            "Real HH.uz vakansiyalari",
            "Shaxsiy o'quv yo'l xaritasi",
          ].map((t, i) => (
            <div key={i} className={styles.perk}>
              <CheckCircle size={14} color="var(--accent)" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
