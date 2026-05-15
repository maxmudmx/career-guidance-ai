import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kasbim_theme';
const VALID_THEMES = ['dark', 'light'];

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (VALID_THEMES.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return 'dark';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

// Apply once on module load so the page paints with the right theme immediately
applyTheme(getInitialTheme());

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (VALID_THEMES.includes(next)) setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
