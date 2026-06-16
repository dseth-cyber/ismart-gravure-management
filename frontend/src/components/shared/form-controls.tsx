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

import SearchableSelect, { type Option } from '@/components/ui/SearchableSelect';

type AppSelectProps = {
  labelKey: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function AppSelect({ labelKey, value, onChange, options, placeholder, disabled, required, className = '' }: AppSelectProps) {
  const { t } = useTranslation();

  return (
    <SearchableSelect
      label={t(labelKey)}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={className}
    />
  );
}
