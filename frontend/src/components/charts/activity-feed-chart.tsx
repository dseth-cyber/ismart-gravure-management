'use client';

import { useTranslation } from 'react-i18next';
import { Layers, Droplet, Factory, Shield, Cpu, Bell } from 'lucide-react';
import { tLabel } from '@/lib/dashboard/i18n-labels';

type ActivityType = 'cylinder' | 'ink' | 'job' | 'qc' | 'machine' | 'system';

interface ActivityItem {
  id: string;
  type: ActivityType;
  content: string;
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

export function ActivityFeedChart({ activities, height: _h }: Props) {
  const { t } = useTranslation();
  if (!activities || activities.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-auto pr-1 pt-0.5">
      {activities.map((item, i) => {
        const cfg = CONFIG[item.type] || CONFIG.system;
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
              <Icon size={15} className={cfg.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug text-white/80">{tLabel(t, item.content)}</p>
            </div>
            <span className="text-[10px] text-white/40 flex-shrink-0 mt-0.5">{item.timestamp}</span>
          </div>
        );
      })}
    </div>
  );
}
