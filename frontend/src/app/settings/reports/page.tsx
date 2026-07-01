'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { useTheme } from '@/lib/theme/theme-provider';
import { AppDialog, ConfirmDialog } from '@/components/shared/app-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listScheduledReports, createScheduledReport, updateScheduledReport,
  deleteScheduledReport, runScheduledReport,
} from '@/lib/services/reports';
import { Plus, Play, Trash2, Mail, Clock, FileSpreadsheet, FileText, Calendar, Pause, Check, X, AlertTriangle } from 'lucide-react';

const CRON_PRESETS = [
  { label: 'ทุกวัน เวลา 08:00', value: '0 8 * * *' },
  { label: 'ทุกวันจันทร์ เวลา 08:00', value: '0 8 * * 1' },
  { label: 'ทุกวันจันทร์ เวลา 09:00', value: '0 9 * * 1' },
  { label: 'วันแรกของเดือน เวลา 08:00', value: '0 8 1 * *' },
  { label: 'ทุกวัน เวลา 18:00 (จบงาน)', value: '0 18 * * *' },
];

export default function ReportsSettingsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [testRunId, setTestRunId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: listScheduledReports,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScheduledReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setDeleteTarget(null);
    },
  });

  const [form, setForm] = useState({
    name: '', description: '', type: 'cylinders', format: 'pdf' as 'pdf' | 'xlsx',
    cron: '0 8 * * 1', recipients: '',
  });

  const resetForm = () => {
    setForm({ name: '', description: '', type: 'cylinders', format: 'pdf', cron: '0 8 * * 1', recipients: '' });
    setEditId(null);
  };

  const openEdit = (r: typeof reports[0]) => {
    setForm({
      name: r.name, description: r.description || '', type: r.type, format: r.format,
      cron: r.cron, recipients: r.recipients.join(', '),
    });
    setEditId(r.id);
    setShowAdd(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: form.name, description: form.description || undefined,
        type: form.type, format: form.format, cron: form.cron,
        recipients: form.recipients.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (editId) return updateScheduledReport(editId, data);
      return createScheduledReport(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setShowAdd(false);
      resetForm();
    },
  });

  const runMutation = useMutation({
    mutationFn: runScheduledReport,
    onSuccess: (res) => {
      setTestResult(res);
      setTimeout(() => setTestResult(null), 5000);
    },
    onError: (err: any) => {
      setTestResult({ success: false, error: err.message });
      setTimeout(() => setTestResult(null), 5000);
    },
  });

  return (
    <AppLayout>
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className={`text-3xl font-bold tracking-normal ${themeConfig.textPrimary}`}>Scheduled Reports</h1>
            <p className={`mt-2 max-w-3xl text-sm leading-6 ${themeConfig.textSecondary}`}>
              จัดการรายงานที่ส่งอัตโนมัติตามเวลาที่กำหนด
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAdd(true); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium text-white transition-all ${themeConfig.primaryButton} shadow`}
          >
            <Plus size={15} />
            Add Report
          </button>
        </div>

        {testResult && (
          <div className={`rounded-lg p-4 flex items-center gap-3 ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            {testResult.success ? <Check size={18} className="text-emerald-400" /> : <AlertTriangle size={18} className="text-red-400" />}
            <p className={`text-sm ${testResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
              {testResult.success ? testResult.message : testResult.error}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className={`flex items-center justify-center py-16 ${themeConfig.textSecondary}`}>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Loading...
          </div>
        ) : reports.length === 0 ? (
          <div className={`rounded-xl p-10 text-center ${themeConfig.panel}`}>
            <Calendar size={40} className={`mx-auto ${themeConfig.textMuted}`} />
            <p className={`mt-4 font-semibold ${themeConfig.textPrimary}`}>ยังไม่มีรายงานที่กำหนดเวลา</p>
            <p className={`mt-1 text-sm ${themeConfig.textSecondary}`}>กด Add Report เพื่อเพิ่มรายงานแรก</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((r) => {
              const cronLabel = CRON_PRESETS.find((p) => p.value === r.cron)?.label || r.cron;
              return (
                <div key={r.id} className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow} ${!r.active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{r.name}</h3>
                        {!r.active && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">Paused</span>}
                      </div>
                      {r.description && <p className={`text-sm mt-1 ${themeConfig.textSecondary}`}>{r.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${themeConfig.badge}`}>
                          {r.format === 'pdf' ? <FileText size={12} /> : <FileSpreadsheet size={12} />}
                          {r.format.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${themeConfig.badge}`}>
                          <Clock size={12} />
                          {cronLabel}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${themeConfig.badge}`}>
                          <Mail size={12} />
                          {r.recipients.length} recipient(s)
                        </span>
                        {r.lastRunAt && (
                          <span className={`text-xs ${themeConfig.textMuted}`}>
                            Last run: {new Date(r.lastRunAt).toLocaleString('th-TH')}
                          </span>
                        )}
                        {r.lastError && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle size={12} /> {r.lastError}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setTestRunId(r.id); runMutation.mutate(r.id); }}
                        disabled={runMutation.isPending && testRunId === r.id}
                        className={`p-2 rounded-lg transition ${themeConfig.panelHover} ${themeConfig.textSecondary} hover:text-emerald-400 disabled:opacity-50`}
                        title="Run Now"
                      >
                        <Play size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className={`p-2 rounded-lg transition ${themeConfig.panelHover} ${themeConfig.textSecondary} hover:text-cyan-400`}
                        title="Edit"
                      >
                        <Clock size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r.id)}
                        className={`p-2 rounded-lg transition ${themeConfig.panelHover} text-red-400 hover:text-red-300`}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AppDialog
        open={showAdd}
        titleKey={editId ? 'Edit Report' : 'Add Report'}
        onClose={() => { setShowAdd(false); resetForm(); }}
      >
        <div className="space-y-4">
          <div>
            <label className={`block text-xs font-bold mb-1 ${themeConfig.textSecondary}`}>Report Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${themeConfig.border} ${themeConfig.input}`} />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 ${themeConfig.textSecondary}`}>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${themeConfig.border} ${themeConfig.input}`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1 ${themeConfig.textSecondary}`}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${themeConfig.border} ${themeConfig.input}`}>
                <option value="cylinders">Cylinders</option>
                <option value="inks">Ink Formulas</option>
                <option value="jobs">Production Jobs</option>
                <option value="orders">Sales Orders</option>
                <option value="audit">Audit Logs</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${themeConfig.textSecondary}`}>Format</label>
              <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as any })}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${themeConfig.border} ${themeConfig.input}`}>
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel (XLSX)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 ${themeConfig.textSecondary}`}>Cron Schedule</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {CRON_PRESETS.map((p) => (
                <button key={p.value} onClick={() => setForm({ ...form, cron: p.value })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border text-left ${
                    form.cron === p.value ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300' : `${themeConfig.border} ${themeConfig.textSecondary} hover:bg-white/5`
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            <input value={form.cron} onChange={(e) => setForm({ ...form, cron: e.target.value })}
              placeholder="0 8 * * 1"
              className={`w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none ${themeConfig.border} ${themeConfig.input}`} />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 ${themeConfig.textSecondary}`}>Recipients (comma-separated emails)</label>
            <input value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })}
              placeholder="admin@example.com, manager@example.com"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${themeConfig.border} ${themeConfig.input}`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setShowAdd(false); resetForm(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${themeConfig.secondaryButton}`}>
              Cancel
            </button>
            <button onClick={() => saveMutation.mutate()}
              disabled={!form.name || !form.cron || !form.recipients || saveMutation.isPending}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow ${themeConfig.primaryButton} disabled:opacity-50`}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </AppDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        titleKey="Delete Report"
        descriptionKey="common.confirmDelete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
