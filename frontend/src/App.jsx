/**
 * Kasbim — ML Recommender System (diplom versiyasi)
 */

import { useState, useEffect } from 'react';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import TestIntroPage from './pages/TestIntroPage';
import RiasecTest from './pages/RiasecTest';
import AcademicSkills from './pages/AcademicSkills';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import { authAPI, tokenStorage } from './services/api';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';


function TopBar({ user, route, onNavigate, onLogout, onStartTest }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const NavLink = ({ label, target, primary }) => (
    <button
      onClick={() => { onNavigate(target); setMenuOpen(false); }}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        route === target ? 'opacity-100' : 'opacity-70 hover:opacity-100'
      }`}
      style={{
        background: primary
          ? 'var(--text)'
          : route === target ? 'var(--accent-soft)' : 'transparent',
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
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => onNavigate('home')}
            className="text-lg font-bold hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text)' }}
          >
            Kasbim
          </button>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <NavLink label="Bosh sahifa" target="home" />
                <NavLink label="Test" target="test" primary />
                <NavLink label="Tarix" target="history" />
                <NavLink label="Profil" target="profile" />
                <NavLink label="Sozlamalar" target="settings" />
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                >
                  Chiqish
                </button>
              </>
            ) : (
              <button
                onClick={onStartTest}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: 'var(--text)',
                  color: 'var(--bg)',
                }}
              >
                Kirish / Ro'yxatdan o'tish
              </button>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
          >
            {menuOpen ? 'Yopish' : 'Menyu'}
          </button>
        </div>

        {menuOpen && (
          <div
            className="md:hidden py-3 border-t flex flex-col gap-1"
            style={{ borderColor: 'var(--border)' }}
          >
            {user ? (
              <>
                <NavLink label="Bosh sahifa" target="home" />
                <NavLink label="Test boshlash" target="test" />
                <NavLink label="Tarix" target="history" />
                <NavLink label="Profil" target="profile" />
                <NavLink label="Sozlamalar" target="settings" />
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium opacity-70 hover:opacity-100 text-left"
                  style={{ color: 'var(--text)' }}
                >
                  Chiqish
                </button>
              </>
            ) : (
              <button
                onClick={() => { onStartTest(); setMenuOpen(false); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  background: 'var(--text)',
                  color: 'var(--bg)',
                }}
              >
                Kirish / Ro'yxatdan o'tish
              </button>
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
        <HistoryPage onBack={() => setRoute('home')} />
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
        />
      )}

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
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
