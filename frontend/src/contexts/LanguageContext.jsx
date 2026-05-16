import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';

const STORAGE_KEY = 'kasbim_lang';
const DEFAULT_LANG = 'uz';

const LanguageContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANG;
    const stored = localStorage.getItem(STORAGE_KEY);
    return ['uz', 'en', 'ru'].includes(stored) ? stored : DEFAULT_LANG;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = (key) => {
    const dict = translations[lang] || translations[DEFAULT_LANG];
    return dict[key] || translations[DEFAULT_LANG][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
