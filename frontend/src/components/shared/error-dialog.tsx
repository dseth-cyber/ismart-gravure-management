'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { X } from 'lucide-react';

export const GLOBAL_ERROR_EVENT = 'gm:global-error';

export interface GlobalErrorDetail {
  titleKey?: string;
  message: string;
  statusCode?: number;
}

export function emitGlobalError(detail: GlobalErrorDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GLOBAL_ERROR_EVENT, { detail }));
  }
}

export function GlobalErrorDialog() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [error, setError] = useState<GlobalErrorDetail | null>(null);

  const handleEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as GlobalErrorDetail;
    setError(detail);
  }, []);

  useEffect(() => {
    window.addEventListener(GLOBAL_ERROR_EVENT, handleEvent);
    return () => window.removeEventListener(GLOBAL_ERROR_EVENT, handleEvent);
  }, [handleEvent]);

  if (!error) return null;

  const title = error.titleKey ? t(error.titleKey) : t('common.forbidden');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-black/60`} onClick={() => setError(null)}></div>
      <div className={`relative rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{title}</h3>
          </div>
          <button onClick={() => setError(null)} className={`rounded p-1 ${themeConfig.panelHover}`}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>{error.message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setError(null)}
            className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
