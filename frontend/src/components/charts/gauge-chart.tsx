'use client';

import type { GaugeConfig } from '@/lib/dashboard/dashboard-config';

interface Props {
  config: GaugeConfig;
  height?: number;
  width?: number;
  label?: string;
}

export function GaugeChart({ config, height: _height, width = 160, label }: Props) {
  const { min, max, value, thresholds } = config;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const angle = (pct / 100) * 180;
  const rad = (angle * Math.PI) / 180;

  const needleLen = width * 0.32;
  const needleX = width / 2 + needleLen * Math.sin(rad);
  const needleY = width / 2 + width * 0.18 - needleLen * Math.cos(rad);

  const getColor = () => {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].value) return thresholds[i].color;
    }
    return thresholds[0]?.color || '#10b981';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <svg width={width} height={width * 0.55} viewBox={`0 0 ${width} ${width * 0.55}`}>
        <path
          d={`M ${width * 0.08} ${width * 0.48} A ${width * 0.4} ${width * 0.4} 0 0 1 ${width * 0.92} ${width * 0.48}`}
          fill="none"
          stroke="currentColor"
          className="opacity-10"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M ${width * 0.08} ${width * 0.48} A ${width * 0.4} ${width * 0.4} 0 0 1 ${width * 0.92} ${width * 0.48}`}
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * Math.PI * width * 0.4} ${Math.PI * width * 0.4}`}
          className="transition-all duration-700"
        />
        <line
          x1={width / 2}
          y1={width * 0.48}
          x2={needleX}
          y2={needleY}
          stroke={getColor()}
          strokeWidth="2"
          className="transition-all duration-700"
        />
        <circle cx={width / 2} cy={width * 0.48} r="4" fill={getColor()} />
      </svg>
      <div className="text-center -mt-1">
        <span className="text-2xl font-bold">{value}</span>
        {label && <span className="text-xs opacity-50 ml-1">{label}</span>}
      </div>
    </div>
  );
}
