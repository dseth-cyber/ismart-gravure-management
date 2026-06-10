'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from './client';
import { defaultLanguage, languages, type Language } from './settings';

const storageKey = 'gm_lang';

function isLanguage(value: string | null): value is Language {
  return languages.includes(value as Language);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(storageKey);
    void i18next.changeLanguage(isLanguage(storedLanguage) ? storedLanguage : defaultLanguage);
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}

export function persistLanguage(language: Language) {
  window.localStorage.setItem(storageKey, language);
  void i18next.changeLanguage(language);
}
