'use client';

import { useTranslation } from 'react-i18next';
import type { ChartDataPoint } from '@/lib/dashboard/dashboard-config';
import { tLabel } from '@/lib/dashboard/i18n-labels';

interface Props {
  data: ChartDataPoint[];
  height?: number;
  maxValue?: number;
  orientation?: 'horizontal' | 'vertical';
}

export function BarGaugeChart({ data, height: _height, maxValue, orientation = 'horizontal' }: Props) {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  if (orientation === 'vertical') {
    return (
      <div className="flex items-end justify-around gap-2 h-full px-2 pb-6">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
            <span className="text-xs font-semibold">{d.value}</span>
            <div
              className="w-full rounded-t transition-all duration-500 min-h-[4px]"
              style={{ height: `${(d.value / max) * 100}%`, backgroundColor: d.color || '#22d3ee' }}
            ></div>
            <span className="text-[10px] opacity-60 truncate w-full text-center">{tLabel(t, d.label)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full justify-center px-1">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] w-24 truncate flex-shrink-0 opacity-60">{tLabel(t, d.label)}</span>
          <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || '#22d3ee' }}
            ></div>
          </div>
          <span className="text-xs font-semibold w-10 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
