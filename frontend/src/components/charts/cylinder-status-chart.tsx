'use client';

interface StatusSegment {
  label: string;
  count: number;
  percent: number;
  color: string;
}

const SEGMENTS: StatusSegment[] = [
  { label: 'dash.available',    count: 156, percent: 55, color: '#10b981' },
  { label: 'dash.inProduction', count: 48,  percent: 17, color: '#3b82f6' },
  { label: 'dash.reserved',     count: 38,  percent: 13, color: '#f59e0b' },
  { label: 'dash.inspection',   count: 30,  percent: 11, color: '#a855f7' },
  { label: 'dash.repair',       count: 12,  percent: 4,  color: '#ef4444' },
];

import { useTranslation } from 'react-i18next';

interface Props {
  height?: number;
}

export function CylinderStatusChart({ height: _h }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full gap-3 pt-0.5">
      <p
        className="text-[13px] font-medium leading-snug"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        {t('dash.cylinderStatusSub')}
      </p>
      <div className="flex h-6 w-full rounded-full overflow-hidden bg-white/5 flex-shrink-0">
        {SEGMENTS.map((seg, i) => (
          <div
            key={i}
            className="first:rounded-l-full last:rounded-r-full transition-all duration-500"
            style={{ width: `${seg.percent}%`, backgroundColor: seg.color }}
          />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-3 flex-1">
        {SEGMENTS.map((seg, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 flex flex-col items-center justify-center gap-0.5 w-full"
            style={{
              backgroundColor: 'rgba(90,30,140,0.55)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[13px] font-semibold opacity-80 leading-tight">{t(seg.label as any)}</span>
            </div>
            <span className="text-[22px] font-bold tracking-tight leading-none">{seg.count}</span>
            <span className="text-sm font-semibold opacity-50 leading-none">{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
