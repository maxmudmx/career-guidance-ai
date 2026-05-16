/**
 * Kasbim — ML Recommender System (diplom versiyasi)
 *
 * Oqim:
 *   Welcome -> Auth -> TestIntro -> RIASEC Test -> Academic Skills -> Results
 *
 * State machine:
 *   step = 0  → WelcomePage (boshlash)
 *   step = 1  → TestIntroPage (qadamlar haqida ma'lumot)
 *   step = 2  → RiasecTest (30 ta savol)
 *   step = 3  → AcademicSkills (qiziqishlar + fanlar)
 *   step = 4  → ResultsPage (ML tavsiyalar)
 *
 * Auth bo'lmasa, har qaysi qadamda AuthPage ko'rinadi.
 */

import { useState, useEffect } from 'react';
import { Brain, LogOut, Loader2 } from 'lucide-react';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import TestIntroPage from './pages/TestIntroPage';
import RiasecTest from './pages/RiasecTest';
import AcademicSkills from './pages/AcademicSkills';
import ResultsPage from './pages/ResultsPage';
import { authAPI, tokenStorage } from './services/api';
import { Button } from './components/ui';
import './index.css';


function TopBar({ user, onLogout, onHome }) {
  return (
    <nav
      className="sticky top-0 z-50 font-sans"
      style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={onHome}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--text)' }}
            >
              Kasbim
            </span>
          </button>

          {user && (
            <div className="flex items-center gap-3">
              <span
                className="text-sm hidden sm:block"
                style={{ color: 'var(--text-muted)' }}
              >
                {user.username}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                style={{
                  background: 'var(--bg-hover)',
                  color: 'var(--text)',
                }}
                title="Chiqish"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Chiqish</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}


export default function App() {
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Test natijalari
  const [riasecScores, setRiasecScores] = useState(null);
  const [academicData, setAcademicData] = useState(null);

  // Ilova ochilganda token tekshirish
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

  // Yuklanmoqda
  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  // Auth talab qilinadi
  if (showAuth && !user) {
    return (
      <AuthPage
        onAuth={(u) => {
          setUser(u);
          setShowAuth(false);
        }}
      />
    );
  }

  const handleLogout = () => {
    tokenStorage.clear();
    setUser(null);
    setStep(0);
    setRiasecScores(null);
    setAcademicData(null);
  };

  const handleHome = () => {
    setStep(0);
    setRiasecScores(null);
    setAcademicData(null);
  };

  const handleStart = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setStep(1);
  };

  const handleRiasecComplete = (scores) => {
    setRiasecScores(scores);
    setStep(3);
  };

  const handleAcademicComplete = (data) => {
    setAcademicData(data);
    setStep(4);
  };

  const handleRetake = () => {
    setStep(1);
    setRiasecScores(null);
    setAcademicData(null);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopBar user={user} onLogout={handleLogout} onHome={handleHome} />

      {step === 0 && <WelcomePage onStart={handleStart} />}

      {step === 1 && (
        <TestIntroPage
          onStart={() => setStep(2)}
          onBack={handleHome}
        />
      )}

      {step === 2 && (
        <RiasecTest
          onComplete={handleRiasecComplete}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <AcademicSkills
          onComplete={handleAcademicComplete}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && riasecScores && (
        <ResultsPage
          riasecScores={riasecScores}
          academicData={academicData}
          onBack={() => setStep(3)}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
