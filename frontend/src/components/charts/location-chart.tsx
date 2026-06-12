'use client';

import { useTranslation } from 'react-i18next';
import { tLabel } from '@/lib/dashboard/i18n-labels';

interface LocationData {
  name: string;
  count: number;
  max: number;
  color: string;
  unit: string;
}

interface Props {
  title?: string;
  locations: LocationData[];
  height?: number;
}

export function LocationChart({ title, locations, height: _h }: Props) {
  const { t } = useTranslation();
  if (!locations || locations.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="flex flex-col h-full gap-2 pt-0.5">
      {title && (
        <p className="text-[13px] font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {tLabel(t, title)}
        </p>
      )}
      <div className="flex-1 grid grid-cols-2 gap-2 content-start">
        {locations.map((loc, i) => {
          const pct = loc.max > 0 ? (loc.count / loc.max) * 100 : 0;
          return (
            <div
              key={i}
              className="rounded-xl px-3 py-2.5 border flex flex-col gap-1.5"
              style={{ backgroundColor: 'rgba(46,10,92,0.45)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">{tLabel(t, loc.name)}</span>
                <span className="text-sm font-bold text-white">{loc.count}<span className="text-[10px] font-normal text-white/40 ml-0.5">{loc.unit}</span></span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: loc.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
