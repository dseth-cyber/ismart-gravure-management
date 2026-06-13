'use client';

import type { GaugeConfig } from '@/lib/dashboard/dashboard-config';

interface Props {
  config: GaugeConfig;
  height?: number;
  width?: number;
  label?: string;
}

export function GaugeChart({ config, height: _height, label }: Props) {
  const { min, max, value, thresholds } = config;
  
  // Use a fixed SVG coordinate canvas size, but render responsively with viewBox
  const svgWidth = 160;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const angle = (pct / 100) * 180;
  const rad = (angle * Math.PI) / 180;

  const needleLen = svgWidth * 0.32;
  const needleX = svgWidth / 2 + needleLen * Math.sin(rad);
  const needleY = svgWidth / 2 + svgWidth * 0.18 - needleLen * Math.cos(rad);

  const getColor = () => {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].value) return thresholds[i].color;
    }
    return thresholds[0]?.color || '#10b981';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden px-2 gap-1 py-1">
      <svg 
        viewBox={`0 0 ${svgWidth} ${svgWidth * 0.55}`} 
        className="w-[85%] max-w-[170px] h-auto max-h-[90px] transition-all flex-shrink-0"
      >
        <path
          d={`M ${svgWidth * 0.08} ${svgWidth * 0.48} A ${svgWidth * 0.4} ${svgWidth * 0.4} 0 0 1 ${svgWidth * 0.92} ${svgWidth * 0.48}`}
          fill="none"
          stroke="currentColor"
          className="opacity-10"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M ${svgWidth * 0.08} ${svgWidth * 0.48} A ${svgWidth * 0.4} ${svgWidth * 0.4} 0 0 1 ${svgWidth * 0.92} ${svgWidth * 0.48}`}
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * Math.PI * svgWidth * 0.4} ${Math.PI * svgWidth * 0.4}`}
          className="transition-all duration-700"
        />
        <line
          x1={svgWidth / 2}
          y1={svgWidth * 0.48}
          x2={needleX}
          y2={needleY}
          stroke={getColor()}
          strokeWidth="2.5"
          className="transition-all duration-700"
        />
        <circle cx={svgWidth / 2} cy={svgWidth * 0.48} r="5.5" fill={getColor()} />
      </svg>
      <div className="text-center -mt-1 font-bold text-white transition-all flex-shrink-0 leading-tight">
        <span style={{ fontSize: 'clamp(14px, 14cqmin, 24px)' }}>{value}</span>
        {label && (
          <span 
            className="opacity-50 ml-1 font-semibold truncate max-w-[70px] inline-block align-baseline"
            style={{ fontSize: 'clamp(8px, 6cqmin, 11px)' }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
