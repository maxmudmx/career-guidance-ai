/**
 * Kasbim — ML Recommender System (diplom versiyasi)
 */

import { useState, useEffect, useRef } from 'react';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import TestIntroPage from './pages/TestIntroPage';
import RiasecTest from './pages/RiasecTest';
import AcademicSkills from './pages/AcademicSkills';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ContactPage from './pages/ContactPage';
import TestDetailPage from './pages/TestDetailPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { authAPI, tokenStorage } from './services/api';
import { ChevronDown } from './components/ChevronDown';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import { LANGUAGE_OPTIONS } from './i18n/translations';
import './index.css';


// ─── Theme toggle (Sun / Moon SVG) ──────────────────────────
function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Light' : 'Dark'}
      className="p-2 rounded-lg transition-opacity hover:opacity-70 flex-shrink-0"
      style={{ color: 'var(--text)' }}
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/>
          <path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}


// ─── Language dropdown ──────────────────────────────────────
function LanguageDropdown() {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const current = LANGUAGE_OPTIONS.find((o) => o.code === lang) || LANGUAGE_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ color: 'var(--text)' }}
      >
        {current.flag}
        <ChevronDown open={open} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-lg overflow-hidden border min-w-[140px] z-[60]"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => { setLang(opt.code); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:opacity-80"
              style={{
                background: opt.code === lang ? 'var(--bg-hover)' : 'transparent',
                color: 'var(--text)',
              }}
            >
              <span className="font-semibold text-xs w-7">{opt.flag}</span>
              <span>{opt.label}</span>
              {opt.code === lang && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


function MobileMenuItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 text-base font-medium transition-colors"
      style={{
        background: active ? 'var(--bg-hover)' : 'transparent',
        color: 'var(--text)',
      }}
    >
      {label}
    </button>
  );
}


function TopBar({ user, route, onNavigate, onLogout, onStartTest }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const NavLink = ({ label, target, primary }) => (
    <button
      onClick={() => { onNavigate(target); setMenuOpen(false); }}
      className={`px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap ${
        route === target ? 'opacity-100 font-semibold' : 'opacity-70 hover:opacity-100 font-medium'
      }`}
      style={{
        background: primary ? 'var(--text)' : 'transparent',
        color: primary ? 'var(--bg)' : 'var(--text)',
      }}
    >
      {label}
    </button>
  );

  return (
    <nav
      className="sticky top-0 z-50 font-sans"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">
          {/* Left: Logo */}
          <div className="flex items-center justify-start flex-shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="text-lg font-bold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text)' }}
            >
              Kasbim
            </button>
          </div>

          {/* Center: Nav links */}
          <div className="hidden md:flex items-center justify-center gap-2 flex-1">
            {user && (
              <>
                <NavLink label={t('nav.home')} target="home" />
                <NavLink label={t('nav.test')} target="test" />
                <NavLink label={t('nav.history')} target="history" />
                <NavLink label={t('nav.settings')} target="settings" />
                <NavLink label={t('nav.contact')} target="contact" />
              </>
            )}
          </div>

          {/* Right: Theme + Lang + Profile icon (or Login button) */}
          <div className="hidden md:flex items-center justify-end gap-2 flex-shrink-0">
            <ThemeToggleButton />
            <LanguageDropdown />
            {user ? (
              <button
                onClick={() => onNavigate('profile')}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                style={{
                  background: route === 'profile' ? 'var(--accent-soft)' : 'transparent',
                  color: 'var(--text)',
                }}
                aria-label={t('nav.profile')}
                title={t('nav.profile')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={onStartTest}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                style={{ background: 'var(--text)', color: 'var(--bg)' }}
              >
                {t('nav.login_register')}
              </button>
            )}
          </div>

          {/* Mobile right */}
          <div className="md:hidden flex items-center justify-end gap-1.5 flex-1">
            <ThemeToggleButton />
            <LanguageDropdown />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
            >
              {menuOpen ? t('nav.close') : t('nav.menu')}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="md:hidden border-t overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            {user ? (
              <div className="flex flex-col py-2">
                <MobileMenuItem
                  label={t('nav.home')}
                  active={route === 'home'}
                  onClick={() => { onNavigate('home'); setMenuOpen(false); }}
                />
                <MobileMenuItem
                  label={t('nav.test')}
                  active={route === 'test'}
                  onClick={() => { onNavigate('test'); setMenuOpen(false); }}
                />
                <MobileMenuItem
                  label={t('nav.history')}
                  active={route === 'history'}
                  onClick={() => { onNavigate('history'); setMenuOpen(false); }}
                />
                <MobileMenuItem
                  label={t('nav.profile')}
                  active={route === 'profile'}
                  onClick={() => { onNavigate('profile'); setMenuOpen(false); }}
                />
                <MobileMenuItem
                  label={t('nav.settings')}
                  active={route === 'settings'}
                  onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                />
                <MobileMenuItem
                  label={t('nav.contact')}
                  active={route === 'contact'}
                  onClick={() => { onNavigate('contact'); setMenuOpen(false); }}
                />
              </div>
            ) : (
              <div className="py-4">
                <button
                  onClick={() => { onStartTest(); setMenuOpen(false); }}
                  className="w-full px-4 py-3 rounded-lg text-base font-semibold"
                  style={{ background: 'var(--text)', color: 'var(--bg)' }}
                >
                  {t('nav.login_register')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}


function AppInner() {
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [step, setStep] = useState(0);
  const [riasecScores, setRiasecScores] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    authAPI.me()
      .then((res) => setUser(res.data))
      .catch(() => tokenStorage.clear())
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      </div>
    );
  }

  if (showAuth && !user) {
    return (
      <AuthPage
        onAuth={(u) => {
          setUser(u);
          setShowAuth(false);
          setRoute('test');
          setStep(0);
        }}
      />
    );
  }

  const handleLogout = () => {
    tokenStorage.clear();
    setUser(null);
    setRoute('home');
    setStep(0);
    setRiasecScores(null);
    setAcademicData(null);
  };

  const handleNavigate = (target) => {
    if (target === 'test' && !user) {
      setShowAuth(true);
      return;
    }
    if (target === 'test') {
      setStep(0);
      setRiasecScores(null);
      setAcademicData(null);
    }
    setRoute(target);
  };

  const handleStartTest = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setRoute('test');
    setStep(0);
  };

  const handleRiasecComplete = (scores) => {
    setRiasecScores(scores);
    setStep(2);
  };

  const handleAcademicComplete = (data) => {
    setAcademicData(data);
    setStep(3);
  };

  const handleRetake = () => {
    setRoute('test');
    setStep(0);
    setRiasecScores(null);
    setAcademicData(null);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopBar
        user={user}
        route={route}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onStartTest={handleStartTest}
      />

      {route === 'home' && <WelcomePage onStart={handleStartTest} />}

      {route === 'history' && user && (
        <HistoryPage
          onBack={() => setRoute('home')}
          onOpenTest={(test, testNumber) => {
            setSelectedTest({ ...test, _testNumber: testNumber });
            setRoute('test-detail');
          }}
        />
      )}

      {route === 'test-detail' && user && selectedTest && (
        <TestDetailPage
          recommendations={selectedTest.recommendations || []}
          riasecScores={selectedTest.riasec_scores || {}}
          interests={selectedTest.academic_data?.interests || []}
          subjects={selectedTest.academic_data?.subjects || []}
          createdAt={selectedTest.created_at}
          testNumber={selectedTest._testNumber}
          onBack={() => { setSelectedTest(null); setRoute('history'); }}
          onRetake={() => {
            setSelectedTest(null);
            setStep(0);
            setRiasecScores(null);
            setAcademicData(null);
            setRoute('test');
          }}
        />
      )}

      {route === 'profile' && user && (
        <ProfilePage
          user={user}
          onBack={() => setRoute('home')}
          onUserUpdate={(updated) => setUser((u) => ({ ...u, ...updated }))}
        />
      )}

      {route === 'settings' && user && (
        <SettingsPage
          user={user}
          onBack={() => setRoute('home')}
          onLogout={handleLogout}
          onNavigate={setRoute}
        />
      )}

      {route === 'password' && user && (
        <ChangePasswordPage onBack={() => setRoute('settings')} />
      )}

      {route === 'contact' && <ContactPage />}

      {route === 'test' && user && (
        <>
          {step === 0 && (
            <TestIntroPage
              onStart={() => setStep(1)}
              onBack={() => setRoute('home')}
            />
          )}
          {step === 1 && (
            <RiasecTest
              onComplete={handleRiasecComplete}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <AcademicSkills
              onComplete={handleAcademicComplete}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && riasecScores && (
            <ResultsPage
              riasecScores={riasecScores}
              academicData={academicData}
              onBack={() => setStep(2)}
              onRetake={handleRetake}
            />
          )}
        </>
      )}
    </div>
  );
}


export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </LanguageProvider>
  );
}
