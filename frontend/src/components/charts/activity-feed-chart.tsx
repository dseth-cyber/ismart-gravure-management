'use client';

import { useTranslation } from 'react-i18next';
import { Layers, Droplet, Factory, Shield, Cpu, Bell } from 'lucide-react';
import { tLabel } from '@/lib/dashboard/i18n-labels';

type ActivityType = 'cylinder' | 'ink' | 'job' | 'qc' | 'machine' | 'system';

interface ActivityItem {
  id: string;
  type: ActivityType;
  formatKey: string;
  args: string[];
  timestamp: string;
}

interface Props {
  activities: ActivityItem[];
  height?: number;
}

const CONFIG: Record<ActivityType, { icon: typeof Layers; bg: string; iconColor: string }> = {
  cylinder: { icon: Layers, bg: 'bg-cyan-500/15', iconColor: 'text-cyan-400' },
  ink:      { icon: Droplet, bg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
  job:      { icon: Factory, bg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
  qc:       { icon: Shield, bg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
  machine:  { icon: Cpu, bg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
  system:   { icon: Bell, bg: 'bg-rose-500/15', iconColor: 'text-rose-400' },
};

function formatMsg(t: (key: string) => string, formatKey: string, args: string[]): string {
  const template = tLabel(t, formatKey);
  let result = template;
  for (let i = 0; i < args.length; i++) {
    result = result.replace(`{${i}}`, args[i]);
  }
  return result;
}

export function ActivityFeedChart({ activities, height: _h }: Props) {
  const { t } = useTranslation();
  if (!activities || activities.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-auto pr-1 pt-0.5 activity-feed-container w-full min-h-0">
      <style>{`
        .activity-feed-container {
          font-size: clamp(9px, 3.8cqw, 12px);
        }
        @container (max-width: 250px) {
          .activity-feed-icon { display: none !important; }
        }
        @container (max-width: 170px) {
          .activity-feed-time { display: none !important; }
        }
        @container (max-height: 120px) {
          .activity-feed-time { display: none !important; }
        }
      `}</style>
      {activities.map((item, i) => {
        const cfg = CONFIG[item.type] || CONFIG.system;
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-start gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 activity-feed-icon ${cfg.bg}`}>
              <Icon size={13} className={cfg.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="leading-snug text-white/80" style={{ fontSize: 'inherit' }}>{formatMsg(t, item.formatKey, item.args)}</p>
            </div>
            <span className="opacity-40 flex-shrink-0 mt-0.5 activity-feed-time font-medium" style={{ fontSize: 'clamp(8px, 3cqw, 10px)' }}>{item.timestamp}</span>
          </div>
        );
      })}
    </div>
  );
}
