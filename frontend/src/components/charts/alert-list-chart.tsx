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
    <div className="flex flex-col h-full gap-2 pt-0.5 alert-list-container w-full min-h-0">
      <style>{`
        .alert-list-container {
          font-size: clamp(10px, 4.5cqw, 18px);
        }
        @container (max-width: 280px) {
          .alert-item-swatch { display: none !important; }
          .alert-item-date { display: none !important; }
          .alert-item-badge { font-size: 8px !important; padding: 1px 4px !important; }
        }
        @container (max-width: 200px) {
          .alert-item-icon { display: none !important; }
          .alert-item-badge { display: none !important; }
        }
        @container (max-height: 140px) {
          .alert-item-date { display: none !important; }
          .alert-list-subtitle { display: none !important; }
        }
      `}</style>
      {subtitle && (
        <p 
          className="font-semibold leading-snug transition-all alert-list-subtitle" 
          style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(11px, 4.5cqw, 18px)' }}
        >
          {tLabel(t, subtitle)}
        </p>
      )}
      <div className="flex-1 space-y-1.5 overflow-auto pr-1 min-h-0">
        {alerts.map((item, i) => {
          const Icon = ICON_MAP[item.icon] || Droplet;
          
          // Dynamic styles based on severity (pillColor)
          const isCritical = item.pillColor === '#ef4444';
          const isWarning = item.pillColor === '#f59e0b';
          const isSuccess = item.pillColor === '#22c55e';
          
          let containerBg = 'rgba(46,10,92,0.5)';
          let containerBorder = 'rgba(255,255,255,0.08)';
          
          if (isCritical) {
            containerBg = 'rgba(239,68,68,0.12)';
            containerBorder = 'rgba(239,68,68,0.35)';
          } else if (isWarning) {
            containerBg = 'rgba(245,158,11,0.08)';
            containerBorder = 'rgba(245,158,11,0.35)';
          } else if (isSuccess) {
            containerBg = 'rgba(34,197,94,0.08)';
            containerBorder = 'rgba(34,197,94,0.35)';
          }

          return (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-xl px-2.5 py-2 border transition-all duration-200 min-w-0"
              style={{ backgroundColor: containerBg, borderColor: containerBorder }}
            >
              <div className="flex-shrink-0 mt-0.5 alert-item-icon">
                <Icon size={16} style={{ color: item.pillColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="font-bold leading-tight text-white transition-all truncate"
                  style={{ fontSize: 'clamp(11px, 4.8cqw, 18px)' }}
                >
                  {item.id}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 alert-item-swatch">
                  <span
                    className="w-2.5 h-2.5 rounded flex-shrink-0 border border-white/10"
                    style={{ backgroundColor: item.swatchColor }}
                  />
                  <span 
                    className="text-white/60 leading-tight transition-all truncate"
                    style={{ fontSize: 'clamp(9px, 4cqw, 15px)' }}
                  >
                    {tLabel(t, item.details)}
                  </span>
                </div>
                <p 
                  className="font-semibold mt-0.5 leading-tight transition-all alert-item-date truncate" 
                  style={{ color: '#facc15', fontSize: 'clamp(9px, 4cqw, 15px)' }}
                >
                  {translateDate(t, item.statusDate)}
                </p>
              </div>
              <div className="flex-shrink-0 mt-0.5 alert-item-badge">
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-bold border transition-all"
                  style={{ 
                    backgroundColor: item.pillColor + '15', 
                    color: item.pillColor,
                    borderColor: item.pillColor + '45',
                    fontSize: 'clamp(9px, 4.5cqw, 15px)'
                  }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: item.pillColor }} />
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
