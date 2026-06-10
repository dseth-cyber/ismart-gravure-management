'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppButton } from './app-button';
import { useTheme } from '@/lib/theme/theme-provider';

type AppDialogProps = {
  open: boolean;
  titleKey: string;
  descriptionKey?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function AppDialog({ open, titleKey, descriptionKey, children, footer, onClose }: AppDialogProps) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  if (!open) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 grid place-items-center px-4 ${themeConfig.dialogOverlay}`} role="presentation">
      <section
        aria-modal="true"
        className={`w-full max-w-lg rounded-lg ${themeConfig.dialog} ${themeConfig.shadow}`}
        role="dialog"
      >
        <div className={`flex items-start justify-between gap-4 border-b p-5 ${themeConfig.border}`}>
          <div>
            <h2 className={`text-lg font-semibold ${themeConfig.textPrimary}`}>{t(titleKey)}</h2>
            {descriptionKey ? <p className={`mt-1 text-sm leading-6 ${themeConfig.textSecondary}`}>{t(descriptionKey)}</p> : null}
          </div>
          <button
            aria-label={t('common.close')}
            className={`rounded-lg p-2 ${themeConfig.textSecondary} ${themeConfig.panelHover} ${themeConfig.focusRing}`}
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        {children ? <div className="p-5">{children}</div> : null}
        <div className={`flex justify-end gap-2 border-t p-4 ${themeConfig.border}`}>
          {footer ?? <AppButton onClick={onClose}>{t('common.close')}</AppButton>}
        </div>
      </section>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  titleKey: string;
  descriptionKey: string;
  confirmKey?: string;
  cancelKey?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  titleKey,
  descriptionKey,
  confirmKey = 'common.confirm',
  cancelKey = 'common.cancel',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AppDialog
      open={open}
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      footer={
        <>
          <AppButton onClick={onClose}>{t(cancelKey)}</AppButton>
          <AppButton variant="danger" onClick={onConfirm}>
            {t(confirmKey)}
          </AppButton>
        </>
      }
      onClose={onClose}
    />
  );
}

type FormDialogProps = AppDialogProps;

export function FormDialog(props: FormDialogProps) {
  return <AppDialog {...props} />;
}
