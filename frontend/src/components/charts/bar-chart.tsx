'use client';

import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from '@/lib/dashboard/dashboard-config';

interface Props {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  horizontal?: boolean;
}

export function BarChartComponent({ data, height = 200, color = '#22d3ee', horizontal }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsBar data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
          <XAxis dataKey={horizontal ? 'value' : 'label'} type={horizontal ? 'number' : 'category'} tick={{ fontSize: 10 }} stroke="currentColor" className="opacity-40" />
          <YAxis dataKey={horizontal ? 'label' : 'value'} type={horizontal ? 'category' : 'number'} tick={{ fontSize: 10 }} stroke="currentColor" className="opacity-40" />
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '12px' }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
