'use client';

import { useTranslation } from 'react-i18next';
import { Droplet, AlertCircle, AlertTriangle, Check, Clock } from 'lucide-react';
import { tLabel } from '@/lib/dashboard/i18n-labels';

interface AlertItem {
  id: string;
  icon: 'droplet' | 'alert' | 'warning' | 'check' | 'clock';
  swatchColor: string;
  details: string;
  statusDate: string;
  pillColor: string;
  pillText: string;
}

interface Props {
  alerts: AlertItem[];
  subtitle?: string;
  height?: number;
}

const ICON_MAP = {
  droplet: Droplet,
  alert: AlertCircle,
  warning: AlertTriangle,
  check: Check,
  clock: Clock,
};

function translateDate(t: (key: string) => string, text: string): string {
  const idx = text.indexOf(': ');
  if (idx === -1) return tLabel(t, text);
  const prefix = text.slice(0, idx);
  const rest = text.slice(idx);
  return tLabel(t, prefix) + rest;
}

export function AlertListChart({ alerts, subtitle, height: _h }: Props) {
  const { t } = useTranslation();
  if (!alerts || alerts.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="flex flex-col h-full gap-3 pt-0.5">
      {subtitle && (
        <p className="text-[13px] font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {tLabel(t, subtitle)}
        </p>
      )}
      <div className="flex-1 space-y-2 overflow-auto pr-1">
        {alerts.map((item, i) => {
          const Icon = ICON_MAP[item.icon] || Droplet;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 border"
              style={{ backgroundColor: 'rgba(46,10,92,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon size={18} className="text-white/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight text-white">{item.id}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="w-3 h-3 rounded flex-shrink-0 border border-white/10"
                    style={{ backgroundColor: item.swatchColor }}
                  />
                  <span className="text-xs text-white/60 leading-tight">{tLabel(t, item.details)}</span>
                </div>
                <p className="text-xs font-semibold mt-1 leading-tight" style={{ color: '#facc15' }}>
                  {translateDate(t, item.statusDate)}
                </p>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: item.pillColor + '20', color: item.pillColor }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.pillColor }} />
                  {tLabel(t, item.pillText)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
