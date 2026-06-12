'use client';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { CHART_TYPE_META, DATA_SOURCE_META } from '@/lib/dashboard/dashboard-config';
import type { ChartType, DataSource } from '@/lib/dashboard/dashboard-config';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (chartType: ChartType, dataSource: DataSource, colSpan: 1|2|3, rowSpan: 1|2|3) => void;
}

export function AddCardDrawer({ isOpen, onClose, onAddCard }: Props) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-md h-full overflow-y-auto ${themeConfig.dialog} p-6 shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Add Card</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <p className={`text-sm mb-4 ${themeConfig.textSecondary}`}>Select a chart type to add to your dashboard:</p>

        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(CHART_TYPE_META) as [ChartType, typeof CHART_TYPE_META[ChartType]][]).map(([type, meta]) => (
            <button
              key={type}
              onClick={() => {
                onAddCard(type, 'cylinders', meta.defaultColSpan, meta.defaultRowSpan);
                onClose();
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border ${themeConfig.border} ${themeConfig.badge} hover:bg-white/5 transition text-left`}
            >
              <span className="text-xl">{meta.icon}</span>
              <span className={`text-xs font-semibold ${themeConfig.textPrimary} text-center leading-tight`}>
                {meta.nameKey}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
