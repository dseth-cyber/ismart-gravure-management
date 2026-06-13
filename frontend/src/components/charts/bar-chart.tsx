'use client';

import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from '@/lib/dashboard/dashboard-config';

interface Props {
  data: ChartDataPoint[];
  height?: number | string;
  color?: string;
  horizontal?: boolean;
}

export function BarChartComponent({ data, height = '100%', color = '#22d3ee', horizontal }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

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
        <RechartsBar data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
          <XAxis dataKey={horizontal ? 'value' : 'label'} type={horizontal ? 'number' : 'category'} tick={{ fontSize: 9 }} stroke="currentColor" className="opacity-40" />
          <YAxis dataKey={horizontal ? 'label' : 'value'} type={horizontal ? 'category' : 'number'} tick={{ fontSize: 9 }} stroke="currentColor" className="opacity-40" />
          <Tooltip
            contentStyle={{ 
              background: 'rgba(15,23,42,0.9)', 
              border: '1px solid rgba(148,163,184,0.2)', 
              borderRadius: '8px', 
              fontSize: 'clamp(10px, 4.5cqmin, 22px)' 
            }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
