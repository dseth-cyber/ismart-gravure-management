'use client';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { tLabel } from '@/lib/dashboard/i18n-labels';
import { StatusBadge } from '@/components/shared/status-badge';

interface Props {
  data: Record<string, unknown>[];
  height?: number;
  columns?: { key: string; label: string }[];
}

const COLUMN_LABELS: Record<string, string> = {
  jobNumber: 'Job Number',
  productCode: 'Product',
  machineName: 'Machine',
  operator: 'Operator',
  status: 'Status',
  totalPrinted: 'Meter Run',
};

export function TableChart({ data, height: _height, columns }: Props) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;
  }

  const cols = columns || (data.length > 0 ? Object.keys(data[0]).map(k => ({
    key: k,
    label: tLabel(t, COLUMN_LABELS[k] || k),
  })) : []);

  const formatCell = (key: string, value: unknown): string => {
    if (key === 'status' && typeof value === 'string') return tLabel(t, value);
    if (key === 'totalPrinted' && typeof value === 'number' && value > 0) return `${value.toLocaleString()} m`;
    if (key === 'totalPrinted' && (value === 0 || value === '0')) return '—';
    return String(value ?? '—');
  };

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className={`border-b ${themeConfig.border}`}>
            {cols.map(col => (
              <th key={col.key} className="p-2 font-bold uppercase opacity-60">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={`border-b ${themeConfig.border} ${themeConfig.tableRow}`}>
              {cols.map(col => {
                const val = row[col.key];
                if (col.key === 'status' && typeof val === 'string') {
                  return (
                    <td key={col.key} className="p-2">
                      <StatusBadge status={val as any} />
                    </td>
                  );
                }
                return <td key={col.key} className="p-2">{formatCell(col.key, val)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
