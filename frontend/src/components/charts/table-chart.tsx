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
    <div className="overflow-auto h-full w-full table-container">
      <style>{`
        .table-container {
          font-size: clamp(9px, 4.2cqw, 18px);
        }
        .table-cell-padding {
          padding: clamp(3px, 1.5cqh, 8px) clamp(4px, 1.5cqw, 8px);
        }
        @container (max-width: 380px) {
          .table-col-operator, .table-col-inspector, .table-col-date, .table-col-expiry {
            display: none !important;
          }
        }
        @container (max-width: 250px) {
          .table-col-productCode, .table-col-remaining, .table-col-location, .table-col-meter, .table-col-totalPrinted {
            display: none !important;
          }
        }
      `}</style>
      <table className="w-full text-left font-medium leading-normal text-white/95 border-collapse">
        <thead>
          <tr className={`border-b ${themeConfig.border}`}>
            {cols.map(col => (
              <th key={col.key} className={`table-cell-padding font-bold uppercase opacity-60 table-col-${col.key}`}>{col.label}</th>
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
                    <td key={col.key} className={`table-cell-padding table-col-${col.key}`}>
                      <StatusBadge status={val as any} />
                    </td>
                  );
                }
                return (
                  <td key={col.key} className={`table-cell-padding table-col-${col.key}`}>
                    {formatCell(col.key, val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
