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
      <div className="flex items-end justify-around gap-2 h-full px-2 pb-5 pt-1 bar-gauge-container">
        <style>{`
          @container (max-height: 120px) {
            .bar-gauge-label { display: none !important; }
          }
          @container (max-width: 180px) {
            .bar-gauge-label { display: none !important; }
          }
        `}</style>
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end min-w-0">
            <span className="text-[10px] font-semibold text-white/90" style={{ fontSize: 'clamp(8px, 3.5cqmin, 12px)' }}>{d.value}</span>
            <div
              className="w-full rounded-t transition-all duration-500 min-h-[4px]"
              style={{ height: `${(d.value / max) * 80}%`, backgroundColor: d.color || '#22d3ee' }}
            ></div>
            <span className="text-[9px] opacity-60 truncate w-full text-center bar-gauge-label" style={{ fontSize: 'clamp(7px, 3cqmin, 11px)' }}>{tLabel(t, d.label)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 h-full justify-center px-1 bar-gauge-container w-full">
      <style>{`
        @container (max-width: 180px) {
          .bar-gauge-label { display: none !important; }
        }
        @container (max-height: 120px) {
          .bar-gauge-container { gap: 4px !important; }
        }
      `}</style>
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 w-full min-w-0">
          <span 
            className="text-[10px] w-20 truncate flex-shrink-0 opacity-60 bar-gauge-label text-white/70"
            style={{ fontSize: 'clamp(8px, 3.2cqw, 12px)' }}
          >
            {tLabel(t, d.label)}
          </span>
          <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || '#22d3ee' }}
            ></div>
          </div>
          <span 
            className="text-[10px] font-bold w-8 text-right flex-shrink-0 text-white"
            style={{ fontSize: 'clamp(8px, 3.5cqw, 12px)' }}
          >
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
