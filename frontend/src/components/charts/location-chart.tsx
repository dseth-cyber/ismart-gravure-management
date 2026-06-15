'use client';

import { useTranslation } from 'react-i18next';
import { tLabel } from '@/lib/dashboard/i18n-labels';
import { useTheme } from '@/lib/theme/theme-provider';
import { useRouter } from 'next/navigation';
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
  const { themeConfig } = useTheme();
  const router = useRouter();
  if (!locations || locations.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2.5 h-full content-start pt-1 location-grid w-full min-h-0">
      <style>{`
        @container (max-width: 385px) {
          .location-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @container (max-width: 250px) {
          .location-grid { grid-template-columns: 1fr !important; }
          .location-pin { display: none !important; }
        }
        @container (max-height: 125px) {
          .location-grid { grid-template-columns: repeat(auto-fit, minmax(85px, 1fr)) !important; gap: 4px !important; }
          .location-card { flex-direction: row !important; align-items: center !important; justify-content: space-between !important; padding: 4px 8px !important; gap: 4px !important; }
          .location-pin { display: none !important; }
        }
      `}</style>
      {locations.map((loc, i) => (
        <div
          key={i}
          className={`rounded-lg px-2.5 py-2 flex flex-col gap-2 location-card min-w-0 transition-all ${themeConfig.badge} cursor-pointer hover:opacity-80`}
          onClick={() => router.push(`/cylinders?location=${encodeURIComponent(loc.name)}`)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="text-cyan-400 shrink-0 location-pin" style={{ width: 'clamp(10px, 4.2cqmin, 24px)', height: 'clamp(10px, 4.2cqmin, 24px)' }} />
            <span 
              className="font-bold text-white/80 truncate"
              style={{ fontSize: 'clamp(9px, 5.2cqmin, 28px)' }}
            >
              {tLabel(t, loc.name)}
            </span>
          </div>
          <div className="text-center flex items-baseline justify-center gap-0.5 leading-none">
            <span className="font-black text-white animate-fade-in" style={{ fontSize: 'clamp(14px, 13cqmin, 64px)' }}>{loc.count}</span>
            <span className="opacity-40 ml-0.5 font-bold" style={{ fontSize: 'clamp(8px, 5cqmin, 24px)' }}>{loc.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
