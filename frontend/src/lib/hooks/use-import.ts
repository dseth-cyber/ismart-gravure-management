'use client';

import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';

export type ImportResult<T = Record<string, unknown>> = {
  headers: string[];
  rows: T[];
  totalRows: number;
  fileName: string;
};

type UseImportReturn = {
  parseFile: (file: File) => Promise<ImportResult>;
  preview: ImportResult | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
};

export function useImport() {
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File): Promise<ImportResult> => {
    setLoading(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const headers = json.length > 0 ? Object.keys(json[0]) : [];

      if (headers.length === 0) {
        throw new Error('No columns found in the file');
      }

      const result: ImportResult = {
        headers,
        rows: json,
        totalRows: json.length,
        fileName: file.name,
      };
      setPreview(result);
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Failed to parse file';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setLoading(false);
    setError(null);
  }, []);

  return { parseFile, preview, loading, error, reset };
}
