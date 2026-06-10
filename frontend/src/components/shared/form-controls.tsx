'use client';

import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  labelKey: string;
};

export function AppInput({ className = '', labelKey, ...props }: AppInputProps) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  return (
    <label className="grid gap-2 text-sm">
      <span className={themeConfig.textSecondary}>{t(labelKey)}</span>
      <input className={`min-h-10 rounded-lg px-3 py-2 ${themeConfig.input} ${themeConfig.focusRing} ${className}`} {...props} />
    </label>
  );
}

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  labelKey: string;
};

export function AppSelect({ children, className = '', labelKey, ...props }: AppSelectProps) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  return (
    <label className="grid gap-2 text-sm">
      <span className={themeConfig.textSecondary}>{t(labelKey)}</span>
      <select className={`min-h-10 rounded-lg px-3 py-2 ${themeConfig.input} ${themeConfig.focusRing} ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}
