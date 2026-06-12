'use client';

import { ArrowUp, ArrowDown, Layers, Droplet, Factory, Shield, BarChart3, Package, AlertTriangle, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChartDataPoint } from '@/lib/dashboard/dashboard-config';
import { tLabel } from '@/lib/dashboard/i18n-labels';

interface Props {
  data: ChartDataPoint[];
  height?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  unit?: string;
  dataSource?: string;
}

const ICON_MAP: Record<string, { icon: typeof Layers; bg: string }> = {
  cylinders:   { icon: Layers, bg: 'from-cyan-500 to-blue-500' },
  inks:        { icon: Droplet, bg: 'from-purple-500 to-pink-500' },
  jobs:        { icon: Factory, bg: 'from-emerald-500 to-teal-500' },
  qc:          { icon: Shield, bg: 'from-amber-500 to-orange-500' },
  production:  { icon: Cpu, bg: 'from-blue-500 to-indigo-500' },
  alerts:      { icon: AlertTriangle, bg: 'from-rose-500 to-red-500' },
  inventory:   { icon: Package, bg: 'from-violet-500 to-purple-500' },
};

function Sparkline({ data, color = '#22d3ee', width = 80, height = 30 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(' ');
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts}></polyline>
    </svg>
  );
}

export function StatChart({ data, height: _height, trend, trendValue, unit, dataSource }: Props) {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  const primary = data[0];
  const secondary = data[1];
  const iconCfg = ICON_MAP[dataSource || ''] || ICON_MAP.cylinders;
  const Icon = iconCfg.icon;

  return (
    <div className="flex flex-col justify-center h-full px-1 relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${iconCfg.bg} flex items-center justify-center flex-shrink-0 shadow-lg text-white`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{primary.value}</span>
            {unit && <span className="text-xs opacity-50">{unit}</span>}
            {trend && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-gray-400'}`}>
                {trend === 'up' ? <ArrowUp size={12} /> : trend === 'down' ? <ArrowDown size={12} /> : null}
                {trendValue || ''}
              </span>
            )}
          </div>
          {secondary && (
            <p className="text-xs opacity-50 mt-0.5">
              {tLabel(t, secondary.label)}: {secondary.value}
            </p>
          )}
        </div>
      </div>
      <div className="absolute bottom-1 right-1">
        <Sparkline data={[20, 25, 22, 30, 28, 35, 32, 38, 42, 40, 45]} color="#22d3ee" width={80} height={30} />
      </div>
    </div>
  );
}
