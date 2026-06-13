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
    <div className="flex flex-col h-full gap-4 md:gap-5 pt-0.5 cylinder-status-container w-full min-h-0 relative">
      <style>{`
        @container (max-height: 165px) {
          .cylinder-status-grid { display: none !important; }
          .cylinder-status-sub { display: none !important; }
        }
        @container (max-width: 480px) {
          .cylinder-status-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @container (max-width: 320px) {
          .cylinder-status-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .cylinder-status-dot { display: none !important; }
        }
      `}</style>
      <p
        className="font-semibold leading-snug transition-all cylinder-status-sub text-white/75 truncate"
        style={{ fontSize: 'clamp(10px, 3.2cqw, 13px)' }}
      >
        {t('dash.cylinderStatusSub')}
      </p>
      <div className="flex w-full rounded-full overflow-hidden bg-white/5 flex-shrink-0 gap-0.5 md:gap-1" style={{ height: 'clamp(24px, 7.5cqmin, 44px)' }}>
        {SEGMENTS.map((seg, i) => (
          <div
            key={i}
            className="first:rounded-l-full last:rounded-r-full transition-all duration-500 h-full"
            style={{ flexGrow: seg.percent, flexBasis: 0, backgroundColor: seg.color }}
          />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4 md:gap-5 flex-1 cylinder-status-grid min-h-0">
        {SEGMENTS.map((seg, i) => (
          <div
            key={i}
            className="rounded-xl flex flex-col items-center justify-center gap-1 w-full min-w-0 p-[4cqmin]"
            style={{
              backgroundColor: '#45266B',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="flex items-center justify-center gap-[2cqmin] min-w-0 w-full">
              <span
                className="rounded-full flex-shrink-0 cylinder-status-dot"
                style={{
                  width: 'clamp(8px, 3cqmin, 16px)',
                  height: 'clamp(8px, 3cqmin, 16px)',
                  backgroundColor: seg.color,
                }}
              />
              <span className="font-bold opacity-80 leading-tight truncate" style={{ fontSize: 'clamp(8px, 5.5cqmin, 26px)' }}>{t(seg.label as any)}</span>
            </div>
            <span className="font-black tracking-tight leading-none text-white mt-1 text-center" style={{ fontSize: 'clamp(12px, 11cqmin, 54px)' }}>{seg.count}</span>
            <span className="font-bold opacity-50 leading-none text-center" style={{ fontSize: 'clamp(7px, 4.8cqmin, 22px)' }}>{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
