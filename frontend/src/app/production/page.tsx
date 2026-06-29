'use client';

import { useState, Fragment, useEffect, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { useTheme } from '@/lib/theme/theme-provider';
import { StatusBadge, type StatusKind } from '@/components/shared/status-badge';
import { ColorBadge } from '@/components/shared/color-badge';
import { AppDialog } from '@/components/shared/app-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BatchToolbar, BatchSelectAllCheckbox, BatchRowCheckbox } from '@/components/shared/batch-toolbar';
import { useExport, type ExportColumn } from '@/lib/hooks/use-export';
import { ExportButton } from '@/components/shared/export-button';

const QrScanner = dynamic(() => import('@/components/shared/qr-scanner').then(m => ({ default: m.QrScanner })), { ssr: false });
import { listJobs, deleteJob, restoreJob, permanentDeleteJob, emptyJobTrash, batchUpdateJobStatus, batchDeleteJobs, batchRestoreJobs } from '@/lib/services/job';
import { getTraceability } from '@/lib/services/qc';
import type { ProductionJobDto } from '@shared/dto/job/job.dto';
import { 
  QrCode, 
  Layers, 
  Droplet, 
  Shield, 
  Check, 
  AlertTriangle, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  User, 
  Settings, 
  Camera, 
  X,
  List,
  Factory,
  RefreshCw,
  Plus,
  Trash2,
  RotateCcw
} from 'lucide-react';

function ProductionPageContent() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active tab state
  const tabParam = searchParams.get('tab') || 'verification';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/production?tab=${tab}`);
  };

  // Verification flow state
  const [step, setStep] = useState(0);
  const [scannerKey, setScannerKey] = useState(0);
  const [scannerError, setScannerError] = useState('');
  const [scanResults, setScanResults] = useState<{
    job: { id: string; product: string; customer: string } | null;
    cylinders: Array<{ id: string; color: string; match: boolean }>;
    inks: Array<{ id: string; color: string; formula: string; match: boolean; expiryOk: boolean }>;
  }>({
    job: null,
    cylinders: [],
    inks: [],
  });
  const [manualInput, setManualInput] = useState('');

  const onJobScanned = (code: string) => {
    setScanResults(prev => ({
      ...prev,
      job: { id: code, product: code.startsWith('J') ? 'PROD-' + code.slice(-4) : code, customer: '—' }
    }));
    setStep(2);
    setScannerKey(k => k + 1);
  };

  const onCylinderScanned = (code: string) => {
    setScanResults(prev => ({
      ...prev,
      cylinders: [...prev.cylinders, { id: code, color: 'Scanned', match: true }]
    }));
    setScannerKey(k => k + 1);
  };

  const onInkScanned = (code: string) => {
    setScanResults(prev => ({
      ...prev,
      inks: [...prev.inks, { id: code, color: 'Scanned', formula: code.includes('-') ? code.split('-').slice(0, -1).join('-') : code, match: true, expiryOk: true }]
    }));
    setScannerKey(k => k + 1);
  };

  const handleManualJob = () => {
    if (!manualInput.trim()) return;
    onJobScanned(manualInput.trim());
    setManualInput('');
  };

  const handleManualCylinder = () => {
    if (!manualInput.trim()) return;
    onCylinderScanned(manualInput.trim());
    setManualInput('');
  };

  const handleManualInk = () => {
    if (!manualInput.trim()) return;
    onInkScanned(manualInput.trim());
    setManualInput('');
  };

  const removeCylinder = (id: string) => {
    setScanResults(prev => ({
      ...prev,
      cylinders: prev.cylinders.filter(c => c.id !== id)
    }));
  };

  const removeInk = (id: string) => {
    setScanResults(prev => ({
      ...prev,
      inks: prev.inks.filter(i => i.id !== id)
    }));
  };

  const resetVerification = () => {
    setStep(0);
    setScanResults({ job: null, cylinders: [], inks: [] });
    setScannerKey(k => k + 1);
    setScannerError('');
    setManualInput('');
  };

  const allPass = step === 4 && scanResults.inks.every(i => i.match && i.expiryOk);
  const hasFail = step === 4 && scanResults.inks.some(i => !i.match || !i.expiryOk);

  const verificationSteps = [
    { num: 1, label: t('prod.scanJob'), icon: QrCode },
    { num: 2, label: t('prod.scanCylinders'), icon: Layers },
    { num: 3, label: t('prod.scanInk'), icon: Droplet },
    { num: 4, label: t('prod.result'), icon: Shield },
  ];

  // Trash bin state
  const [showTrash, setShowTrash] = useState(false);
  const [confirmDeleteJob, setConfirmDeleteJob] = useState<string | null>(null);
  const [confirmPermanentDeleteJob, setConfirmPermanentDeleteJob] = useState<string | null>(null);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchRestoreOpen, setBatchRestoreOpen] = useState(false);
  const queryClient = useQueryClient();

  // Production Log State
  const { data: jobs, isLoading: prodLoading, error: prodErrorObj, refetch: fetchJobs } = useQuery<ProductionJobDto[], Error>({
    queryKey: ['productionJobs', showTrash],
    queryFn: () => listJobs({ showDeleted: showTrash ? 'true' : 'false' }),
  });
  const jobsList = jobs || [];
  const prodError = prodErrorObj?.message || '';

  // Traceability State
  const [dimension, setDimension] = useState('product');
  const [query, setQuery] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceResults, setTraceResults] = useState<{
    product: string;
    customer: string;
    jobs: Array<{ job: string; date: string; machine: string; operator: string; meter: number }>;
    cylinders: Array<{ id: string; color: string; meter: number }>;
    inks: Array<{ id: string; color: string; formula: string }>;
  } | null>(null);

  const traceDimensions = [
    { id: 'product', label: t('col.productCode'), icon: List },
    { id: 'job', label: t('col.job'), icon: Factory },
    { id: 'cylinder', label: t('col.cylinder'), icon: Layers },
    { id: 'inkBatch', label: t('col.inkBatch'), icon: Droplet },
    { id: 'machine', label: t('col.machine'), icon: Settings },
    { id: 'operator', label: t('col.operator'), icon: User },
  ];

  const handleTraceSearch = async () => {
    if (!query.trim()) return;
    try {
      setTraceLoading(true);
      const result = await getTraceability({ [dimension]: query });
      setTraceResults({
        product: result.productCode,
        customer: result.customerName,
        jobs: result.jobs.map(j => ({ job: j.jobNumber, date: typeof j.plannedDate === 'string' ? j.plannedDate : j.plannedDate.toISOString().split('T')[0], machine: j.machineName, operator: j.operator || '', meter: j.totalPrinted })),
        cylinders: result.cylinders.map(c => ({ id: c.cylinderId, color: c.colorName, meter: c.meter })),
        inks: result.inks.map(i => ({ id: i.batchId, color: i.color, formula: i.formulaCode })),
      });
    } catch (err: any) {
      console.error('Traceability search failed:', err);
    } finally {
      setTraceLoading(false);
    }
  };

  // Trash bin handlers
  const handleDeleteJob = async () => {
    if (!confirmDeleteJob) return;
    try {
      await deleteJob(confirmDeleteJob);
      setConfirmDeleteJob(null);
      queryClient.invalidateQueries({ queryKey: ['productionJobs'] });
    } catch (err: any) {
      console.error('Failed to delete job', err);
    }
  };

  // Clear selection when trash state changes
  useEffect(() => {
    setSelectedJobIds([]);
  }, [showTrash]);

  const handleBatchStatusChange = async (status: string) => {
    try {
      await batchUpdateJobStatus(selectedJobIds, status);
      queryClient.invalidateQueries({ queryKey: ['productionJobs'] });
      setSelectedJobIds([]);
    } catch (err: any) {
      console.error('Failed to batch update job status', err);
    } finally {
      setBatchStatusOpen(false);
    }
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeleteJobs(selectedJobIds);
      queryClient.invalidateQueries({ queryKey: ['productionJobs'] });
      setSelectedJobIds([]);
    } catch (err: any) {
      console.error('Failed to batch delete jobs', err);
    } finally {
      setBatchDeleteOpen(false);
    }
  };

  const handleBatchRestore = async () => {
    try {
      await batchRestoreJobs(selectedJobIds);
      queryClient.invalidateQueries({ queryKey: ['productionJobs'] });
      setSelectedJobIds([]);
    } catch (err: any) {
      console.error('Failed to batch restore jobs', err);
    } finally {
      setBatchRestoreOpen(false);
    }
  };

  const handleRestoreJob = async (jobNumber: string) => {
    try {
      await restoreJob(jobNumber);
      queryClient.invalidateQueries({ queryKey: ['productionJobs'] });
    } catch (err: any) {
      console.error('Failed to restore job', err);
    }
  };

  const handlePermanentDeleteJob = async () => {
    if (!confirmPermanentDeleteJob) return;
    try {
      await permanentDeleteJob(confirmPermanentDeleteJob);
      setConfirmPermanentDeleteJob(null);
      queryClient.invalidateQueries({ queryKey: ['productionJobs'] });
    } catch (err: any) {
      console.error('Failed to permanently delete job', err);
    }
  };

  const { exportExcel, exportPDF } = useExport();

  const jobColumns: ExportColumn[] = [
    { key: 'jobNumber', label: 'Job' },
    { key: 'productCode', label: 'Product' },
    { key: 'machineName', label: 'Machine' },
    { key: 'status', label: 'Status' },
    { key: 'totalPrinted', label: 'Meter Run', format: (v) => `${(v as number).toLocaleString()} m` },
    { key: 'plannedDate', label: 'Date', format: (v) => v ? (typeof v === 'string' ? v : new Date(v as any).toLocaleDateString()) : '—' },
  ];

  const handleEmptyTrash = async () => {
    try {
      await emptyJobTrash();
      setEmptyTrashConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['productionJobs'] });
    } catch (err: any) {
      console.error('Failed to empty trash', err);
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader 
          titleKey="prod.title" 
          subtitleKey="prod.subtitle" 
          actions={
            <div className="flex items-center gap-2">
              {['verification', 'log', 'traceability'].map(tKey => (
                <button
                  key={tKey}
                  onClick={() => changeTab(tKey)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeTab === tKey 
                      ? `${themeConfig.primaryBg} text-white` 
                      : `${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`
                  }`}
                >
                  {t(`prod.${tKey === 'log' ? 'prodLog' : tKey}`)}
                </button>
              ))}
              <button
                onClick={() => setShowTrash(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all shadow ${
                  showTrash
                    ? 'bg-red-600 hover:bg-red-500 text-white font-semibold'
                    : `${themeConfig.secondaryButton}`
                }`}
              >
                <Trash2 className="h-4 w-4" />
                {showTrash ? t('common.viewActive') || 'View Active' : t('common.trashBin') || 'Trash Bin'}
              </button>
              {showTrash && jobsList.length > 0 && (
                <button
                  onClick={() => setEmptyTrashConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all shadow text-red-400 border border-red-500/30 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.emptyTrash') || 'Empty Trash'}
                </button>
              )}
            </div>
          }
        />

        {/* 1. Verification Sub Page */}
        {activeTab === 'verification' && (
          <div className="max-w-2xl mx-auto w-full">
            <div className={`rounded-xl p-6 ${themeConfig.panel} ${themeConfig.shadow}`}>
              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
                {verificationSteps.map((s, i) => {
                  const Icon = s.icon;
                  const active = step >= s.num;
                  return (
                    <Fragment key={s.num}>
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          active 
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' 
                            : `${themeConfig.badge} ${themeConfig.textMuted}`
                        }`}>
                          <Icon size={18} />
                        </div>
                        <span className={`text-[10px] font-bold ${active ? themeConfig.primaryText : themeConfig.textMuted} text-center`}>
                          {s.label}
                        </span>
                      </div>
                      {i < verificationSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 min-w-[30px] mx-2 -translate-y-4 ${
                          step > s.num ? 'bg-cyan-500' : 'bg-white/10'
                        }`}></div>
                      )}
                    </Fragment>
                  );
                })}
              </div>

              {/* Step 0: Welcome / Start */}
              {step === 0 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto mb-5 shadow-lg text-cyan-400">
                    <Shield size={36} />
                  </div>
                  <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-2`}>{t('prod.preVerify')}</h3>
                  <p className={`text-sm ${themeConfig.textSecondary} max-w-md mx-auto mb-6`}>{t('prod.preVerifyDesc')}</p>
                  <button 
                    onClick={() => setStep(1)} 
                    className={`px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 ${themeConfig.primaryButton}`}
                  >
                    {t('btn.startVerify')}
                  </button>
                </div>
              )}

              {/* Step 1: Scan Job */}
              {step === 1 && (
                <div className="py-4">
                  <h4 className={`text-sm font-bold ${themeConfig.textPrimary} mb-1 text-center`}>{t('prod.scanJob')}</h4>
                  <p className={`text-xs ${themeConfig.textMuted} mb-4 text-center`}>{t('prod.scanJobSub')}</p>
                  <QrScanner key={scannerKey} onScan={onJobScanned} onError={setScannerError} width={280} height={280} />
                  {scannerError && (
                    <p className="text-xs text-amber-400 text-center mt-2 font-semibold">{scannerError}</p>
                  )}
                  <div className={`mt-4 flex items-center gap-2 ${scannerError ? 'mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20' : ''}`}>
                    <input
                      type="text"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualJob()}
                      placeholder={t('prod.enterManual') || 'Enter job number...'}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs border outline-none ${themeConfig.input}`}
                    />
                    <button onClick={handleManualJob} disabled={!manualInput.trim()} className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow transition ${themeConfig.primaryButton} disabled:opacity-50`}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Scan Cylinders */}
              {step === 2 && scanResults.job && (
                <div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 flex items-center gap-3">
                    <Check size={16} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-emerald-400">{t('prod.scanJob')}: {scanResults.job.id}</span>
                      <span className={`text-xs ${themeConfig.textSecondary} ml-2`}>· {scanResults.job.product}</span>
                    </div>
                  </div>

                  {scanResults.cylinders.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <p className={`text-xs font-bold ${themeConfig.textSecondary} mb-2`}>{t('col.cylinder')} ({scanResults.cylinders.length})</p>
                      {scanResults.cylinders.map(c => (
                        <div key={c.id} className={`flex items-center gap-2 p-2 rounded-lg border ${themeConfig.border} ${themeConfig.badge}`}>
                          <Layers size={14} className="text-cyan-400 flex-shrink-0" />
                          <span className={`text-xs font-mono font-bold flex-1 ${themeConfig.textPrimary}`}>{c.id}</span>
                          <button onClick={() => removeCylinder(c.id)} className="text-rose-400 hover:text-rose-300 transition">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-4">
                    <h5 className={`text-xs font-bold ${themeConfig.textPrimary} mb-3 text-center`}>{t('prod.scanCylinders')}</h5>
                    <QrScanner key={`cyl-${scannerKey}`} onScan={onCylinderScanned} onError={setScannerError} width={280} height={280} />
                    {scannerError && (
                      <p className="text-xs text-amber-400 text-center mt-2 font-semibold">{scannerError}</p>
                    )}
                    <div className={`mt-3 flex items-center gap-2 ${scannerError ? 'mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20' : ''}`}>
                      <input
                        type="text"
                        value={manualInput}
                        onChange={e => setManualInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleManualCylinder()}
                        placeholder={t('prod.enterManual') || 'Enter cylinder code...'}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs border outline-none ${themeConfig.input}`}
                      />
                      <button onClick={handleManualCylinder} disabled={!manualInput.trim()} className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow transition ${themeConfig.primaryButton} disabled:opacity-50`}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setScannerKey(k => k + 1)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${themeConfig.secondaryButton}`}>
                        <RefreshCw size={12} className="inline mr-1" />{t('prod.reScan') || 'Re-scan'}
                      </button>
                      <button onClick={() => setStep(3)} className={`flex-1 py-2 rounded-lg text-xs font-bold text-white shadow transition ${themeConfig.primaryButton}`}>
                        {t('prod.doneScanning') || 'Done'} →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Scan Inks */}
              {step === 3 && scanResults.job && (
                <div>
                  <div className="space-y-1.5 mb-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-emerald-400">{t('prod.scanJob')}: {scanResults.job.id}</span>
                    </div>
                    {scanResults.cylinders.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Check size={14} className="text-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-emerald-400">{t('prod.scanCylinders')} ({scanResults.cylinders.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResults.cylinders.map(c => (
                            <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                              {c.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {scanResults.inks.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <p className={`text-xs font-bold ${themeConfig.textSecondary} mb-2`}>{t('col.inkBatch')} ({scanResults.inks.length})</p>
                      {scanResults.inks.map(i => (
                        <div key={i.id} className={`flex items-center gap-2 p-2 rounded-lg border ${themeConfig.border} ${themeConfig.badge}`}>
                          <Droplet size={14} className="text-cyan-400 flex-shrink-0" />
                          <span className={`text-xs font-mono font-bold flex-1 ${themeConfig.textPrimary}`}>{i.id}</span>
                          <span className={`text-[10px] font-semibold ${themeConfig.textMuted}`}>{i.formula}</span>
                          <button onClick={() => removeInk(i.id)} className="text-rose-400 hover:text-rose-300 transition">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-4">
                    <h5 className={`text-xs font-bold ${themeConfig.textPrimary} mb-3 text-center`}>{t('prod.scanInk')}</h5>
                    <QrScanner key={`ink-${scannerKey}`} onScan={onInkScanned} onError={setScannerError} width={280} height={280} />
                    {scannerError && (
                      <p className="text-xs text-amber-400 text-center mt-2 font-semibold">{scannerError}</p>
                    )}
                    <div className={`mt-3 flex items-center gap-2 ${scannerError ? 'mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20' : ''}`}>
                      <input
                        type="text"
                        value={manualInput}
                        onChange={e => setManualInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleManualInk()}
                        placeholder={t('prod.enterManual') || 'Enter ink batch code...'}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs border outline-none ${themeConfig.input}`}
                      />
                      <button onClick={handleManualInk} disabled={!manualInput.trim()} className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow transition ${themeConfig.primaryButton} disabled:opacity-50`}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setScannerKey(k => k + 1)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${themeConfig.secondaryButton}`}>
                        <RefreshCw size={12} className="inline mr-1" />{t('prod.reScan') || 'Re-scan'}
                      </button>
                      <button onClick={() => setStep(4)} disabled={scanResults.inks.length === 0} className={`flex-1 py-2 rounded-lg text-xs font-bold text-white shadow transition ${themeConfig.primaryButton} disabled:opacity-50`}>
                        {t('prod.viewResult') || 'View Result'} →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Verification Result */}
              {step === 4 && (
                <div>
                  <div className={`p-5 rounded-xl text-center mb-6 border ${
                    allPass 
                      ? 'bg-emerald-500/10 border-emerald-500/20' 
                      : 'bg-rose-500/10 border-rose-500/20'
                  }`}>
                    {allPass ? (
                      <>
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                          <Check size={28} />
                        </div>
                        <p className="text-lg font-bold text-emerald-400">{t('prod.passed')}</p>
                        <p className={`text-xs ${themeConfig.textSecondary} mt-1.5`}>{t('prod.authorized')}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-3 text-rose-400">
                          <AlertTriangle size={28} />
                        </div>
                        <p className="text-lg font-bold text-rose-400">{t('prod.failed')}</p>
                        <p className={`text-xs ${themeConfig.textSecondary} mt-1.5`}>{t('prod.fixIssues')}</p>
                      </>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {scanResults.inks.map(ink => {
                      const isValid = ink.match && ink.expiryOk;
                      return (
                        <div 
                          key={ink.id} 
                          className={`flex items-center gap-3 p-3.5 rounded-lg border ${
                            isValid 
                              ? 'bg-emerald-500/5 border-emerald-500/15' 
                              : 'bg-rose-500/5 border-rose-500/15'
                          }`}
                        >
                          {isValid ? (
                            <Check size={16} className="text-emerald-400 flex-shrink-0" />
                          ) : (
                            <X size={16} className="text-rose-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold font-mono ${themeConfig.textPrimary}`}>{ink.id}</span>
                              <ColorBadge name={ink.color} />
                            </div>
                            {!ink.expiryOk && (
                              <p className="text-xs text-rose-400 font-semibold mt-1 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                {t('prod.supervisorApproval')}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs font-semibold ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {ink.formula}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={resetVerification} 
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition border border-transparent ${themeConfig.secondaryButton}`}
                    >
                      {t('prod.newVerify')}
                    </button>
                    {hasFail && (
                      <button 
                        onClick={() => alert(t('prod.supervisorApproval') + ' Requested')}
                        className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white shadow bg-amber-500 hover:bg-amber-400 transition"
                      >
                        {t('prod.requestOverride')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Production Log Sub Page */}
        {activeTab === 'log' && (
          <div className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{t('prod.prodLog')}</h3>
              <ExportButton
                showImage={false}
                onExportExcel={() => exportExcel(jobsList as any, jobColumns, 'production-log')}
                onExportPDF={() => exportPDF(jobsList as any, jobColumns, 'production-log', 'Production Log')}
              />
            </div>

            {prodLoading ? (
              <div className={`flex items-center justify-center py-16 ${themeConfig.textSecondary}`}>
                <RefreshCw size={20} className="animate-spin mr-2" />
                {t('common.loading')}
              </div>
            ) : prodError ? (
              <div className="flex flex-col items-center justify-center py-16 text-rose-400 gap-2">
                <AlertTriangle size={24} />
                <p className="text-sm">{prodError}</p>
                <button onClick={() => fetchJobs()} className={`px-4 py-2 rounded-lg text-sm font-medium ${themeConfig.primaryButton}`}>
                  {t('btn.retry')}
                </button>
              </div>
            ) : jobsList.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-16 ${themeConfig.textSecondary}`}>
                <p className="text-sm">{t('common.empty')}</p>
              </div>
            ) : (
            <>
              <BatchToolbar
                items={jobsList}
                selectedIds={selectedJobIds}
                onSelectionChange={setSelectedJobIds}
                showTrash={showTrash}
                getId={(j: any) => j.jobNumber}
                actions={showTrash ? [
                  { label: t('common.restore'), icon: <RotateCcw size={13} />, variant: 'warning', onClick: () => setBatchRestoreOpen(true) },
                  { label: t('common.permanentDelete'), icon: <Trash2 size={13} />, variant: 'danger', onClick: () => setBatchDeleteOpen(true) },
                ] : [
                  { label: t('prod.changeStatus'), onClick: () => setBatchStatusOpen(true) },
                  { label: t('common.delete'), icon: <Trash2 size={13} />, variant: 'danger', onClick: () => setBatchDeleteOpen(true) },
                ]}
              />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className={`border-b ${themeConfig.border} ${themeConfig.tableHead}`}>
                    <th className="p-3 w-10">
                      <BatchSelectAllCheckbox
                        checked={jobsList.length > 0 && jobsList.every(j => selectedJobIds.includes(j.jobNumber))}
                        indeterminate={selectedJobIds.length > 0 && !jobsList.every(j => selectedJobIds.includes(j.jobNumber))}
                        onChange={() => {
                          const allIds = jobsList.map(j => j.jobNumber);
                          if (jobsList.every(j => selectedJobIds.includes(j.jobNumber))) {
                            setSelectedJobIds(prev => prev.filter(id => !allIds.includes(id)));
                          } else {
                            setSelectedJobIds(prev => [...new Set([...prev, ...allIds])]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.job')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.product')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.customer')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.machine')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.operator')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap text-center">{t('col.status')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap text-right">{t('col.meterRun')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap text-right">{t('col.date')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {jobsList.map(job => (
                    <tr key={job.jobNumber} className={`border-b ${themeConfig.border} ${themeConfig.tableRow} transition`}>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <BatchRowCheckbox
                          checked={selectedJobIds.includes(job.jobNumber)}
                          onChange={() => {
                            setSelectedJobIds(prev =>
                              prev.includes(job.jobNumber) ? prev.filter(id => id !== job.jobNumber) : [...prev, job.jobNumber]
                            );
                          }}
                        />
                      </td>
                      <td className={`p-3 font-semibold font-mono ${themeConfig.primaryText}`}>{job.jobNumber}</td>
                      <td className={`p-3 font-semibold ${themeConfig.textPrimary}`}>{job.productCode}</td>
                      <td className={`p-3 text-xs ${themeConfig.textSecondary}`}>—</td>
                      <td className={`p-3 ${themeConfig.textSecondary}`}>{job.machineName}</td>
                      <td className={`p-3 ${themeConfig.textSecondary}`}>—</td>
                      <td className="p-3 text-center">
                        <StatusBadge status={job.status as StatusKind} />
                      </td>
                      <td className={`p-3 text-right font-mono ${themeConfig.textPrimary}`}>
                        {job.totalPrinted > 0 ? `${job.totalPrinted.toLocaleString()} ${t('unit.meter')}` : '—'}
                      </td>
                      <td className={`p-3 text-right text-xs ${themeConfig.textMuted}`}>{job.plannedDate ? (typeof job.plannedDate === 'string' ? job.plannedDate : new Date(job.plannedDate).toLocaleDateString()) : '—'}</td>
                      <td className="p-3 text-right">
                        {showTrash ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleRestoreJob(job.jobNumber)}
                              className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                              title={t('common.restore') || 'Restore'}
                            >
                              <RotateCcw className="h-4 w-4 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => setConfirmPermanentDeleteJob(job.jobNumber)}
                              className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                              title={t('common.deletePermanent') || 'Delete Permanently'}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteJob(job.jobNumber)}
                            className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                            title={t('common.delete') || 'Delete'}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
            )}
          </div>
        )}

        {/* 3. Traceability Sub Page */}
        {activeTab === 'traceability' && (
          <div className="grid gap-6">
            <div className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <h3 className={`text-base font-bold ${themeConfig.textPrimary} mb-2`}>{t('prod.traceTitle')}</h3>
              <p className={`text-xs ${themeConfig.textMuted} mb-5`}>{t('prod.traceSubtitle')}</p>

              {/* Selector Buttons */}
              <div className="flex flex-wrap gap-2 mb-5">
                {traceDimensions.map(d => {
                  const Icon = d.icon;
                  const active = dimension === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDimension(d.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                        active 
                          ? `${themeConfig.primaryBg} text-white border-transparent shadow` 
                          : `${themeConfig.border} ${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`
                      }`}
                    >
                      <Icon size={14} />
                      {d.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="flex gap-3 flex-col sm:flex-row">
                <div className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-2 border transition ${themeConfig.input}`}>
                  <Search size={16} className={themeConfig.textMuted} />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={`${t('btn.search')} ${traceDimensions.find(d => d.id === dimension)?.label}...`}
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-400"
                    onKeyDown={e => e.key === 'Enter' && handleTraceSearch()}
                  />
                </div>
                <button
                  onClick={handleTraceSearch}
                  className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow transition ${themeConfig.primaryButton}`}
                >
                  {t('btn.search')}
                </button>
              </div>
            </div>

            {/* Trace Results */}
            {traceResults && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {/* Product Info */}
                <article className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
                  <h3 className={`text-sm font-bold border-b pb-3 mb-4 ${themeConfig.textPrimary} ${themeConfig.border}`}>
                    {t('prod.productInfo')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className={themeConfig.textMuted}>{t('col.productCode')}</span>
                      <span className={`font-mono font-bold ${themeConfig.primaryText}`}>{traceResults.product}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={themeConfig.textMuted}>{t('col.customer')}</span>
                      <span className={`font-semibold ${themeConfig.textPrimary}`}>{traceResults.customer}</span>
                    </div>
                  </div>
                </article>

                {/* Job History */}
                <article className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
                  <h3 className={`text-sm font-bold border-b pb-3 mb-4 ${themeConfig.textPrimary} ${themeConfig.border}`}>
                    {t('prod.jobHistory')}
                  </h3>
                  <div className="space-y-2.5">
                    {traceResults.jobs.map(j => (
                      <div key={j.job} className={`flex items-center justify-between p-3 rounded-lg border ${themeConfig.border} ${themeConfig.badge}`}>
                        <div>
                          <span className={`text-xs font-bold font-mono ${themeConfig.primaryText}`}>{j.job}</span>
                          <p className={`text-[10px] ${themeConfig.textMuted} mt-1`}>
                            {j.date} · {j.machine} · {j.operator}
                          </p>
                        </div>
                        <span className={`text-xs font-mono font-bold ${themeConfig.textPrimary}`}>
                          {j.meter.toLocaleString()} {t('unit.meter')}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Cylinders Used */}
                <article className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
                  <h3 className={`text-sm font-bold border-b pb-3 mb-4 ${themeConfig.textPrimary} ${themeConfig.border}`}>
                    {t('prod.cylindersUsed')}
                  </h3>
                  <div className="space-y-2.5">
                    {traceResults.cylinders.map(c => (
                      <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border ${themeConfig.border} ${themeConfig.badge}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold font-mono ${themeConfig.primaryText}`}>{c.id}</span>
                          <ColorBadge name={c.color} />
                        </div>
                        <span className={`text-xs font-mono ${themeConfig.textMuted}`}>
                          {c.meter.toLocaleString()} {t('unit.meter')}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Ink Batches Used */}
                <article className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
                  <h3 className={`text-sm font-bold border-b pb-3 mb-4 ${themeConfig.textPrimary} ${themeConfig.border}`}>
                    {t('prod.inkBatchesUsed')}
                  </h3>
                  <div className="space-y-2.5">
                    {traceResults.inks.map(ink => (
                      <div key={ink.id} className={`flex items-center justify-between p-3 rounded-lg border ${themeConfig.border} ${themeConfig.badge}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold font-mono ${themeConfig.primaryText}`}>{ink.id}</span>
                          <ColorBadge name={ink.color} />
                        </div>
                        <span className={`text-xs font-mono font-bold ${themeConfig.textSecondary}`}>
                          {ink.formula}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            )}
          </div>
        )}
      {confirmDeleteJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setConfirmDeleteJob(null)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.delete') || 'Delete'}</h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              {t('prod.deleteJobConfirm') || `Are you sure you want to delete job "${confirmDeleteJob}"?`}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteJob(null)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button
                onClick={handleDeleteJob}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
              >
                {t('common.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmPermanentDeleteJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setConfirmPermanentDeleteJob(null)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.deletePermanent') || 'Delete Permanently'}</h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              Are you sure you want to permanently delete job "{confirmPermanentDeleteJob}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmPermanentDeleteJob(null)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button
                onClick={handlePermanentDeleteJob}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
              >
                {t('common.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {emptyTrashConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setEmptyTrashConfirmOpen(false)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.emptyTrash') || 'Empty Trash'}</h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              Are you sure you want to empty the jobs trash bin? All deleted jobs will be permanently purged.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEmptyTrashConfirmOpen(false)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
              >
                {t('common.delete') || 'Empty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Status Dialog */}
      <AppDialog
        open={batchStatusOpen}
        titleKey="prod.changeStatus"
        onClose={() => setBatchStatusOpen(false)}
      >
        <div className="grid gap-2">
          <p className={`text-sm ${themeConfig.textSecondary} mb-1`}>
            {t('prod.batchStatusDesc', { count: selectedJobIds.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            {['pending', 'verifying', 'active', 'completed', 'hold', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => handleBatchStatusChange(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${themeConfig.badge} ${themeConfig.textSecondary} ${themeConfig.panelHover} hover:text-white`}
              >
                <StatusBadge status={s as StatusKind} />
              </button>
            ))}
          </div>
        </div>
      </AppDialog>

      {/* Batch Delete Dialog */}
      {batchDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setBatchDeleteOpen(false)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>
              {showTrash ? t('common.permanentDelete') : t('common.delete')}
            </h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              {t('prod.batchDeleteConfirm', { count: selectedJobIds.length })}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setBatchDeleteOpen(false)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button onClick={handleBatchDelete} className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500">
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Restore Dialog */}
      {batchRestoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setBatchRestoreOpen(false)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.restore')}</h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              {t('prod.batchRestoreConfirm', { count: selectedJobIds.length })}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setBatchRestoreOpen(false)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button onClick={handleBatchRestore} className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-emerald-600 hover:bg-emerald-500">
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}

export default function ProductionPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-gray-400">Loading...</div>}>
      <ProductionPageContent />
    </Suspense>
  );
}
