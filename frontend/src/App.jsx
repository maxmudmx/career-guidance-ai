/**
 * Kasbim — ML Recommender System (diplom versiyasi)
 */

import { useState, useEffect } from 'react';
import {
  Brain, LogOut, Loader2, History, User, Sun, Moon,
  Home, ClipboardList, Menu, X, Settings,
} from 'lucide-react';
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
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import './index.css';


function TopBar({ user, route, onNavigate, onLogout, onStartTest }) {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const NavLink = ({ icon: Icon, label, target, primary }) => (
    <button
      onClick={() => { onNavigate(target); setMenuOpen(false); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        route === target ? 'opacity-100' : 'opacity-70 hover:opacity-100'
      }`}
      style={{
        background: primary
          ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
          : route === target ? 'var(--accent-soft)' : 'transparent',
        color: primary ? 'white' : 'var(--text)',
      }}
    >
      <Icon size={14} />
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
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Kasbim
            </span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <NavLink icon={Home} label="Bosh sahifa" target="home" />
                <NavLink icon={ClipboardList} label="Test" target="test" primary />
                <NavLink icon={History} label="Tarix" target="history" />
                <NavLink icon={User} label="Profil" target="profile" />
                <NavLink icon={Settings} label="Sozlamalar" target="settings" />

                <button
                  onClick={toggle}
                  className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                  title={theme === 'dark' ? "Yorug' rejim" : "Tungi rejim"}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                  title="Chiqish"
                >
                  <LogOut size={14} />
                  Chiqish
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggle}
                  className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={onStartTest}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    color: 'white',
                  }}
                >
                  Kirish / Ro'yxatdan o'tish
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div
            className="md:hidden py-3 border-t flex flex-col gap-1"
            style={{ borderColor: 'var(--border)' }}
          >
            {user ? (
              <>
                <NavLink icon={Home} label="Bosh sahifa" target="home" />
                <NavLink icon={ClipboardList} label="Test boshlash" target="test" />
                <NavLink icon={History} label="Tarix" target="history" />
                <NavLink icon={User} label="Profil" target="profile" />
                <NavLink icon={Settings} label="Sozlamalar" target="settings" />
                <button
                  onClick={toggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium opacity-70 hover:opacity-100"
                  style={{ color: 'var(--text)' }}
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === 'dark' ? "Yorug' rejim" : "Tungi rejim"}
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium opacity-70 hover:opacity-100"
                  style={{ color: 'var(--text)' }}
                >
                  <LogOut size={14} /> Chiqish
                </button>
              </>
            ) : (
              <button
                onClick={() => { onStartTest(); setMenuOpen(false); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  color: 'white',
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
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
