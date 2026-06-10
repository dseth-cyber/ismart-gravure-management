'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';

type PageHeaderProps = {
  titleKey: string;
  subtitleKey?: string;
  actions?: ReactNode;
};

export function PageHeader({ titleKey, subtitleKey, actions }: PageHeaderProps) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className={`text-3xl font-bold tracking-normal ${themeConfig.textPrimary}`}>{t(titleKey)}</h1>
        {subtitleKey ? <p className={`mt-2 max-w-3xl text-sm leading-6 ${themeConfig.textSecondary}`}>{t(subtitleKey)}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
