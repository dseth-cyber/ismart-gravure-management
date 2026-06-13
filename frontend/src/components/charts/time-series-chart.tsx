'use client';

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimeSeriesPoint, ChartDataPoint } from '@/lib/dashboard/dashboard-config';

interface Props {
  data: TimeSeriesPoint[];
  data2?: TimeSeriesPoint[];
  height?: number | string;
  showArea?: boolean;
  lineColor?: string;
  areaColor?: string;
}

export function TimeSeriesChart({ data, data2, height = '100%', showArea = true, lineColor = '#22d3ee', areaColor = '#22d3ee' }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <div style={{ width: '100%', height }} className="flex-1 min-w-0 relative w-full h-full flex flex-col justify-center">
      <style>{`
        @container (max-height: 120px) {
          .recharts-cartesian-axis, .recharts-cartesian-grid { display: none !important; }
        }
        @container (max-width: 180px) {
          .recharts-cartesian-axis, .recharts-cartesian-grid { display: none !important; }
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
          <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="currentColor" className="opacity-40" />
          <YAxis tick={{ fontSize: 9 }} stroke="currentColor" className="opacity-40" />
          <Tooltip
            contentStyle={{ 
              background: 'rgba(15,23,42,0.9)', 
              border: '1px solid rgba(148,163,184,0.2)', 
              borderRadius: '8px', 
              fontSize: 'clamp(10px, 4.5cqmin, 22px)' 
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          {showArea ? (
            <Area type="monotone" dataKey="value" stroke={lineColor} fill={areaColor} fillOpacity={0.15} strokeWidth={1.5} dot={false} />
          ) : (
            <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={1.5} dot={false} />
          )}
          {data2 && (
            showArea ? (
              <Area type="monotone" dataKey="value" data={data2} stroke="#d946ef" fill="#d946ef" fillOpacity={0.1} strokeWidth={1.5} dot={false} />
            ) : (
              <Line type="monotone" dataKey="value" data={data2} stroke="#d946ef" strokeWidth={1.5} dot={false} />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
