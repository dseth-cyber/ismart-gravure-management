'use client';

import { useState, Fragment, useEffect, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { useTheme } from '@/lib/theme/theme-provider';
import { StatusBadge, type StatusKind } from '@/components/shared/status-badge';
import { ColorBadge } from '@/components/shared/color-badge';
import { listJobs } from '@/lib/services/job';
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
  Search, 
  User, 
  Settings, 
  Camera, 
  X,
  List,
  Factory,
  RefreshCw
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
  const [verifying, setVerifying] = useState(false);
  const [scanResults, setScanResults] = useState<{
    job: { id: string; product: string; customer: string } | null;
    cylinders: Array<{ id: string; color: string; match: boolean }>;
    inks: Array<{ id: string; color: string; formula: string; match: boolean; expiryOk: boolean }>;
  }>({
    job: null,
    cylinders: [],
    inks: [],
  });

  const scanJob = () => {
    setVerifying(true);
    setTimeout(() => {
      setScanResults(prev => ({
        ...prev,
        job: { id: 'J2024-045', product: 'AGH-001', customer: 'เอ็กซ์เซล ฟู้ดส์' }
      }));
      setVerifying(false);
      setStep(2);
    }, 1200);
  };

  const scanCylinder = () => {
    setVerifying(true);
    setTimeout(() => {
      setScanResults(prev => ({
        ...prev,
        cylinders: [
          { id: 'CYL-BK-001', color: 'Black', match: true },
          { id: 'CYL-CY-001', color: 'Cyan', match: true },
          { id: 'CYL-MG-001', color: 'Magenta', match: true }
        ]
      }));
      setVerifying(false);
      setStep(3);
    }, 1500);
  };

  const scanInk = () => {
    setVerifying(true);
    setTimeout(() => {
      setScanResults(prev => ({
        ...prev,
        inks: [
          { id: 'MIX-2024-089', color: 'Black', formula: 'INK-BK-R03', match: true, expiryOk: true },
          { id: 'MIX-2024-090', color: 'Cyan', formula: 'INK-CY-R02', match: true, expiryOk: true },
          { id: 'MIX-2024-085', color: 'Magenta', formula: 'INK-MG-R01', match: true, expiryOk: false }
        ]
      }));
      setVerifying(false);
      setStep(4);
    }, 1500);
  };

  const resetVerification = () => {
    setStep(0);
    setScanResults({ job: null, cylinders: [], inks: [] });
  };

  const allPass = step === 4 && scanResults.inks.every(i => i.match && i.expiryOk);
  const hasFail = step === 4 && scanResults.inks.some(i => !i.match || !i.expiryOk);

  const verificationSteps = [
    { num: 1, label: t('prod.scanJob'), icon: QrCode },
    { num: 2, label: t('prod.scanCylinders'), icon: Layers },
    { num: 3, label: t('prod.scanInk'), icon: Droplet },
    { num: 4, label: t('prod.result'), icon: Shield },
  ];

  // Production Log State
  const [jobs, setJobs] = useState<ProductionJobDto[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodError, setProdError] = useState('');

  const fetchJobs = useCallback(async () => {
    try {
      setProdLoading(true);
      setProdError('');
      const data = await listJobs();
      setJobs(data);
    } catch (err: any) {
      setProdError(err?.message || 'Failed to load jobs');
    } finally {
      setProdLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

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
    { id: 'product', label: 'Product Code', icon: List },
    { id: 'job', label: 'Job Number', icon: Factory },
    { id: 'cylinder', label: 'Cylinder Code', icon: Layers },
    { id: 'inkBatch', label: 'Ink Batch', icon: Droplet },
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

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader 
          titleKey="prod.title" 
          subtitleKey="prod.subtitle" 
          actions={
            <div className="flex gap-2">
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
                <div className="text-center py-6">
                  <div className={`w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center mx-auto mb-5 relative overflow-hidden ${
                    verifying ? 'border-cyan-400/50' : themeConfig.border
                  }`}>
                    {verifying ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent animate-pulse"></div>
                        <QrCode size={40} className="text-cyan-400/50 animate-bounce" />
                      </>
                    ) : (
                      <Camera size={40} className={themeConfig.textMuted} />
                    )}
                  </div>
                  <h4 className={`text-sm font-bold ${themeConfig.textPrimary} mb-1`}>{t('prod.scanJob')}</h4>
                  <p className={`text-xs ${themeConfig.textMuted} mb-6`}>{t('prod.scanJobSub')}</p>
                  <button 
                    onClick={scanJob} 
                    disabled={verifying}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow transition-all ${themeConfig.primaryButton} disabled:opacity-50`}
                  >
                    {verifying ? t('prod.scanning') : t('prod.scan')}
                  </button>
                </div>
              )}

              {/* Step 2: Scan Cylinders */}
              {step === 2 && scanResults.job && (
                <div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6 flex items-center gap-3">
                    <Check size={18} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-emerald-400">Job: {scanResults.job.id}</span>
                      <span className={`text-xs ${themeConfig.textSecondary} ml-2`}>· {scanResults.job.product}</span>
                    </div>
                  </div>

                  <div className="text-center py-6 border-t border-white/5">
                    <div className={`w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center mx-auto mb-5 relative overflow-hidden ${
                      verifying ? 'border-cyan-400/50' : themeConfig.border
                    }`}>
                      {verifying ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent animate-pulse"></div>
                          <Layers size={40} className="text-cyan-400/50 animate-bounce" />
                        </>
                      ) : (
                        <Camera size={40} className={themeConfig.textMuted} />
                      )}
                    </div>
                    <h4 className={`text-sm font-bold ${themeConfig.textPrimary} mb-1`}>{t('prod.scanCylinders')}</h4>
                    <p className={`text-xs ${themeConfig.textMuted} mb-6`}>{t('prod.scanCylindersSub')}</p>
                    <button 
                      onClick={scanCylinder} 
                      disabled={verifying}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow transition-all ${themeConfig.primaryButton} disabled:opacity-50`}
                    >
                      {verifying ? t('prod.scanning') : t('prod.scan')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Scan Inks */}
              {step === 3 && scanResults.job && (
                <div>
                  <div className="space-y-2.5 mb-6">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                      <Check size={18} className="text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-emerald-400">Job: {scanResults.job.id}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Check size={18} className="text-emerald-400 flex-shrink-0" />
                        <span className="text-sm font-bold text-emerald-400">{t('prod.scanCylinders')} ({scanResults.cylinders.length}) ✓</span>
                      </div>
                      <div className="flex gap-2 ml-7">
                        {scanResults.cylinders.map(c => (
                          <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                            {c.color}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-6 border-t border-white/5">
                    <div className={`w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center mx-auto mb-5 relative overflow-hidden ${
                      verifying ? 'border-cyan-400/50' : themeConfig.border
                    }`}>
                      {verifying ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent animate-pulse"></div>
                          <Droplet size={40} className="text-cyan-400/50 animate-bounce" />
                        </>
                      ) : (
                        <Camera size={40} className={themeConfig.textMuted} />
                      )}
                    </div>
                    <h4 className={`text-sm font-bold ${themeConfig.textPrimary} mb-1`}>{t('prod.scanInk')}</h4>
                    <p className={`text-xs ${themeConfig.textMuted} mb-6`}>{t('prod.scanInkSub')}</p>
                    <button 
                      onClick={scanInk} 
                      disabled={verifying}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow transition-all ${themeConfig.primaryButton} disabled:opacity-50`}
                    >
                      {verifying ? t('prod.scanning') : t('prod.scan')}
                    </button>
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
              <button 
                onClick={() => alert('Exporting log data...')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent ${themeConfig.secondaryButton}`}
              >
                <Download size={14} />
                {t('btn.export')}
              </button>
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
                <button onClick={fetchJobs} className={`px-4 py-2 rounded-lg text-sm font-medium ${themeConfig.primaryButton}`}>
                  {t('btn.retry')}
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-16 ${themeConfig.textSecondary}`}>
                <p className="text-sm">{t('common.noData')}</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className={`border-b ${themeConfig.border} ${themeConfig.tableHead}`}>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.job')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.product')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.customer')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.machine')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap">{t('col.operator')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap text-center">{t('col.status')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap text-right">{t('col.meterRun')}</th>
                    <th className="p-3 text-xs font-bold uppercase whitespace-nowrap text-right">{t('col.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.jobNumber} className={`border-b ${themeConfig.border} ${themeConfig.tableRow} transition`}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                      <span className={themeConfig.textMuted}>Product Code</span>
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
