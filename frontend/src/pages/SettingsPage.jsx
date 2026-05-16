import { useState } from 'react';
import {
  Settings, Moon, Sun, LogOut, Info, Brain,
} from 'lucide-react';
import { Card } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';


export default function SettingsPage({ user, onLogout }) {
  const { theme, toggle } = useTheme();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Settings className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          Sozlamalar
        </h1>

        {/* Theme toggle (switch) */}
        <Card className="overflow-hidden mb-3">
          <div className="flex items-center gap-4 px-5 py-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-soft)' }}
            >
              {theme === 'dark'
                ? <Moon size={18} style={{ color: 'var(--accent)' }} />
                : <Sun size={18} style={{ color: 'var(--accent)' }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {theme === 'dark' ? 'Tungi rejim' : "Yorug' rejim"}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {theme === 'dark' ? 'Qorong\'u mavzu yoniq' : "Yorug' mavzu yoniq"}
              </div>
            </div>
            <Switch checked={theme === 'dark'} onChange={toggle} />
          </div>
        </Card>

        {/* About */}
        <Card className="overflow-hidden mb-3">
          <button
            onClick={() => setAboutOpen(!aboutOpen)}
            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-opacity hover:opacity-90"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-soft)' }}
            >
              <Info size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Ilova haqida
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Versiya va qisqacha ma'lumot
              </div>
            </div>
            <div
              className="text-xs font-medium px-3 py-1 rounded-lg"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            >
              {aboutOpen ? "Yopish" : "Ko'rish"}
            </div>
          </button>

          {aboutOpen && (
            <div
              className="px-5 py-4 border-t"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                >
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                    Kasbim
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Versiya 3.0.0
                  </div>
                </div>
              </div>

              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sun'iy intellekt asosida sizning shaxsiyatingiz, qiziqishlaringiz va
                akademik natijalaringizga muvofiq eng mos kasblarni topib beruvchi tizim.
              </p>
            </div>
          )}
        </Card>

        {/* Logout */}
        {user && (
          <Card className="overflow-hidden">
            <button
              onClick={() => {
                if (confirm("Rostdan ham chiqishni xohlaysizmi?")) {
                  onLogout();
                }
              }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-opacity hover:opacity-90"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(220, 38, 38, 0.12)' }}
              >
                <LogOut size={18} style={{ color: '#DC2626' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: '#DC2626' }}>
                  Tizimdan chiqish
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  @{user.username} hisobidan chiqib ketish
                </div>
              </div>
              <div
                className="text-xs font-medium px-3 py-1 rounded-lg"
                style={{ background: 'rgba(220, 38, 38, 0.12)', color: '#DC2626' }}
              >
                Chiqish
              </div>
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}


function Switch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0"
      style={{
        background: checked ? 'var(--accent)' : 'var(--bg-hover)',
      }}
    >
      <div
        className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow"
        style={{ left: checked ? '24px' : '4px' }}
      />
    </button>
  );
}
