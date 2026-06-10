'use client';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';

type DataTableColumn<T> = {
  key: keyof T | string;
  headerKey: string;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  emptyKey?: string;
};

export function DataTable<T extends Record<string, unknown>>({ columns, rows, emptyKey = 'common.empty' }: DataTableProps<T>) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  return (
    <div className={`overflow-hidden rounded-lg border ${themeConfig.border}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className={themeConfig.tableHead}>
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-semibold" key={String(column.key)}>
                  {t(column.headerKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={`px-4 py-8 text-center ${themeConfig.textMuted}`} colSpan={columns.length}>
                  {t(emptyKey)}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr className={`border-t ${themeConfig.border} ${themeConfig.tableRow}`} key={String(row.id ?? rowIndex)}>
                  {columns.map((column) => (
                    <td className={`px-4 py-3 ${themeConfig.textSecondary}`} key={String(column.key)}>
                      {column.render ? column.render(row) : String(row[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
