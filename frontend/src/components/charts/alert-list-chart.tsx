'use client';

import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, AlertCircle, Check } from 'lucide-react';
import { tLabel } from '@/lib/dashboard/i18n-labels';

interface AlertItem {
  severity: 'critical' | 'warning' | 'info' | 'resolved';
  message: string;
  time: string;
}

interface Props {
  alerts: AlertItem[];
  height?: number;
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border border-rose-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20' },
  resolved: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
};

export function AlertListChart({ alerts, height: _height }: Props) {
  const { t } = useTranslation();
  if (!alerts || alerts.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No alerts</div>;
  }

  return (
    <div className="space-y-2 h-full overflow-auto pr-1">
      {alerts.map((alert, i) => {
        const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${cfg.bg}`}>
            <Icon size={14} className={`mt-0.5 flex-shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug">{alert.message}</p>
              <p className="text-[10px] opacity-50 mt-0.5">{alert.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
