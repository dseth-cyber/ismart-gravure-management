'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, Plus, Download, Search, RefreshCw, MapPin, Eye, LayoutGrid, List, Check, AlertTriangle, Clock, Hammer, ShieldAlert, X, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/app-layout';
import { useTheme } from '@/lib/theme/theme-provider';
import { listCylinders, createCylinder, updateCylinder } from '@/lib/services/cylinder';

const QrLabel = dynamic(() => import('@/components/shared/qr-label').then(m => ({ default: m.QrLabel })), { ssr: false });
import type { CylinderDto } from '@shared/dto/cylinder/cylinder.dto';

interface CylinderDisplay extends CylinderDto {
  product?: string;
  customer?: string;
}

const mockHistory = [
  { cyl: 'CYL-BK-001', product: 'AGH-001', job: 'J2024-045', date: '2024-06-20', machine: 'M-03', operator: 'สมชาย', meter: 15000, remark: '' },
  { cyl: 'CYL-CY-001', product: 'AGH-001', job: 'J2024-045', date: '2024-06-20', machine: 'M-03', operator: 'สมชาย', meter: 15200, remark: '' },
  { cyl: 'CYL-BK-001', product: 'AGH-001', job: 'J2024-040', date: '2024-06-15', machine: 'M-03', operator: 'วิชัย', meter: 12500, remark: 'รอยขีดเล็กน้อย' },
  { cyl: 'CYL-MG-001', product: 'AGH-001', job: 'J2024-044', date: '2024-06-19', machine: 'M-01', operator: 'วิชัย', meter: 22000, remark: '' },
  { cyl: 'CYL-BK-005', product: 'BKK-002', job: 'J2024-038', date: '2024-06-12', machine: 'M-02', operator: 'สมชาย', meter: 18200, remark: 'Chrome สึกหรอ → ส่งซ่อม' },
  { cyl: 'CYL-WH-001', product: 'AGH-001', job: 'J2024-041', date: '2024-06-18', machine: 'M-03', operator: 'ประยุทธ์', meter: 30100, remark: '' },
  { cyl: 'CYL-FL-010', product: 'BKK-003', job: 'J2024-035', date: '2024-06-05', machine: 'M-04', operator: 'สมหมาย', meter: 8500, remark: '' },
];

const mockLocations = [
  { name: 'Rack A', count: 42 },
  { name: 'Rack B', count: 38 },
  { name: 'Rack C', count: 28 },
  { name: 'Rack D', count: 22 },
  { name: 'Machine Area', count: 48 },
  { name: 'QC / Repair', count: 18 },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  available:    { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  inProduction: { bg: 'bg-blue-500/20',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  reserved:     { bg: 'bg-amber-500/20',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  repair:       { bg: 'bg-rose-500/20',    text: 'text-rose-400',    dot: 'bg-rose-400' },
  inspection:   { bg: 'bg-violet-500/20',  text: 'text-violet-400',  dot: 'bg-violet-400' },
  hold:         { bg: 'bg-orange-500/20',  text: 'text-orange-400',  dot: 'bg-orange-400' },
};

const COLOR_MAP: Record<string, string> = {
  BK: '#1a1a1a', CY: '#00bcd4', MG: '#e91e63', YL: '#ffc107', WH: '#f5f5f5', VN: '#9c27b0', FL: '#ff5722',
  Black: '#1a1a1a', Cyan: '#00bcd4', Magenta: '#e91e63', Yellow: '#ffc107', White: '#f5f5f5', Varnish: '#9c27b0',
};

function CylindersPageContent() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') || 'list';

  // Navigation states
  const [activeTab, setActiveTab] = useState<'list' | 'status' | 'location' | 'history'>('list');

  useEffect(() => {
    if (['list', 'status', 'location', 'history'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'list' | 'status' | 'location' | 'history') => {
    setActiveTab(tab);
    router.replace(`/cylinders?tab=${tab}`);
  };

  const [cylinders, setCylinders] = useState<CylinderDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [view, setView] = useState<'table' | 'card'>('table');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Dialog overlays
  const [selectedCyl, setSelectedCyl] = useState<CylinderDisplay | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [printTarget, setPrintTarget] = useState<{ type: 'cylinder'; data: CylinderDisplay } | null>(null);

  // Add Form state
  const [form, setForm] = useState({ id: '', product: '', customer: '', color: 'BK', type: 'Dedicated', size: '', location: '' });

  const fetchCylinders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listCylinders();
      setCylinders(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load cylinders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCylinders(); }, [fetchCylinders]);

  useEffect(() => {
    const handler = (e: Event) => setPrintTarget((e as CustomEvent).detail as any);
    document.addEventListener('print-label', handler);
    return () => document.removeEventListener('print-label', handler);
  }, []);

  // Filter logic
  const filtered = cylinders.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    const q = search.toLowerCase();
    if (q && !c.id.toLowerCase().includes(q) &&
        !(c.product || c.productCode || '').toLowerCase().includes(q) &&
        !(c.customer || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const statusCounts: Record<string, number> = {};
  cylinders.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

  const getStatusLabel = (status: string) => {
    return t(`status.${status}`) || status;
  };

  const handleSaveCylinder = async () => {
    const colorNameMap: Record<string, string> = { BK: 'Black', CY: 'Cyan', MG: 'Magenta', YL: 'Yellow', WH: 'White', VN: 'Varnish', FL: 'Flavor' };
    try {
      const newCyl = await createCylinder({
        id: form.id || `CYL-${form.color}-${Math.floor(100 + Math.random() * 900)}`,
        productCode: form.product || 'UNKNOWN-001',
        color: form.color,
        colorName: colorNameMap[form.color] || form.color,
        location: form.location || 'Rack A-01',
        type: form.type,
        size: form.size || '800×250',
      });
      setCylinders(prev => [newCyl, ...prev]);
      setShowAdd(false);
      setForm({ id: '', product: '', customer: '', color: 'BK', type: 'Dedicated', size: '', location: '' });
    } catch (err: any) {
      console.error('Failed to create cylinder:', err);
    }
  };

  const handleStatusChange = async (cyl: CylinderDisplay, newStatus: string) => {
    try {
      await updateCylinder(cyl.id, { status: newStatus as any });
      setCylinders(prev => prev.map(x => x.id === cyl.id ? { ...x, status: newStatus as any } : x));
      setSelectedCyl(prev => prev ? { ...prev, status: newStatus as any } : null);
    } catch (err: any) {
      console.error('Failed to update cylinder status:', err);
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-[11px] font-medium uppercase tracking-wider ${themeConfig.textMuted} mb-0.5`}>CYLINDER MANAGEMENT</p>
            <h1 className={`text-xl sm:text-2xl font-bold ${themeConfig.textPrimary}`}>{t('cyl.title')}</h1>
            <p className={`text-sm ${themeConfig.textSecondary} mt-0.5`}>{t('cyl.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowScan(true)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium text-white transition-all ${themeConfig.primaryButton} shadow`}>
              <Camera size={15} />
              {t('btn.scan')}
            </button>
            <button onClick={() => setShowAdd(true)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all ${themeConfig.secondaryButton} shadow`}>
              <Plus size={15} />
              {t('btn.add')}
            </button>
            <button className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all ${themeConfig.secondaryButton} shadow`}>
              <Download size={15} />
              {t('btn.export')}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex border-b ${themeConfig.border} gap-2`}>
          {[
            { id: 'list', label: t('nav.cylinderList') },
            { id: 'status', label: t('nav.cylinderStatus') },
            { id: 'location', label: t('nav.cylinderLocation') },
            { id: 'history', label: t('nav.cylinderHistory') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content 1. List */}
        {activeTab === 'list' && (
          <div className="grid gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className={`flex-1 flex items-center gap-2 ${themeConfig.input} rounded-lg px-3 py-2`}>
                <Search size={16} className={themeConfig.textMuted} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('cyl.searchPlaceholder')}
                  className="flex-1 bg-transparent outline-none text-sm text-white"
                />
              </div>
              <div className={`flex gap-1 p-1 rounded-lg ${themeConfig.badge}`}>
                {[
                  { id: 'all', label: `${t('cyl.all')} (${cylinders.length})` },
                  { id: 'available', label: `${t('status.available')} (${statusCounts.available || 0})` },
                  { id: 'inProduction', label: `${t('status.inProduction')} (${statusCounts.inProduction || 0})` },
                  { id: 'repair', label: `${t('status.repair')} (${statusCounts.repair || 0})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filterStatus === tab.id
                        ? `${themeConfig.primaryBg} text-white shadow`
                        : `${themeConfig.textSecondary} hover:bg-white/5`
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className={`flex gap-1 p-1 rounded-lg ${themeConfig.badge}`}>
                {([['table', List], ['card', LayoutGrid]] as const).map(([v, Icon]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`p-1.5 rounded-md transition-all ${view === v ? `${themeConfig.primaryBg} text-white` : themeConfig.textMuted}`}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className={`flex items-center justify-center py-16 ${themeConfig.textSecondary}`}>
                <RefreshCw size={20} className="animate-spin mr-2" />
                {t('common.loading')}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-rose-400 gap-2">
                <AlertTriangle size={24} />
                <p className="text-sm">{error}</p>
                <button onClick={fetchCylinders} className={`px-4 py-2 rounded-lg text-sm font-medium ${themeConfig.primaryButton}`}>
                  {t('btn.retry')}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-16 ${themeConfig.textSecondary}`}>
                <p className="text-sm">{t('common.noData')}</p>
              </div>
            ) : null}

            {!loading && !error && view === 'table' && (
              <div className={`rounded-xl overflow-hidden ${themeConfig.panel}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${themeConfig.tableHead}`}>
                        {[t('col.code'), t('col.color'), t('col.product'), t('col.customer'), t('col.status'), t('col.location'), t('col.meterRun'), 'Type', t('col.action')].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => (
                        <tr key={c.id} onClick={() => setSelectedCyl(c)} className={`${themeConfig.tableRow} transition-colors border-t ${themeConfig.border} cursor-pointer`}>
                          <td className="px-4 py-3 font-medium text-cyan-300 font-mono text-xs">{c.id}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <span className="w-3.5 h-3.5 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[c.color] || '#888' }} />
                              <span>{c.colorName}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white">{c.product || c.productCode}</td>
                          <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{c.customer || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]?.bg || 'bg-gray-500/20'} ${STATUS_COLORS[c.status]?.text || 'text-gray-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[c.status]?.dot || 'bg-gray-400'}`} />
                              {getStatusLabel(c.status)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{c.location}</td>
                          <td className="px-4 py-3 text-white font-mono text-xs">{c.meter.toLocaleString()} {t('unit.meter')}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${themeConfig.badge} ${themeConfig.textSecondary}`}>{c.type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button className={`p-1 rounded ${themeConfig.panelHover} ${themeConfig.textSecondary}`}>
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); document.dispatchEvent(new CustomEvent('print-label', { detail: { type: 'cylinder', data: c } })); }}
                                className={`p-1 rounded ${themeConfig.panelHover} ${themeConfig.textSecondary}`}
                                title="Print Label"
                              >
                                <Printer size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && !error && view === 'card' && (
              /* Card Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(c => (
                  <div key={c.id} className={`rounded-xl p-5 ${themeConfig.panel} transition-transform duration-200 hover:scale-[1.01] cursor-pointer`} onClick={() => setSelectedCyl(c)}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-medium text-cyan-300">{c.id}</span>
                      <span className={`inline-flex items-center gap-1.2 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[c.status]?.bg || 'bg-gray-500/20'} ${STATUS_COLORS[c.status]?.text || 'text-gray-400'}`}>
                        <span className={`w-1 h-1 rounded-full mr-1 ${STATUS_COLORS[c.status]?.dot || 'bg-gray-400'}`} />
                        {getStatusLabel(c.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-white">
                        <span className="w-3 h-3 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[c.color] || '#888' }} />
                        <span>{c.colorName}</span>
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${themeConfig.badge} ${themeConfig.textSecondary}`}>{c.type}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-0.5">{c.product || c.productCode}</p>
                    <p className={`text-xs ${themeConfig.textSecondary} mb-3`}>{c.customer || '—'}</p>
                    <div className={`flex items-center justify-between pt-3 border-t ${themeConfig.border}`}>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className={themeConfig.textSecondary} />
                        <span className={`text-xs ${themeConfig.textSecondary}`}>{c.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); document.dispatchEvent(new CustomEvent('print-label', { detail: { type: 'cylinder', data: c } })); }}
                          className={`p-1 rounded ${themeConfig.panelHover} ${themeConfig.textSecondary} hover:text-cyan-400`}
                          title="Print Label"
                        >
                          <Printer size={13} />
                        </button>
                        <span className="text-xs font-mono text-white">{(c.meter/1000).toFixed(0)}K {t('unit.meter')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab content 2. Status */}
        {activeTab === 'status' && (
          <div className="grid gap-6">
            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { key: 'available', value: statusCounts.available || 0, color: 'bg-emerald-500', barColor: 'green', icon: Check },
                { key: 'inProduction', value: statusCounts.inProduction || 0, color: 'bg-blue-500', barColor: 'blue', icon: LayoutGrid },
                { key: 'reserved', value: statusCounts.reserved || 0, color: 'bg-amber-500', barColor: 'amber', icon: Clock },
                { key: 'inspection', value: statusCounts.inspection || 0, color: 'bg-violet-500', barColor: 'purple', icon: Eye },
                { key: 'repair', value: statusCounts.repair || 0, color: 'bg-rose-500', barColor: 'rose', icon: Hammer },
              ].map(item => {
                const Icon = item.icon;
                const total = cylinders.length;
                const percent = total > 0 ? (item.value / total) * 100 : 0;
                const colorMap: Record<string, string> = {
                  green: 'from-emerald-400 to-teal-500',
                  blue: 'from-blue-400 to-blue-600',
                  amber: 'from-amber-400 to-orange-500',
                  purple: 'from-purple-400 to-pink-500',
                  rose: 'from-rose-400 to-red-500',
                };
                return (
                  <div className={`rounded-xl p-4 ${themeConfig.panel}`} key={item.key}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center shadow-lg text-white`}>
                        <Icon size={18} />
                      </div>
                      <span className="text-2xl font-bold text-white">{item.value}</span>
                    </div>
                    <p className={`text-xs ${themeConfig.textSecondary} mb-2`}>{t(`status.${item.key}`)}</p>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${colorMap[item.barColor]} transition-all duration-700`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Stacked Bar Chart */}
            <div className={`rounded-xl p-5 ${themeConfig.panel}`}>
              <h3 className={`text-base font-semibold ${themeConfig.textPrimary} mb-1`}>{t('dash.cylinderStatus')}</h3>
              <p className={`text-xs ${themeConfig.textSecondary} mb-4`}>{t('dash.cylinderStatusSub')}</p>
              
              <div className="flex h-6 rounded-full overflow-hidden gap-0.5 mb-4 bg-white/10">
                {[
                  { key: 'available', value: statusCounts.available || 0, color: 'bg-emerald-500' },
                  { key: 'inProduction', value: statusCounts.inProduction || 0, color: 'bg-blue-500' },
                  { key: 'reserved', value: statusCounts.reserved || 0, color: 'bg-amber-500' },
                  { key: 'inspection', value: statusCounts.inspection || 0, color: 'bg-violet-500' },
                  { key: 'repair', value: statusCounts.repair || 0, color: 'bg-rose-500' },
                ].map(item => {
                  const total = cylinders.length;
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={item.key}
                      className={`${item.color} transition-all duration-700 relative group cursor-pointer`}
                      style={{ width: `${pct}%` }}
                      title={`${t(`status.${item.key}`)}: ${item.value}`}
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'available', value: statusCounts.available || 0, color: 'bg-emerald-500' },
                  { key: 'inProduction', value: statusCounts.inProduction || 0, color: 'bg-blue-500' },
                  { key: 'reserved', value: statusCounts.reserved || 0, color: 'bg-amber-500' },
                  { key: 'inspection', value: statusCounts.inspection || 0, color: 'bg-violet-500' },
                  { key: 'repair', value: statusCounts.repair || 0, color: 'bg-rose-500' },
                ].map(item => {
                  const total = cylinders.length;
                  const percent = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
                  return (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className={`text-xs ${themeConfig.textSecondary}`}>{t(`status.${item.key}`)}</span>
                      <span className="text-xs font-semibold text-white">{item.value}</span>
                      <span className={`text-[10px] ${themeConfig.textSecondary}`}>({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cylinder Tracker list */}
            <div className={`rounded-xl p-5 ${themeConfig.panel}`}>
              <h3 className={`text-base font-semibold ${themeConfig.textPrimary} mb-4`}>{t('cyl.title')}</h3>
              <div className="space-y-2">
                {cylinders.map(c => (
                  <div key={c.id} className={`flex items-center gap-4 p-3 rounded-lg ${themeConfig.badge} hover:bg-white/5 transition-all`}>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white w-28">
                      <span className="w-3.5 h-3.5 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[c.color] || '#888' }} />
                      <span>{c.colorName}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-mono font-semibold text-cyan-300">{c.id}</span>
                      <p className={`text-xs ${themeConfig.textSecondary}`}>{c.product || c.productCode} · {c.customer || '—'}</p>
                    </div>
                    <span className={`text-xs ${themeConfig.textSecondary} hidden sm:inline`}>{c.location}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]?.bg || 'bg-gray-500/20'} ${STATUS_COLORS[c.status]?.text || 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[c.status]?.dot || 'bg-gray-400'}`} />
                      {getStatusLabel(c.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab content 3. Location */}
        {activeTab === 'location' && (
          <div className="grid gap-6">
            {/* Location Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {mockLocations.map(loc => (
                <div key={loc.name} className={`rounded-xl p-4 text-center ${themeConfig.panel}`}>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-2 text-cyan-400`}>
                    <MapPin size={18} />
                  </div>
                  <span className="text-2xl font-bold text-white">{loc.count}</span>
                  <p className={`text-xs ${themeConfig.textSecondary} mt-1`}>{loc.name}</p>
                </div>
              ))}
            </div>

            {/* Cylinder per Location list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {['Rack A-03', 'Machine M-03', 'Rack A-04', 'Rack B-01', 'Repair Shop', 'QC Area'].map(loc => {
                const cylsInLoc = cylinders.filter(c => c.location.toLowerCase() === loc.toLowerCase() || (loc === 'Repair Shop' && c.status === 'repair') || (loc === 'QC Area' && c.status === 'inspection'));
                const normalizedLocName = loc === 'Repair Shop' ? 'QC / Repair' : loc === 'QC Area' ? 'QC Area' : loc;
                return (
                  <div key={loc} className={`rounded-xl p-5 ${themeConfig.panel}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-cyan-400" />
                        <h4 className="font-semibold text-white">{normalizedLocName}</h4>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${themeConfig.badge} ${themeConfig.textSecondary}`}>{cylsInLoc.length} {t('unit.lots')}</span>
                    </div>
                    <div className="space-y-2">
                      {cylsInLoc.map(c => (
                        <div key={c.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${themeConfig.badge}`}>
                          <span className="inline-flex items-center gap-1.5 text-xs text-white w-24">
                            <span className="w-3.5 h-3.5 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[c.color] || '#888' }} />
                            <span>{c.colorName}</span>
                          </span>
                          <div className="flex-1 min-w-0">
                          <span className="text-sm font-mono text-cyan-300">{c.id}</span>
                          <p className={`text-xs ${themeConfig.textSecondary}`}>{c.product || c.productCode}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[c.status]?.bg || 'bg-gray-500/20'} ${STATUS_COLORS[c.status]?.text || 'text-gray-400'}`}>
                            <span className={`w-1 h-1 rounded-full mr-1 ${STATUS_COLORS[c.status]?.dot || 'bg-gray-400'}`} />
                            {getStatusLabel(c.status)}
                          </span>
                        </div>
                      ))}
                      {cylsInLoc.length === 0 && (
                        <p className={`text-xs italic ${themeConfig.textSecondary} py-2`}>No cylinders in this location</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab content 4. History */}
        {activeTab === 'history' && (
          <div className={`rounded-xl overflow-hidden ${themeConfig.panel}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${themeConfig.tableHead}`}>
                    {[t('col.code'), t('col.product'), t('col.job'), t('col.date'), t('col.machine'), t('col.operator'), t('col.meterRun'), t('col.remark')].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockHistory.map((h, i) => (
                    <tr key={i} className={`border-t ${themeConfig.border} ${themeConfig.tableRow}`}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-300">{h.cyl}</td>
                      <td className="px-4 py-3 text-white">{h.product}</td>
                      <td className="px-4 py-3 font-mono text-xs text-cyan-300">{h.job}</td>
                      <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{h.date}</td>
                      <td className={`px-4 py-3 ${themeConfig.textSecondary}`}>{h.machine}</td>
                      <td className={`px-4 py-3 ${themeConfig.textSecondary}`}>{h.operator}</td>
                      <td className="px-4 py-3 text-white font-mono text-xs">{h.meter.toLocaleString()} {t('unit.meter')}</td>
                      <td className={`px-4 py-3 ${h.remark ? 'text-amber-400' : themeConfig.textSecondary} text-xs`}>{h.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Cylinder Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}></div>
          <div className={`relative ${themeConfig.panel} rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('btn.add')} — {t('nav.cylinder')}</h3>
              <button onClick={() => setShowAdd(false)} className={`p-1.5 rounded-lg ${themeConfig.panelHover} ${themeConfig.textSecondary}`}>
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'id', label: t('col.code'), ph: 'CYL-XX-000' },
                { key: 'product', label: t('col.productCode'), ph: 'AGH-001' },
                { key: 'customer', label: t('col.customer'), ph: 'บริษัท ...' },
                { key: 'size', label: t('cyl.size'), ph: '800×250' },
                { key: 'location', label: t('col.location'), ph: 'Rack A-01' },
              ].map(item => (
                <div key={item.key} className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                  <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>{item.label}</label>
                  <input
                    type="text"
                    value={(form as any)[item.key]}
                    onChange={e => setForm({ ...form, [item.key]: e.target.value })}
                    className="bg-transparent text-white text-sm outline-none w-full"
                    placeholder={item.ph}
                  />
                </div>
              ))}
              <div className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>{t('col.color')}</label>
                <select
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  className="bg-transparent text-white text-sm outline-none w-full"
                >
                  {['BK', 'CY', 'MG', 'YL', 'WH', 'VN', 'FL'].map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
              </div>
              <div className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="bg-transparent text-white text-sm outline-none w-full"
                >
                  {['Dedicated', 'Shared', 'Common', 'Backup'].map(t => (
                    <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className={`px-4 py-2.5 rounded-lg text-sm ${themeConfig.badge} ${themeConfig.textSecondary}`}>
                {t('btn.cancel')}
              </button>
              <button onClick={handleSaveCylinder} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${themeConfig.primaryButton}`}>
                {t('btn.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner Dialog */}
      {showScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowScan(false)}></div>
          <div className={`relative ${themeConfig.panel} rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('cyl.scanTitle')}</h3>
              <button onClick={() => setShowScan(false)} className={`p-1.5 rounded-lg ${themeConfig.panelHover} ${themeConfig.textSecondary}`}>
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center py-8">
              <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-cyan-400/50 flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent animate-pulse" />
                <Camera size={48} className="text-cyan-400/50" />
                <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 animate-bounce" style={{ top: '50%' }} />
              </div>
              <p className={`text-sm ${themeConfig.textSecondary}`}>{t('cyl.scanning')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cylinder Detail Dialog */}
      {selectedCyl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCyl(null)}></div>
          <div className={`relative ${themeConfig.panel} rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedCyl.id}</h3>
                <p className={`text-xs ${themeConfig.textSecondary}`}>{selectedCyl.product || selectedCyl.productCode} · {selectedCyl.customer || '—'}</p>
              </div>
              <button onClick={() => setSelectedCyl(null)} className={`p-1.5 rounded-lg ${themeConfig.panelHover} ${themeConfig.textSecondary}`}>
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: t('col.color'), val: <span className="inline-flex items-center gap-1.5 text-xs text-white"><span className="w-3.5 h-3.5 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[selectedCyl.color] || '#888' }} /><span>{selectedCyl.colorName} ({selectedCyl.color})</span></span> },
                { label: 'Type', val: <span className="text-sm text-white">{selectedCyl.type}</span> },
                { label: t('cyl.size'), val: <span className="text-sm font-mono text-white">{selectedCyl.size}</span> },
                { label: t('col.location'), val: <span className="text-sm text-white">{selectedCyl.location}</span> },
                { label: t('cyl.totalMeters'), val: <span className="text-sm font-mono text-white">{selectedCyl.meter.toLocaleString()} {t('unit.meter')}</span> },
                { label: t('col.lastUsed'), val: <span className="text-sm text-white">{selectedCyl.lastUsed}</span> },
              ].map((item, i) => (
                <div key={i} className={`p-3 rounded-lg ${themeConfig.badge}`}>
                  <p className={`text-[10px] ${themeConfig.textSecondary} mb-1`}>{item.label}</p>
                  {item.val}
                </div>
              ))}
            </div>

            <div className={`p-4 rounded-lg ${themeConfig.badge} mb-4`}>
              <p className={`text-xs font-medium ${themeConfig.textSecondary} mb-2`}>{t('cyl.changeStatus')}</p>
              <div className="flex flex-wrap gap-1.5">
                {['available', 'reserved', 'inProduction', 'inspection', 'repair', 'hold'].map(s => {
                  const active = selectedCyl.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedCyl, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? `${themeConfig.primaryBg} text-white shadow`
                          : `${themeConfig.badge} ${themeConfig.textSecondary} ${themeConfig.panelHover}`
                      }`}
                    >
                      {getStatusLabel(s)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setSelectedCyl(null)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${themeConfig.primaryButton}`}>
                {t('btn.save')}
              </button>
              <button onClick={() => setSelectedCyl(null)} className={`px-4 py-2.5 rounded-lg text-sm ${themeConfig.badge} ${themeConfig.textSecondary}`}>
                {t('btn.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Label Dialog */}
      {printTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPrintTarget(null)}>
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-200">Print Label</h3>
              <button onClick={() => setPrintTarget(null)} className="text-gray-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            <QrLabel
              data={printTarget.data.id}
              title={`Cylinder - ${printTarget.data.id}`}
              type="cylinder"
              fields={[
                { label: 'ID', value: printTarget.data.id },
                { label: 'Product', value: printTarget.data.product || printTarget.data.productCode },
                { label: 'Color', value: printTarget.data.colorName || printTarget.data.color },
                { label: 'Status', value: printTarget.data.status },
                { label: 'Meter', value: `${printTarget.data.meter.toLocaleString()} m` },
                { label: 'Location', value: printTarget.data.location },
              ]}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function CylindersPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-gray-400">Loading...</div>}>
      <CylindersPageContent />
    </Suspense>
  );
}
