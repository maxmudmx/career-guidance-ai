import { useState } from 'react';
import {
  Settings, Moon, Sun, LogOut, Info, ArrowLeft,
  Brain, Github, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';


export default function SettingsPage({ user, onBack, onLogout }) {
  const { theme, toggle } = useTheme();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Orqaga
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              <Settings className="inline w-6 h-6 mr-2" style={{ color: 'var(--accent)' }} />
              Sozlamalar
            </h1>
          </div>
        </div>

        {/* Theme */}
        <Card className="overflow-hidden mb-4">
          <SettingsItem
            icon={theme === 'dark' ? Sun : Moon}
            label={theme === 'dark' ? "Yorug' rejim" : "Tungi rejim"}
            description={theme === 'dark'
              ? 'Yorug\' mavzuga o\'tish'
              : 'Tungi mavzuga o\'tish'}
            onClick={toggle}
            actionLabel={theme === 'dark' ? 'Yoqish' : "Yorug'ga"}
          />
        </Card>

        {/* About */}
        <Card className="overflow-hidden mb-4">
          <SettingsItem
            icon={Info}
            label="Ilova haqida"
            description="Versiya, dasturchi, manba kodi"
            onClick={() => setAboutOpen(!aboutOpen)}
            actionLabel={aboutOpen ? "Yopish" : "Ko'rish"}
          />
          {aboutOpen && (
            <div
              className="px-5 py-4 border-t"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <div className="flex items-center gap-3 mb-4">
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
                    Versiya 3.0.0 — Diplom versiyasi
                  </div>
                </div>
              </div>

              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                ML asosli kasb tavsiya tizimi. Content-Based Filtering algoritmi
                yordamida foydalanuvchi profilingiz uchun mos kasblarni topadi.
              </p>

              <div className="space-y-2 text-xs">
                <a
                  href="https://github.com/maxmudmx/career-guidance-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  <Github size={14} />
                  GitHub manba kodi
                  <ExternalLink size={12} />
                </a>
                <a
                  href="https://career-guidance-ai-y3ku.onrender.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  <Info size={14} />
                  API hujjatlari
                  <ExternalLink size={12} />
                </a>
              </div>

              <p className="text-xs mt-4" style={{ color: 'var(--text-faint)' }}>
                © 2026 Maxmud Elmurodov. Diplom himoyasi uchun.
              </p>
            </div>
          )}
        </Card>

        {/* Akkaunt */}
        {user && (
          <Card className="overflow-hidden mb-4">
            <div
              className="px-5 py-3 text-xs font-semibold uppercase"
              style={{ color: 'var(--text-faint)' }}
            >
              Akkaunt
            </div>
            <SettingsItem
              icon={LogOut}
              label="Tizimdan chiqish"
              description={`@${user.username} hisobidan chiqib ketish`}
              onClick={() => {
                if (confirm("Rostdan ham chiqishni xohlaysizmi?")) {
                  onLogout();
                }
              }}
              actionLabel="Chiqish"
              danger
            />
          </Card>
        )}

        {/* Ogohlantirish */}
        <div className="mt-6 p-4 rounded-xl text-xs flex items-start gap-3"
          style={{ background: 'var(--accent-soft)', color: 'var(--text-muted)' }}>
          <AlertTriangle size={14} style={{ color: 'var(--accent)' }} className="mt-0.5 flex-shrink-0" />
          <div>
            <strong style={{ color: 'var(--text)' }}>Diplom versiyasi:</strong> Bu sayt
            ML Recommender System diplom ishi uchun ishlab chiqilgan. Bepul tier'da
            ishlaganligi sababli birinchi so'rov sekin ishlashi mumkin (50-60 sekund).
          </div>
        </div>
      </div>
    </div>
  );
}


function SettingsItem({ icon: Icon, label, description, onClick, actionLabel, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-opacity hover:opacity-90"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: danger ? 'rgba(220, 38, 38, 0.12)' : 'var(--accent-soft)',
        }}
      >
        <Icon
          size={18}
          style={{ color: danger ? '#DC2626' : 'var(--accent)' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: danger ? '#DC2626' : 'var(--text)' }}>
          {label}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {description}
        </div>
      </div>
      <div
        className="text-xs font-medium px-3 py-1 rounded-lg"
        style={{
          background: danger ? 'rgba(220, 38, 38, 0.12)' : 'var(--bg-hover)',
          color: danger ? '#DC2626' : 'var(--text-muted)',
        }}
      >
        {actionLabel}
      </div>
    </button>
  );
}
