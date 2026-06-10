'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useTheme } from '@/lib/theme/theme-provider';

type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
};

export function AppButton({ className = '', variant = 'secondary', type = 'button', ...props }: AppButtonProps) {
  const { themeConfig } = useTheme();
  const variantClass = {
    primary: themeConfig.primaryButton,
    secondary: themeConfig.secondaryButton,
    danger: themeConfig.dangerButton,
    ghost: `${themeConfig.textSecondary} hover:bg-white/10`,
  }[variant];

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${themeConfig.focusRing} disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      type={type}
      {...props}
    />
  );
}
