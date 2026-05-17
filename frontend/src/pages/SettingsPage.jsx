import { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import { ChevronDown } from '../components/ChevronDown';


export default function SettingsPage({ user, onLogout, onNavigate }) {
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

        {/* Language — dropdown (overflow-visible, dropdown card'dan tashqarida ko'rinishi uchun) */}
        <Card className="mb-3" style={{ overflow: 'visible' }}>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {t('settings.language.label')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('settings.language.desc')}
              </div>
            </div>
            <LanguageDropdown lang={lang} setLang={setLang} />
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
            <span style={{ color: 'var(--text-muted)' }}>
              <ChevronDown open={aboutOpen} size={16} />
            </span>
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

        {/* Change password */}
        {user && (
          <Card className="overflow-hidden mb-3">
            <button
              onClick={() => onNavigate?.('password')}
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-opacity hover:opacity-90"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {t('settings.password.label')}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('settings.password.desc')}
                </div>
              </div>
              <div className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>
                </svg>
              </div>
            </button>
          </Card>
        )}

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


function LanguageDropdown({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const current = LANGUAGE_OPTIONS.find((o) => o.code === lang) || LANGUAGE_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
      >
        {current.flag}
        <ChevronDown open={open} size={14} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-lg overflow-hidden border min-w-[140px] z-10"
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
              {opt.code === lang && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
