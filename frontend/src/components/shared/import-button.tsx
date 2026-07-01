'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, Check, AlertTriangle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { useImport, type ImportResult } from '@/lib/hooks/use-import';

type ColumnMap = { from: string; to: string };

type ImportButtonProps = {
  fieldMapping: { key: string; label: string; required?: boolean }[];
  onImport: (rows: Record<string, unknown>[], mapping: ColumnMap[]) => Promise<void>;
  label?: string;
};

export function ImportButton({ fieldMapping, onImport, label }: ImportButtonProps) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const { parseFile, loading, error, reset } = useImport();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMap[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setDone(false);
    try {
      const result = await parseFile(file);
      setPreview(result);
      const auto: ColumnMap[] = result.headers.map((h) => {
        const match = fieldMapping.find(
          (f) => f.key.toLowerCase() === h.toLowerCase() || f.label.toLowerCase() === h.toLowerCase(),
        );
        return { from: h, to: match?.key || '' };
      });
      setMapping(auto);
    } catch (err: any) {
      setImportError(err.message || 'Parse failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  }, [parseFile, fieldMapping]);

  const handleImport = useCallback(async () => {
    if (!preview) return;
    setImporting(true);
    setImportError(null);
    try {
      await onImport(preview.rows, mapping.filter((m) => m.to));
      setDone(true);
      setPreview(null);
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [preview, mapping, onImport]);

  const closePreview = useCallback(() => {
    setPreview(null);
    reset();
    setImportError(null);
  }, [reset]);

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all ${themeConfig.secondaryButton} shadow disabled:opacity-50`}
      >
        {loading ? <Loader size={15} className="animate-spin" /> : <Upload size={15} />}
        {label || t('btn.import') || 'Import'}
      </button>

      {/* Preview Dialog */}
      {(preview || importError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePreview} />
          <div className={`relative max-w-2xl w-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl ${themeConfig.dialog}`}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>
                {done ? t('common.done') || 'Done' : t('common.preview') || 'Preview'}
              </h3>
              <button onClick={closePreview} className={`p-1 rounded-lg ${themeConfig.panelHover} ${themeConfig.textSecondary}`}>
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {done ? (
                <div className="text-center py-8">
                  <Check size={40} className="mx-auto mb-3 text-emerald-400" />
                  <p className={`text-sm font-semibold ${themeConfig.textPrimary}`}>
                    {t('common.importDone') || `Imported ${preview?.totalRows || 0} rows successfully`}
                  </p>
                </div>
              ) : importError ? (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-300">{importError}</p>
                </div>
              ) : preview ? (
                <div className="space-y-4">
                  <p className={`text-sm ${themeConfig.textSecondary}`}>
                    <FileSpreadsheet size={14} className="inline mr-1" />
                    {preview.fileName} — {preview.totalRows} rows, {preview.headers.length} columns
                  </p>

                  {/* Column Mapping */}
                  <div>
                    <p className={`text-xs font-semibold mb-2 ${themeConfig.textSecondary}`}>
                      {t('common.mapColumns') || 'Map columns:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {mapping.map((m) => (
                        <div key={m.from} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${themeConfig.badge}`}>
                          <span className={`${themeConfig.textSecondary}`}>{m.from}</span>
                          <span className="text-cyan-400">→</span>
                          <select
                            value={m.to}
                            onChange={(e) => setMapping((prev) => prev.map((p) => p.from === m.from ? { ...p, to: e.target.value } : p))}
                            className={`bg-transparent outline-none ${themeConfig.textPrimary} text-xs`}
                          >
                            <option value="">—</option>
                            {fieldMapping.map((f) => (
                              <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview Table (first 5 rows) */}
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={`${themeConfig.tableHead}`}>
                          {preview.headers.map((h) => (
                            <th key={h} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className={`border-t border-white/5 ${themeConfig.tableRow}`}>
                            {preview.headers.map((h) => (
                              <td key={h} className={`px-2 py-1.5 ${themeConfig.textSecondary} truncate max-w-[150px]`}>
                                {String(row[h] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.totalRows > 5 && (
                    <p className={`text-[10px] ${themeConfig.textMuted}`}>... and {preview.totalRows - 5} more rows</p>
                  )}
                </div>
              ) : null}
            </div>

            {!done && preview && (
              <div className="flex justify-end gap-2 p-4 border-t border-white/10">
                <button onClick={closePreview} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                  {t('btn.cancel')}
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || mapping.every((m) => !m.to)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow disabled:opacity-50 ${themeConfig.primaryButton}`}
                >
                  {importing ? <Loader size={14} className="animate-spin inline mr-1" /> : null}
                  {t('btn.import') || 'Import'} ({mapping.filter((m) => m.to).length} cols)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
