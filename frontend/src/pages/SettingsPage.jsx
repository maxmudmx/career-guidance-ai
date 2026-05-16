import { useState } from 'react';
import { Card } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';


export default function SettingsPage({ user, onLogout }) {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useTranslation();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
          {t('settings.title')}
        </h1>

        {/* Theme toggle */}
        <Card className="overflow-hidden mb-3">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {theme === 'dark' ? t('settings.theme.dark_label') : t('settings.theme.light_label')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {theme === 'dark' ? t('settings.theme.dark_desc') : t('settings.theme.light_desc')}
              </div>
            </div>
            <Switch checked={theme === 'dark'} onChange={toggle} />
          </div>
        </Card>

        {/* Language */}
        <Card className="overflow-hidden mb-3">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {t('settings.language.label')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('settings.language.desc')}
              </div>
            </div>
            <div className="flex gap-1.5">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setLang(opt.code)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: lang === opt.code ? 'var(--text)' : 'var(--bg-hover)',
                    color: lang === opt.code ? 'var(--bg)' : 'var(--text)',
                  }}
                  title={opt.label}
                >
                  {opt.flag}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="overflow-hidden mb-3">
          <button
            onClick={() => setAboutOpen(!aboutOpen)}
            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-opacity hover:opacity-90"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {t('settings.about.label')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('settings.about.desc')}
              </div>
            </div>
            <div
              className="text-xs font-medium px-3 py-1 rounded-lg"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            >
              {aboutOpen ? t('settings.about.close') : t('settings.about.view')}
            </div>
          </button>

          {aboutOpen && (
            <div
              className="px-5 py-4 border-t"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <div className="mb-3">
                <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  Kasbim
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('settings.about.version')} 3.0.0
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('settings.about.text')}
              </p>
            </div>
          )}
        </Card>

        {/* Logout */}
        {user && (
          <Card className="overflow-hidden">
            <button
              onClick={() => {
                if (confirm(t('settings.logout.confirm'))) {
                  onLogout();
                }
              }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-opacity hover:opacity-90"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {t('settings.logout.label')}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('settings.logout.desc_prefix')}{user.username}{t('settings.logout.desc_suffix')}
                </div>
              </div>
              <div
                className="text-xs font-medium px-3 py-1 rounded-lg"
                style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
              >
                {t('settings.logout.btn')}
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
        background: checked ? 'var(--text)' : 'var(--bg-hover)',
      }}
    >
      <div
        className="absolute top-1 w-5 h-5 rounded-full transition-all"
        style={{
          left: checked ? '24px' : '4px',
          background: checked ? 'var(--bg)' : 'var(--text)',
        }}
      />
    </button>
  );
}
