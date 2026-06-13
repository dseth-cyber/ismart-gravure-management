'use client';

import { useTranslation } from 'react-i18next';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartDataPoint } from '@/lib/dashboard/dashboard-config';
import { tLabel } from '@/lib/dashboard/i18n-labels';

interface Props {
  data: ChartDataPoint[];
  height?: number | string;
  innerRadius?: number | string;
  outerRadius?: number | string;
}

const DEFAULT_COLORS = ['#22d3ee', '#d946ef', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7', '#14b8a6'];

export function PieChartComponent({ data, height = '100%' }: Props) {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  // Filter out aggregate values or non-slice stats like Total, Rate, Efficiency, Output
  const filteredData = data.filter(d => 
    !d.label.toLowerCase().includes('total') &&
    !d.label.toLowerCase().includes('rate') &&
    !d.label.toLowerCase().includes('efficiency') &&
    !d.label.toLowerCase().includes('output')
  ).map((d) => ({ ...d, label: tLabel(t, d.label) }));

  // Find dynamic pass rate or calculate it based on first slice
  const rateItem = data.find(d => 
    d.label.toLowerCase().includes('rate') || 
    d.label.toLowerCase().includes('efficiency')
  );

  const totalSum = filteredData.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const centerPercent = rateItem 
    ? Math.floor(Number(rateItem.value)) 
    : Math.floor((filteredData[0]?.value / totalSum) * 100);

  return (
    <div style={{ width: '100%', height }} className="flex-1 min-w-0 relative w-full h-full flex items-center justify-start pl-8 gap-[6cqw]">
      <style>{`
        .donut-layout-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: clamp(16px, 8cqw, 48px);
          width: 100%;
          height: 100%;
        }
        @container (max-width: 290px) {
          .donut-layout-container {
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          .donut-legend-container {
            width: auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
        @container (max-height: 120px) {
          .donut-legend-container {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="donut-layout-container">
        {/* Left: Donut Chart with centered absolute text */}
        <div className="relative flex-shrink-0 flex items-center justify-center animate-fade-in" style={{ width: 'clamp(100px, 65cqmin, 240px)', height: 'clamp(100px, 65cqmin, 240px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={filteredData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="72%"
                outerRadius="95%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                stroke="none"
              >
                {filteredData.map((entry, i) => (
                  <Cell key={i} fill={entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  background: 'rgba(15,23,42,0.9)', 
                  border: '1px solid rgba(148,163,184,0.2)', 
                  borderRadius: '8px', 
                  fontSize: 'clamp(11px, 5cqmin, 22px)' 
                }}
              />
            </RechartsPie>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="font-black text-white leading-none" style={{ fontSize: 'clamp(16px, 16cqmin, 44px)' }}>
              {centerPercent}%
            </span>
          </div>
        </div>

        {/* Right: Custom HTML Legend */}
        <div className="flex flex-col gap-3 justify-center donut-legend-container flex-1 pr-4">
          {filteredData.map((entry, i) => (
            <div key={i} className="flex items-center font-bold text-white/95" style={{ fontSize: 'clamp(12px, 5.5cqmin, 26px)' }}>
              <span 
                className="rounded-full flex-shrink-0 mr-3 animate-pulse" 
                style={{ 
                  backgroundColor: entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                  width: 'clamp(10px, 3.8cqmin, 16px)',
                  height: 'clamp(10px, 3.8cqmin, 16px)'
                }} 
              />
              <span className="opacity-60 text-left truncate mr-4" style={{ width: 'clamp(85px, 22cqmin, 180px)', fontSize: 'inherit' }}>{entry.label}</span>
              <span className="font-black text-left" style={{ fontSize: 'clamp(14px, 6cqmin, 30px)' }}>{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
