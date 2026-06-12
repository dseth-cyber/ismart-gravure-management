'use client';

import { useTranslation } from 'react-i18next';
import type { ChartDataPoint } from '@/lib/dashboard/dashboard-config';
import { tLabel } from '@/lib/dashboard/i18n-labels';

interface Props {
  segments: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  showPercent?: boolean;
}

export function StackedBarChart({ segments, height: _h, showLegend = true, showPercent = true }: Props) {
  const { t } = useTranslation();
  if (!segments || segments.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  const total = segments.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="flex flex-col justify-center h-full gap-3 px-1">
      <div className="flex h-7 w-full rounded-full overflow-hidden bg-white/5">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={i}
              className="relative transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: seg.color || '#22d3ee' }}
              title={`${tLabel(t, seg.label)}: ${seg.value} (${pct.toFixed(1)}%)`}
            >
              {showPercent && pct >= 8 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                  {pct.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      {showLegend && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
          {segments.map((seg, i) => {
            const pct = (seg.value / total) * 100;
            return (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color || '#22d3ee' }}></span>
                <span className="opacity-60 truncate">{tLabel(t, seg.label)}</span>
                <span className="font-semibold ml-auto">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
