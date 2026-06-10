'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import cn from './locales/cn.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import mm from './locales/mm.json';
import th from './locales/th.json';
import { defaultLanguage } from './settings';

export const resources = {
  th: { translation: th },
  en: { translation: en },
  cn: { translation: cn },
  mm: { translation: mm },
  ja: { translation: ja },
} as const;

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: defaultLanguage,
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18next;
