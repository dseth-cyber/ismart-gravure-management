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

  // Extract from/to colors for linear-gradient
  const fromColor = iconCfg.bg.split(' ')[0].replace('from-[', '').replace('from-', '').replace(']', '');
  const toColor = iconCfg.bg.split(' ')[1].replace('to-[', '').replace('to-', '').replace(']', '');

  return (
    <div className="flex flex-col items-center justify-center text-center h-full px-4 relative overflow-hidden w-full gap-[3cqh] min-h-0 py-2 stat-container">
      {/* Inject Scoped CSS for Container Queries */}
      <style>{`
        @container (max-height: 130px) {
          .stat-icon { display: none !important; }
          .stat-container { gap: 4px !important; }
        }
        @container (max-width: 170px) {
          .stat-icon { display: none !important; }
        }
        @container (max-height: 95px) {
          .stat-secondary { display: none !important; }
        }
        @container (max-height: 145px) {
          .stat-trend { display: none !important; }
        }
      `}</style>

      {/* Top: Icon left, Trend right */}
      <div className="flex items-start justify-between w-full flex-shrink-0 relative z-10">
        <div 
          className="rounded-2xl flex items-center justify-center shadow-lg text-white transition-all duration-150 flex-shrink-0 stat-icon"
          style={{ 
            width: 'clamp(35px, 18cqmin, 160px)', 
            height: 'clamp(35px, 18cqmin, 160px)',
            minWidth: '35px',
            minHeight: '35px',
            background: `linear-gradient(135deg, var(--color-${fromColor}, ${fromColor}), var(--color-${toColor}, ${toColor}))`
          }}
        >
          <Icon style={{ width: '50%', height: '50%' }} />
        </div>
        {trend && (
          <span 
            className={`flex items-center gap-0.5 font-bold stat-trend ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-gray-400'}`}
            style={{ fontSize: 'clamp(9px, 6cqmin, 40px)' }}
          >
            {trend === 'up' ? <ArrowUp size={12} className="inline-block" /> : trend === 'down' ? <ArrowDown size={12} className="inline-block" /> : null}
            {trendValue || ''}
          </span>
        )}
      </div>
      
      {/* Primary Value, Unit */}
      <div className="flex flex-col items-center gap-0.5 w-full flex-shrink-0 flex-1 justify-center">
        <div className="flex items-baseline justify-center gap-1.5 flex-wrap w-full">
          <span 
            className="font-black tracking-tight leading-none text-white transition-all duration-150"
            style={{ fontSize: 'clamp(24px, 28cqmin, 260px)' }}
          >
            {primary.value}
          </span>
          {unit && (
            <span 
              className="opacity-60 font-bold transition-all duration-150"
              style={{ fontSize: 'clamp(11px, 9cqmin, 60px)' }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Secondary Label (Centered & Scaled) */}
      {secondary && (
        <p 
          className="opacity-70 font-semibold tracking-wide transition-all duration-150 truncate max-w-full stat-secondary"
          style={{ fontSize: 'clamp(10px, 6.5cqmin, 50px)' }}
        >
          {tLabel(t, secondary.label)}: <span className="text-white font-bold">{secondary.value}</span>
        </p>
      )}
      
      {/* Ambient background sparkline filling container */}
      <div className="absolute bottom-0 left-0 right-0 w-full flex justify-center opacity-[0.12] pointer-events-none">
        <svg viewBox="0 0 100 30" className="w-full h-[35cqh] max-h-[80px]" preserveAspectRatio="none">
          <polyline 
            fill="none" 
            stroke={primary.color || '#22d3ee'} 
            strokeWidth="3" 
            points="0,20 10,25 20,22 30,28 40,24 50,29 60,26 70,30 80,32 90,28 100,29"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
