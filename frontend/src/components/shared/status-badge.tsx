'use client';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';

export type StatusKind = 'done' | 'progress' | 'blocked' | 'todo' | 'pending';

type StatusBadgeProps = {
  status: StatusKind;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[inherit] font-semibold ${themeConfig.status[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}
