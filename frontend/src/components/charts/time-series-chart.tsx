'use client';

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimeSeriesPoint, ChartDataPoint } from '@/lib/dashboard/dashboard-config';

interface Props {
  data: TimeSeriesPoint[];
  data2?: TimeSeriesPoint[];
  height?: number;
  showArea?: boolean;
  lineColor?: string;
  areaColor?: string;
}

export function TimeSeriesChart({ data, data2, height = 200, showArea = true, lineColor = '#22d3ee', areaColor = '#22d3ee' }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  const ChartComponent = showArea ? AreaChart : LineChart;
  const DataComponent = showArea ? Area : Line;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="currentColor" className="opacity-40" />
          <YAxis tick={{ fontSize: 10 }} stroke="currentColor" className="opacity-40" />
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          {showArea ? (
            <Area type="monotone" dataKey="value" stroke={lineColor} fill={areaColor} fillOpacity={0.15} strokeWidth={2} dot={false} />
          ) : (
            <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={false} />
          )}
          {data2 && (
            showArea ? (
              <Area type="monotone" dataKey="value" data={data2} stroke="#d946ef" fill="#d946ef" fillOpacity={0.1} strokeWidth={2} dot={false} />
            ) : (
              <Line type="monotone" dataKey="value" data={data2} stroke="#d946ef" strokeWidth={2} dot={false} />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
