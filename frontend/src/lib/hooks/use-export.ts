'use client';

import { useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export type ExportColumn = {
  key: string;
  label: string;
  format?: (value: unknown) => string;
};

function formatValue(value: unknown, col?: ExportColumn): string {
  if (col?.format) return col.format(value);
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function useExport() {
  const captureRef = useRef<HTMLDivElement>(null);

  const exportExcel = useCallback(
    (data: Record<string, unknown>[], columns: ExportColumn[], filename: string) => {
      const header = columns.map((c) => c.label);
      const rows = data.map((row) => columns.map((col) => formatValue(row[col.key], col)));
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    },
    [],
  );

  const exportPDF = useCallback(
    (data: Record<string, unknown>[], columns: ExportColumn[], filename: string, title?: string) => {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      if (title) {
        doc.setFontSize(14);
        doc.text(title, 14, 20);
      }
      const header = columns.map((c) => c.label);
      const rows = data.map((row) => columns.map((col) => formatValue(row[col.key], col)));
      autoTable(doc, {
        head: [header],
        body: rows,
        startY: title ? 28 : 14,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        margin: { top: 14 },
      });
      doc.save(`${filename}.pdf`);
    },
    [],
  );

  const exportImage = useCallback(async (element: HTMLElement, filename: string) => {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f172a',
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  return { exportExcel, exportPDF, exportImage, captureRef };
}
