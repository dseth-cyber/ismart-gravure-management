'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultTheme, themeConfig, type ThemeConfig, type ThemeName } from './theme-config';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeConfig: ThemeConfig;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const storageKey = 'gm_theme';

function isThemeName(value: string | null): value is ThemeName {
  return value === 'modern' || value === 'dark' || value === 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(storageKey);
    if (isThemeName(storedTheme)) {
      setThemeState(storedTheme);
    }
  }, []);

  const setTheme = (nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      themeConfig: themeConfig[theme],
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
