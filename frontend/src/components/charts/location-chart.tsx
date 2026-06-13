'use client';

import { useTranslation } from 'react-i18next';
import { tLabel } from '@/lib/dashboard/i18n-labels';
import { MapPin } from 'lucide-react';

interface LocationData {
  name: string;
  count: number;
  unit: string;
}

interface Props {
  locations: LocationData[];
}

export function LocationChart({ locations }: Props) {
  const { t } = useTranslation();
  if (!locations || locations.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 h-full content-start pt-1">
      {locations.map((loc, i) => (
        <div
          key={i}
          className="rounded-xl px-3 py-3 flex flex-col gap-3 border"
          style={{
            backgroundColor: 'rgba(46,10,92,0.45)',
            borderColor: 'rgba(147,51,234,0.3)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-cyan-400 shrink-0" />
            <span className="text-xs font-semibold text-white/70 truncate">
              {tLabel(t, loc.name)}
            </span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-white">{loc.count}</span>
            <span className="text-xs text-white/40 ml-0.5">{loc.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
