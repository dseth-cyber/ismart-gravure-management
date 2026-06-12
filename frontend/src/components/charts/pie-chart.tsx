'use client';

import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartDataPoint } from '@/lib/dashboard/dashboard-config';

interface Props {
  data: ChartDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = ['#22d3ee', '#d946ef', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7', '#14b8a6'];

export function PieChartComponent({ data, height = 200, innerRadius = 40, outerRadius = 70 }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
