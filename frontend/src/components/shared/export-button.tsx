'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Download, FileSpreadsheet, FileText, Image, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';

type ExportButtonProps = {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onExportImage?: () => void;
  showImage?: boolean;
  loading?: boolean;
  className?: string;
};

export function ExportButton({
  onExportExcel,
  onExportPDF,
  onExportImage,
  showImage = false,
  loading = false,
  className = '',
}: ExportButtonProps) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items: { label: string; icon: ReactNode; onClick?: () => void }[] = [];
  if (onExportExcel) items.push({ label: t('btn.exportExcel') || 'Excel', icon: <FileSpreadsheet size={14} />, onClick: onExportExcel });
  if (onExportPDF) items.push({ label: t('btn.exportPDF') || 'PDF', icon: <FileText size={14} />, onClick: onExportPDF });
  if (showImage && onExportImage) items.push({ label: t('btn.exportImage') || 'Image', icon: <Image size={14} />, onClick: onExportImage });

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all ${themeConfig.secondaryButton} shadow disabled:opacity-50`}
      >
        <Download size={15} />
        {t('btn.export')}
        <ChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`absolute right-0 mt-1 z-50 min-w-[140px] rounded-xl border ${themeConfig.border} ${themeConfig.dialog} py-1 shadow-2xl`}>
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.onClick?.(); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-left transition ${themeConfig.textSecondary} ${themeConfig.panelHover}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
