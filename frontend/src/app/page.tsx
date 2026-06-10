'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { useTheme } from '@/lib/theme/theme-provider';
import { StatusBadge, type StatusKind } from '@/components/shared/status-badge';
import { 
  Layers, 
  Droplet, 
  Factory, 
  Eye, 
  Settings, 
  QrCode, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Shield, 
  Search,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { listCylinders } from '@/lib/services/cylinder';
import { listFormulas, listBatches } from '@/lib/services/ink';
import { listJobs } from '@/lib/services/job';

// Sparkline Component
function Sparkline({ data, color = '#22d3ee', width = 80, height = 30 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(' ');
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts}></polyline>
    </svg>
  );
}

// Donut Chart Component
function DonutChart({ 
  segments, 
  size = 90, 
  strokeWidth = 10, 
  centerText, 
  centerSub,
  textClass
}: { 
  segments: Array<{ value: number; color: string; label: string }>; 
  size?: number; 
  strokeWidth?: number; 
  centerText?: string; 
  centerSub?: string;
  textClass?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor"
          className="text-white/10" strokeWidth={strokeWidth}></circle>
        {segments.map((seg, i) => {
          const dash = total > 0 ? (seg.value / total) * circ : 0;
          const el = (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"></circle>
          );
          offset += dash;
          return el;
        })}
      </svg>
      {centerText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${textClass || 'text-white'}`}>{centerText}</span>
          {centerSub && <span className="text-[10px] text-gray-400">{centerSub}</span>}
        </div>
      )}
    </div>
  );
}

// Stat Card Definitions
const CARD_DEFS: Record<string, { titleKey: string; span: number }> = {
  stats:              { titleKey: 'dash.title',              span: 3 },
  cylinderStatus:     { titleKey: 'dash.cylinderStatus',     span: 2 },
  inkAlerts:          { titleKey: 'dash.inkAlerts',          span: 1 },
  recentJobs:         { titleKey: 'dash.recentJobs',         span: 2 },
  qcQuick:            { titleKey: 'dash.qcRate',             span: 1 },
  recentActivity:     { titleKey: 'dash.recentActivity',     span: 1 },
  cylinderByLocation: { titleKey: 'dash.cylinderByLocation', span: 2 },
};

const DEFAULT_CARD_ORDER = [
  'stats',
  'cylinderStatus',
  'inkAlerts',
  'recentJobs',
  'qcQuick',
  'recentActivity',
  'cylinderByLocation',
];

// Default fallback data
const FALLBACK = {
  cylinderStats: { total: 0, available: 0, inProduction: 0, repair: 0, reserved: 0, inspection: 0 },
  inkBatches: [] as Array<{ id: string; formula: string; product: string; color: string; mixDate: string; expiry: string; weight: number; remaining: number; operator: string; status: string }>,
  activities: [] as Array<{ time: string; textKey: string; textFallback: Record<string, string>; type: string }>,
  locations: [
    { name: 'Rack A', count: 0 },
    { name: 'Rack B', count: 0 },
    { name: 'Rack C', count: 0 },
    { name: 'Rack D', count: 0 },
    { name: 'Machine Area', count: 0 },
    { name: 'QC / Repair', count: 0 },
  ],
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const { themeConfig, theme } = useTheme();

  // Dashboard customization state
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_ORDER);
  const [hiddenCards, setHiddenCards] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load from localStorage only on client to avoid Next.js hydration issues
  useEffect(() => {
    setIsClient(true);
    try {
      const storedOrder = localStorage.getItem('gm_cardOrder');
      if (storedOrder) {
        setCardOrder(JSON.parse(storedOrder));
      }
      const storedHidden = localStorage.getItem('gm_hiddenCards');
      if (storedHidden) {
        setHiddenCards(JSON.parse(storedHidden));
      }
    } catch (e) {
      console.error('Error loading layout settings:', e);
    }
  }, []);

  // API data state
  const [cylinders, setCylinders] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [inkBatches, setInkBatches] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  const fetchDashData = useCallback(async () => {
    try {
      setDashLoading(true);
      const [c, f, ib, j] = await Promise.all([
        listCylinders().catch(() => []),
        listFormulas().catch(() => []),
        listBatches().catch(() => []),
        listJobs().catch(() => []),
      ]);
      setCylinders(c);
      setFormulas(f);
      setInkBatches(ib);
      setJobs(j);
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashData(); }, [fetchDashData]);

  // Compute stats from real data
  const cylinderStats = {
    total: cylinders.length,
    available: cylinders.filter((c: any) => c.status === 'available').length,
    inProduction: cylinders.filter((c: any) => c.status === 'inProduction').length,
    repair: cylinders.filter((c: any) => c.status === 'repair').length,
    reserved: cylinders.filter((c: any) => c.status === 'reserved').length,
    inspection: cylinders.filter((c: any) => c.status === 'inspection').length,
  };
  const inkStats = {
    activeFormulas: formulas.length,
    totalBatches: inkBatches.length,
    nearExpiry: inkBatches.filter((b: any) => b.status === 'nearExpiry').length,
    expired: inkBatches.filter((b: any) => b.status === 'expired').length,
  };
  const prodStats = {
    activeJobs: jobs.filter((j: any) => j.status === 'active' || j.status === 'running').length,
    verifiedToday: 0,
    passRate: 96.5,
    totalToday: jobs.length,
  };

  const saveLayout = (order: string[], hidden: string[]) => {
    setCardOrder(order);
    setHiddenCards(hidden);
    try {
      localStorage.setItem('gm_cardOrder', JSON.stringify(order));
      localStorage.setItem('gm_hiddenCards', JSON.stringify(hidden));
    } catch (e) {
      console.error('Error saving layout settings:', e);
    }
  };

  const toggleCardVisibility = (cardId: string) => {
    const nextHidden = hiddenCards.includes(cardId)
      ? hiddenCards.filter((id) => id !== cardId)
      : [...hiddenCards, cardId];
    saveLayout(cardOrder, nextHidden);
  };

  const resetLayout = () => {
    saveLayout(DEFAULT_CARD_ORDER, []);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toCardId: string) => {
    e.preventDefault();
    const fromCardId = e.dataTransfer.getData('text/plain');
    if (fromCardId === toCardId) return;

    const nextOrder = [...cardOrder];
    const fromIdx = nextOrder.indexOf(fromCardId);
    const toIdx = nextOrder.indexOf(toCardId);

    if (fromIdx !== -1 && toIdx !== -1) {
      nextOrder.splice(fromIdx, 1);
      nextOrder.splice(toIdx, 0, fromCardId);
      saveLayout(nextOrder, hiddenCards);
    }
  };

  const tAct = (act: any) => {
    const lang = i18n.language as 'th' | 'en' | 'cn' | 'ja' | 'mm';
    return act.textFallback?.[lang] || act.textFallback?.en || t(act.textKey);
  };

  // Cylinder status distribution
  const cs = cylinderStats;
  const cylItems = [
    { key: 'available', value: cs.available, color: 'bg-emerald-500', label: t('dash.available') },
    { key: 'inProduction', value: cs.inProduction, color: 'bg-blue-500', label: t('dash.inProduction') },
    { key: 'reserved', value: cs.reserved, color: 'bg-amber-500', label: t('dash.reserved') },
    { key: 'inspection', value: cs.inspection, color: 'bg-violet-500', label: t('dash.inspection') },
    { key: 'repair', value: cs.repair, color: 'bg-rose-500', label: t('dash.repair') },
  ];
  const totalCyl = cylItems.reduce((sum, item) => sum + item.value, 0);

  // Ink alerts
  const inkAlerts = inkBatches.filter(b => b.status === 'nearExpiry' || b.status === 'expired');

  // QC Segments
  const qcSegments = [
    { value: 43, color: '#10b981', label: t('dash.qcPassed') },
    { value: 2, color: '#f59e0b', label: t('dash.qcHold') },
    { value: 0, color: '#ef4444', label: t('dash.rework') },
  ];
  const qcTotal = qcSegments.reduce((s, seg) => s + seg.value, 0);
  const qcPct = qcTotal > 0 ? ((qcSegments[0].value / qcTotal) * 100).toFixed(1) : '0';

  // Render components according to IDs
  const renderCardContent = (cardId: string) => {
    switch (cardId) {
      case 'stats':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cylinders Stat */}
            <article className={`rounded-xl p-5 relative overflow-hidden ${themeConfig.panel} ${themeConfig.shadow}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-3 shadow-lg text-white">
                    <Layers size={20} />
                  </div>
                  <p className={`text-sm ${themeConfig.textSecondary} mb-1`}>{t('dash.totalCylinders')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${themeConfig.textPrimary}`}>{cs.total}</span>
                    <span className={`text-sm ${themeConfig.textMuted}`}>{t('unit.lots')}</span>
                  </div>
                  <p className={`text-xs ${themeConfig.textSecondary} mt-2`}>
                    {cs.available} {t('dash.available')}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <ArrowUp size={14} />
                  +3.2%
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-12 opacity-25">
                <Sparkline data={[20, 25, 22, 30, 28, 35, 32, 38, 42, 40, 45]} color="#22d3ee" />
              </div>
            </article>

            {/* Inks Stat */}
            <article className={`rounded-xl p-5 relative overflow-hidden ${themeConfig.panel} ${themeConfig.shadow}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg text-white">
                    <Droplet size={20} />
                  </div>
                  <p className={`text-sm ${themeConfig.textSecondary} mb-1`}>{t('dash.activeFormulas')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${themeConfig.textPrimary}`}>{inkStats.activeFormulas}</span>
                    <span className={`text-sm ${themeConfig.textMuted}`}>{t('unit.formulas')}</span>
                  </div>
                  <p className={`text-xs ${themeConfig.textSecondary} mt-2`}>
                    {inkStats.nearExpiry} {t('dash.nearExpiry')}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <ArrowUp size={14} />
                  +1.8%
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-12 opacity-25">
                <Sparkline data={[15, 18, 20, 19, 22, 25, 24, 28, 26, 30]} color="#d946ef" />
              </div>
            </article>

            {/* Jobs Stat */}
            <article className={`rounded-xl p-5 relative overflow-hidden ${themeConfig.panel} ${themeConfig.shadow}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3 shadow-lg text-white">
                    <Factory size={20} />
                  </div>
                  <p className={`text-sm ${themeConfig.textSecondary} mb-1`}>{t('dash.activeJobs')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${themeConfig.textPrimary}`}>{prodStats.activeJobs}</span>
                    <span className={`text-sm ${themeConfig.textMuted}`}>{t('unit.jobs')}</span>
                  </div>
                  <p className={`text-xs ${themeConfig.textSecondary} mt-2`}>
                    {t('dash.passRate')}: {prodStats.passRate}%
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <ArrowUp size={14} />
                  {prodStats.passRate}%
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-12 opacity-25">
                <Sparkline data={[8, 10, 12, 9, 14, 11, 13, 15, 12, 16]} color="#10b981" />
              </div>
            </article>
          </div>
        );

      case 'cylinderStatus':
        return (
          <section className={`rounded-xl p-5 h-full flex flex-col justify-between ${themeConfig.panel} ${themeConfig.shadow}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{t('dash.cylinderStatus')}</h3>
                <p className={`text-xs ${themeConfig.textMuted}`}>{t('dash.cylinderStatusSub')}</p>
              </div>
              <Link href="/cylinders" className={`flex items-center gap-1 text-xs ${themeConfig.primaryText} font-semibold hover:opacity-85`}>
                <Eye size={14} />
                {t('btn.viewAll')}
              </Link>
            </div>
            
            {/* Interactive horizontal stacked bar */}
            <div className="w-full">
              <div className="flex h-5 rounded-full overflow-hidden gap-0.5 mb-5 bg-white/5 p-0.5">
                {cylItems.map(item => (
                  <div 
                    key={item.key} 
                    className={`${item.color} transition-all duration-700 hover:brightness-110 cursor-pointer`}
                    style={{ width: `${(item.value / totalCyl) * 100}%` }}
                    title={`${item.label}: ${item.value}`}
                  ></div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {cylItems.map(item => (
                  <div key={item.key} className={`rounded-lg p-3 ${themeConfig.badge}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                      <span className={`text-[11px] font-semibold truncate ${themeConfig.textSecondary}`}>{item.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold ${themeConfig.textPrimary}`}>{item.value}</span>
                      <span className={`text-[10px] ${themeConfig.textMuted}`}>{((item.value / totalCyl) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'inkAlerts':
        return (
          <section className={`rounded-xl p-5 h-full flex flex-col ${themeConfig.panel} ${themeConfig.shadow}`}>
            <div className="mb-4">
              <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{t('dash.inkAlerts')}</h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>{t('dash.inkAlertsSub')}</p>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] pr-1">
              {inkAlerts.map(batch => {
                const isExpired = batch.status === 'expired';
                return (
                  <article 
                    key={batch.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                      isExpired 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    }`}
                  >
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${themeConfig.textPrimary}`}>{batch.id}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/30 font-semibold">{batch.color}</span>
                        <span className={`text-xs ${themeConfig.textSecondary}`}>{batch.remaining} {t('unit.kg')}</span>
                      </div>
                      <p className="text-[11px] mt-1.5 font-medium opacity-85">
                        {t(isExpired ? 'misc.expired' : 'misc.expires')}: {batch.expiryDate}
                      </p>
                    </div>
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                      isExpired ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300' : 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                    }`}>
                      {t(isExpired ? 'ink.expired' : 'ink.nearExpiry')}
                    </span>
                  </article>
                );
              })}
              {inkAlerts.length === 0 && (
                <div className={`text-center py-8 ${themeConfig.textMuted} text-sm`}>{t('dash.noAlerts')}</div>
              )}
            </div>
          </section>
        );

      case 'recentJobs':
        return (
          <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>{t('dash.recentJobs')}</h3>
              <Link href="/production" className={`flex items-center gap-1 text-xs ${themeConfig.primaryText} font-semibold hover:opacity-85`}>
                <Eye size={14} />
                {t('btn.viewAll')}
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className={`border-b ${themeConfig.border} ${themeConfig.tableHead}`}>
                    <th className="p-3 text-xs font-bold uppercase">{t('col.job')}</th>
                    <th className="p-3 text-xs font-bold uppercase">{t('col.product')}</th>
                    <th className="p-3 text-xs font-bold uppercase">{t('col.machine')}</th>
                    <th className="p-3 text-xs font-bold uppercase">{t('col.operator')}</th>
                    <th className="p-3 text-xs font-bold uppercase text-center">{t('col.status')}</th>
                    <th className="p-3 text-xs font-bold uppercase text-right">{t('col.meterRun')}</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.jobNumber} className={`border-b ${themeConfig.border} ${themeConfig.tableRow} transition`}>
                      <td className={`p-3 font-semibold ${themeConfig.primaryText}`}>{j.jobNumber}</td>
                      <td className={`p-3 ${themeConfig.textPrimary}`}>{j.productCode}</td>
                      <td className={`p-3 ${themeConfig.textSecondary}`}>{j.machineName}</td>
                      <td className={`p-3 ${themeConfig.textSecondary}`}>—</td>
                      <td className="p-3 text-center">
                        <StatusBadge status={j.status as StatusKind} />
                      </td>
                      <td className={`p-3 text-right font-mono ${themeConfig.textPrimary}`}>
                        {j.totalPrinted > 0 ? `${j.totalPrinted.toLocaleString()} ${t('unit.meter')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'qcQuick':
        return (
          <div className="flex flex-col gap-4">
            <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <h3 className={`text-base font-bold mb-4 ${themeConfig.textPrimary}`}>{t('dash.qcRate')}</h3>
              <div className="flex items-center gap-5">
                <DonutChart 
                  segments={qcSegments} 
                  size={90} 
                  strokeWidth={10} 
                  centerText={`${qcPct}%`} 
                  textClass={themeConfig.primaryText}
                />
                <div className="flex-1 space-y-2.5">
                  {qcSegments.map(seg => (
                    <div key={seg.label} className="flex items-center gap-2 justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></span>
                        <span className={themeConfig.textSecondary}>{seg.label}</span>
                      </div>
                      <span className={`font-semibold ${themeConfig.textPrimary}`}>{seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
              <h3 className={`text-base font-bold mb-4 ${themeConfig.textPrimary}`}>{t('dash.quickActions')}</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cylinders?scan=true"
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all border ${themeConfig.border} ${themeConfig.badge} hover:bg-white/5 hover:scale-[1.02]`}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow shadow-cyan-500/20">
                    <QrCode size={18} />
                  </div>
                  <span className={`text-[11px] font-bold ${themeConfig.textSecondary} text-center leading-tight`}>{t('btn.scan')}</span>
                </Link>

                <Link href="/production?tab=verification"
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all border ${themeConfig.border} ${themeConfig.badge} hover:bg-white/5 hover:scale-[1.02]`}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow shadow-emerald-500/20">
                    <Shield size={18} />
                  </div>
                  <span className={`text-[11px] font-bold ${themeConfig.textSecondary} text-center leading-tight`}>{t('btn.startVerify')}</span>
                </Link>

                <Link href="/inks?mix=true"
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all border ${themeConfig.border} ${themeConfig.badge} hover:bg-white/5 hover:scale-[1.02]`}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow shadow-purple-500/20">
                    <Droplet size={18} />
                  </div>
                  <span className={`text-[11px] font-bold ${themeConfig.textSecondary} text-center leading-tight`}>{t('btn.mixInk')}</span>
                </Link>

                <Link href="/production?tab=traceability"
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all border ${themeConfig.border} ${themeConfig.badge} hover:bg-white/5 hover:scale-[1.02]`}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow shadow-amber-500/20">
                    <Search size={18} />
                  </div>
                  <span className={`text-[11px] font-bold ${themeConfig.textSecondary} text-center leading-tight`}>{t('nav.traceability')}</span>
                </Link>
              </div>
            </section>
          </div>
        );

      case 'recentActivity':
        return (
          <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
            <h3 className={`text-base font-bold mb-4 ${themeConfig.textPrimary}`}>{t('dash.recentActivity')}</h3>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {FALLBACK.activities.map((act, i) => {
                const typeStyles = {
                  scan: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20',
                  alert: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
                  ink: 'text-purple-400 bg-purple-500/10 border border-purple-500/20',
                  complete: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
                  repair: 'text-rose-400 bg-rose-500/10 border border-rose-500/20',
                };
                const style = typeStyles[act.type as keyof typeof typeStyles] || typeStyles.scan;
                return (
                  <article key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${style}`}>
                      {act.type === 'scan' && <QrCode size={15} />}
                      {act.type === 'alert' && <AlertTriangle size={15} />}
                      {act.type === 'ink' && <Droplet size={15} />}
                      {act.type === 'complete' && <Check size={15} />}
                      {act.type === 'repair' && <Settings size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${themeConfig.textPrimary}`}>{tAct(act)}</p>
                      <p className={`text-[11px] ${themeConfig.textMuted} mt-1 flex items-center gap-1`}>
                        <Clock size={11} />
                        {act.time}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );

      case 'cylinderByLocation':
        return (
          <section className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
            <h3 className={`text-base font-bold mb-4 ${themeConfig.textPrimary}`}>{t('dash.cylinderByLocation')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FALLBACK.locations.map(loc => (
                <div key={loc.name} className={`rounded-lg p-4 transition border border-transparent hover:border-white/10 ${themeConfig.badge} hover:bg-white/5 cursor-pointer`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className={themeConfig.primaryText} />
                    <span className={`text-xs font-semibold ${themeConfig.textSecondary}`}>{loc.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${themeConfig.textPrimary}`}>{loc.count}</span>
                    <span className={`text-xs ${themeConfig.textMuted}`}>{t('unit.pcs')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="relative">
        {/* Layout Editing Floating Grid Background */}
        {layoutEditing && (
          <div 
            className="absolute inset-0 pointer-events-none z-0 rounded-2xl opacity-40 transition-opacity"
            style={{
              backgroundImage: theme === 'light' 
                ? 'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)'
                : 'linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          ></div>
        )}

        <div className="relative z-10 grid gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${themeConfig.primaryText}`}>
                OVERVIEW · {t('app.subtitle')}
              </p>
              <h1 className={`text-2xl font-black mt-1 ${themeConfig.textPrimary}`}>{t('dash.title')}</h1>
            </div>

            {isClient && (
              <div className="flex items-center gap-2 flex-wrap">
                {layoutEditing ? (
                  <>
                    <button 
                      onClick={resetLayout}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent bg-white/5 hover:bg-white/10 ${themeConfig.textPrimary}`}
                    >
                      <RotateCcw size={13} />
                      {t('layout.reset')}
                    </button>
                    <button 
                      onClick={() => setLayoutEditing(false)}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition text-white ${themeConfig.primaryButton}`}
                    >
                      <Check size={13} />
                      {t('layout.done')}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setLayoutEditing(true)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent bg-white/5 hover:bg-white/10 ${themeConfig.textPrimary}`}
                    >
                      <Settings size={13} />
                      {t('layout.customize')}
                    </button>
                    <Link 
                      href="/cylinders?scan=true"
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition text-white ${themeConfig.primaryButton}`}
                    >
                      <QrCode size={13} />
                      {t('btn.scan')}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Widgets Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isClient && cardOrder.map(cardId => {
              const def = CARD_DEFS[cardId];
              const isHidden = hiddenCards.includes(cardId);
              if (!def) return null;
              
              // If not editing and hidden, do not render
              if (!layoutEditing && isHidden) return null;

              const spanClass = def.span === 3 
                ? 'col-span-1 md:col-span-3'
                : def.span === 2 
                  ? 'col-span-1 md:col-span-2'
                  : 'col-span-1';

              return (
                <div 
                  key={cardId}
                  className={`${spanClass} relative transition-all duration-200 ${
                    layoutEditing ? 'group cursor-move' : ''
                  } ${layoutEditing && isHidden ? 'opacity-30' : ''}`}
                  onDragOver={layoutEditing ? handleDragOver : undefined}
                  onDrop={layoutEditing ? (e) => handleDrop(e, cardId) : undefined}
                  draggable={layoutEditing}
                  onDragStart={layoutEditing ? (e) => handleDragStart(e, cardId) : undefined}
                  onDragEnd={layoutEditing ? handleDragEnd : undefined}
                >
                  {/* Edit mode overlay outline & controls */}
                  {layoutEditing && (
                    <div className="absolute inset-0 z-20 rounded-xl border-2 border-dashed border-cyan-400/40 pointer-events-none">
                      <div className="absolute top-2 right-2 pointer-events-auto flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg backdrop-blur shadow-md">
                        {/* Drag indicator handle */}
                        <div 
                          className="p-1 rounded hover:bg-white/10 text-gray-400 cursor-grab active:cursor-grabbing"
                          title={t('layout.dragHint')}
                        >
                          <Settings size={13} />
                        </div>
                        {/* Visibility Toggle button */}
                        <button
                          onClick={() => toggleCardVisibility(cardId)}
                          className={`p-1 rounded hover:bg-white/10 ${isHidden ? 'text-rose-400' : 'text-gray-400'}`}
                          title={isHidden ? t('btn.add') : t('common.close')}
                        >
                          <Eye size={13} className={isHidden ? 'opacity-50' : ''} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render content */}
                  {renderCardContent(cardId)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
