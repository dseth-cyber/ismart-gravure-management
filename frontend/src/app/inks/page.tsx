'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, Plus, Download, Search, RefreshCw, AlertTriangle, Clock, Check, X, FlaskConical, Droplets, Palette, Factory, User, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { useTheme } from '@/lib/theme/theme-provider';

// Mock Data matching components/config.jsx
const initialFormulas = [
  { code: 'INK-BK-R03', product: 'AGH-001', color: 'Black', pantone: 'Process Black', revision: 'Rev.03', status: 'active', viscosity: '18±2 sec', lab: 'L:25 a:0 b:1', solvent: 'Ethyl Acetate' },
  { code: 'INK-CY-R02', product: 'AGH-001', color: 'Cyan', pantone: 'PMS 299C', revision: 'Rev.02', status: 'active', viscosity: '16±2 sec', lab: 'L:55 a:-30 b:-45', solvent: 'Ethyl Acetate' },
  { code: 'INK-MG-R01', product: 'AGH-001', color: 'Magenta', pantone: 'PMS 226C', revision: 'Rev.01', status: 'active', viscosity: '17±2 sec', lab: 'L:48 a:70 b:-5', solvent: 'Toluene' },
  { code: 'INK-WH-R04', product: 'AGH-001', color: 'White', pantone: 'Opaque White', revision: 'Rev.04', status: 'active', viscosity: '20±2 sec', lab: 'L:95 a:0 b:2', solvent: 'Ethyl Acetate' },
  { code: 'INK-BK-R02', product: 'AGH-001', color: 'Black', pantone: 'Process Black', revision: 'Rev.02', status: 'superseded', viscosity: '18±2 sec', lab: 'L:24 a:0 b:0', solvent: 'Toluene' },
];

const initialBatches = [
  { id: 'MIX-2024-089', formula: 'INK-BK-R03', product: 'AGH-001', color: 'Black', mixDate: '2024-06-18', expiry: '2024-09-18', weight: 18.5, remaining: 12.3, operator: 'สมหมาย', status: 'active' },
  { id: 'MIX-2024-090', formula: 'INK-CY-R02', product: 'AGH-001', color: 'Cyan', mixDate: '2024-06-19', expiry: '2024-07-05', weight: 15.0, remaining: 8.2, operator: 'วิไล', status: 'nearExpiry' },
  { id: 'MIX-2024-085', formula: 'INK-MG-R01', product: 'AGH-001', color: 'Magenta', mixDate: '2024-06-15', expiry: '2024-06-22', weight: 12.0, remaining: 3.1, operator: 'สมหมาย', status: 'nearExpiry' },
  { id: 'RAW-2024-001', formula: '-', product: '-', color: 'Black Base', mixDate: '-', expiry: '2024-12-31', weight: 50.0, remaining: 38.5, operator: 'DIC Corp', status: 'active' },
  { id: 'RAW-2023-099', formula: '-', product: '-', color: 'Magenta Base', mixDate: '-', expiry: '2024-06-30', weight: 25.0, remaining: 2.1, operator: 'Toyo Ink', status: 'expired' },
];

const initialShadeHistory = [
  { job: 'J2024-045', product: 'AGH-001', color: 'Black', time: '09:30', action: 'Add Yellow', material: 'Yellow Base Ink', qty: '0.2 kg', labBefore: 'L:24 a:0 b:0', labAfter: 'L:55 a:5 b:30', operator: 'สมชาย' },
  { job: 'J2024-045', product: 'AGH-001', color: 'Black', time: '09:45', action: 'Add Solvent', material: 'Toluene', qty: '0.5 kg', labBefore: 'L:55 a:5 b:30', labAfter: 'L:56 a:4 b:29', operator: 'สมชาย' },
  { job: 'J2024-045', product: 'AGH-001', color: 'Black', time: '10:00', action: 'Add White', material: 'Titanium White', qty: '0.1 kg', labBefore: 'L:56 a:4 b:29', labAfter: 'L:58 a:3 b:28', operator: 'สมชาย' },
  { job: 'J2024-044', product: 'BKK-002', color: 'Cyan', time: '14:20', action: 'Add Blue', material: 'Blue Base', qty: '0.3 kg', labBefore: 'L:54 a:-28 b:-43', labAfter: 'L:55 a:-30 b:-45', operator: 'วิไล' },
  { job: 'J2024-043', product: 'BKK-003', color: 'Magenta', time: '11:15', action: 'Add Red', material: 'Red Base', qty: '0.15 kg', labBefore: 'L:47 a:68 b:-4', labAfter: 'L:48 a:70 b:-5', operator: 'สมหมาย' },
];

const COLOR_MAP: Record<string, string> = {
  Black: '#1a1a1a', Cyan: '#00bcd4', Magenta: '#e91e63', Yellow: '#ffc107', White: '#f5f5f5', Varnish: '#9c27b0',
  'Black Base': '#1a1a1a', 'Magenta Base': '#e91e63'
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:       { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  superseded:   { bg: 'bg-gray-500/20',    text: 'text-gray-400',    dot: 'bg-gray-400' },
  nearExpiry:   { bg: 'bg-amber-500/20',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  expired:      { bg: 'bg-rose-500/20',    text: 'text-rose-400',    dot: 'bg-rose-400' },
};

function InksPageContent() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') || 'formulas';

  // Navigation states
  const [activeTab, setActiveTab] = useState<'formulas' | 'batch' | 'expiry' | 'shade'>('formulas');

  useEffect(() => {
    if (['formulas', 'batch', 'expiry', 'shade'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'formulas' | 'batch' | 'expiry' | 'shade') => {
    setActiveTab(tab);
    router.replace(`/inks?tab=${tab}`);
  };
  
  // Data states
  const [formulas, setFormulas] = useState(initialFormulas);
  const [batches, setBatches] = useState(initialBatches);

  // Search/Filters
  const [search, setSearch] = useState('');

  // Add formula modal
  const [showAddFormula, setShowAddFormula] = useState(false);
  const [formulaForm, setFormulaForm] = useState({ code: '', product: '', color: 'Black', pantone: '', solvent: 'Ethyl Acetate', viscosity: '', labL: '', labA: '', labB: '' });

  // Mix Ink wizard modal
  const [showMix, setShowMix] = useState(false);
  const [mixStep, setMixStep] = useState(1);
  const [mixProduct, setMixProduct] = useState('AGH-001');
  const [mixColor, setMixColor] = useState('Black');
  const [mixWeight, setMixWeight] = useState('15');

  // Filtering lists
  const filteredFormulas = formulas.filter(f => 
    !search || 
    f.code.toLowerCase().includes(search.toLowerCase()) || 
    f.product.toLowerCase().includes(search.toLowerCase()) || 
    f.color.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBatches = batches.filter(b => 
    !search || 
    b.id.toLowerCase().includes(search.toLowerCase()) || 
    b.color.toLowerCase().includes(search.toLowerCase())
  );

  // Expiry FEFO Sorting & Calculations
  const sortedExpiry = [...batches].sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
  const getUrgency = (expiry: string) => {
    if (expiry === '-') return { label: t('ink.normal'), color: 'green', days: 999 };
    const days = Math.ceil((new Date(expiry).getTime() - new Date('2024-06-20').getTime()) / 86400000);
    if (days <= 0) return { label: t('ink.expired'), color: 'rose', days };
    if (days <= 7) return { label: t('ink.urgent'), color: 'rose', days };
    if (days <= 30) return { label: t('ink.nearExpiry'), color: 'amber', days };
    return { label: t('ink.normal'), color: 'green', days };
  };

  const expiredCount = sortedExpiry.filter(b => getUrgency(b.expiry).days <= 0).length;
  const urgentCount = sortedExpiry.filter(b => { const d = getUrgency(b.expiry).days; return d > 0 && d <= 7; }).length;
  const nearCount = sortedExpiry.filter(b => { const d = getUrgency(b.expiry).days; return d > 7 && d <= 30; }).length;
  const normalCount = sortedExpiry.filter(b => getUrgency(b.expiry).days > 30).length;

  const handleSaveFormula = () => {
    const newF = {
      code: formulaForm.code || `INK-${formulaForm.color.substring(0, 2).toUpperCase()}-R${Math.floor(Math.random() * 9 + 1)}`,
      product: formulaForm.product || 'UNKNOWN-001',
      color: formulaForm.color,
      pantone: formulaForm.pantone || 'Custom',
      revision: 'Rev.01',
      status: 'active',
      viscosity: formulaForm.viscosity || '18±2 sec',
      lab: `L:${formulaForm.labL || '0'} a:${formulaForm.labA || '0'} b:${formulaForm.labB || '0'}`,
      solvent: formulaForm.solvent,
    };
    setFormulas([newF, ...formulas]);
    setShowAddFormula(false);
    setFormulaForm({ code: '', product: '', color: 'Black', pantone: '', solvent: 'Ethyl Acetate', viscosity: '', labL: '', labA: '', labB: '' });
  };

  const handleMixComplete = () => {
    const newB = {
      id: `MIX-2024-${Math.floor(100 + Math.random() * 900)}`,
      formula: `INK-${mixColor.substring(0, 2).toUpperCase()}-R03`,
      product: mixProduct,
      color: mixColor,
      mixDate: '2024-06-20',
      expiry: '2024-09-20',
      weight: parseFloat(mixWeight) || 15.0,
      remaining: parseFloat(mixWeight) || 15.0,
      operator: 'สมหมาย',
      status: 'active',
    };
    setBatches([newB, ...batches]);
    setShowMix(false);
    setMixStep(1);
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-[11px] font-medium uppercase tracking-wider ${themeConfig.textMuted} mb-0.5`}>INK FORMULA MANAGEMENT</p>
            <h1 className={`text-xl sm:text-2xl font-bold ${themeConfig.textPrimary}`}>{t('ink.title')}</h1>
            <p className={`text-sm ${themeConfig.textSecondary} mt-0.5`}>{t('ink.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'formulas' ? (
              <button onClick={() => setShowAddFormula(true)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium text-white transition-all ${themeConfig.primaryButton} shadow`}>
                <Plus size={15} />
                {t('ink.addFormula')}
              </button>
            ) : (
              <button onClick={() => setShowMix(true)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium text-white transition-all ${themeConfig.primaryButton} shadow`}>
                <FlaskConical size={15} />
                {t('btn.mixInk')}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex border-b ${themeConfig.border} gap-2`}>
          {[
            { id: 'formulas', label: t('ink.formulas') },
            { id: 'batch', label: t('nav.inkBatch') },
            { id: 'expiry', label: t('nav.inkExpiry') },
            { id: 'shade', label: t('nav.inkShade') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar for lists */}
        {(activeTab === 'formulas' || activeTab === 'batch') && (
          <div className={`flex items-center gap-2 ${themeConfig.input} rounded-lg px-3 py-2.5`}>
            <Search size={16} className={themeConfig.textMuted} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('ink.searchPlaceholder')}
              className="flex-1 bg-transparent outline-none text-sm text-white"
            />
          </div>
        )}

        {/* Tab Content 1. Formulas */}
        {activeTab === 'formulas' && (
          <div className={`rounded-xl overflow-hidden ${themeConfig.panel}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${themeConfig.tableHead}`}>
                    {[t('col.formula'), t('col.product'), t('col.color'), 'Pantone', t('col.revision'), t('col.viscosity'), 'LAB Target', t('col.status')].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFormulas.map(f => (
                    <tr key={f.code + f.revision} className={`${themeConfig.tableRow} transition-colors border-t ${themeConfig.border} cursor-pointer`}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-300">{f.code}</td>
                      <td className="px-4 py-3 text-white">{f.product}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-white">
                          <span className="w-4 h-4 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[f.color] || '#888' }} />
                          <span>{f.color}</span>
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{f.pantone}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-mono ${f.status === 'active' ? 'text-emerald-400' : themeConfig.textSecondary}`}>
                          {f.revision} {f.status === 'active' && <Check size={12} />}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-mono text-xs">{f.viscosity}</td>
                      <td className={`px-4 py-3 ${themeConfig.textSecondary} font-mono text-xs`}>{f.lab}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[f.status]?.bg || 'bg-gray-500/20'} ${STATUS_COLORS[f.status]?.text || 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[f.status]?.dot || 'bg-gray-400'}`} />
                          {t(`status.${f.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 2. Batches */}
        {activeTab === 'batch' && (
          <div className={`rounded-xl overflow-hidden ${themeConfig.panel}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${themeConfig.tableHead}`}>
                    {[t('col.batch'), t('col.formula'), t('col.color'), t('ink.mixDate'), t('col.expiry'), t('col.weight'), t('col.remaining'), t('col.operator'), t('col.status')].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map(b => {
                    const progress = b.weight > 0 ? (b.remaining / b.weight) * 100 : 0;
                    return (
                      <tr key={b.id} className={`${themeConfig.tableRow} transition-colors border-t ${themeConfig.border}`}>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-300">{b.id}</td>
                        <td className={`px-4 py-3 font-mono text-xs ${themeConfig.textSecondary}`}>{b.formula}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-white">
                            <span className="w-4 h-4 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[b.color] || '#888' }} />
                            <span>{b.color}</span>
                          </span>
                        </td>
                        <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{b.mixDate}</td>
                        <td className={`px-4 py-3 text-xs font-mono ${b.status === 'expired' ? 'text-rose-400' : b.status === 'nearExpiry' ? 'text-amber-400' : 'text-white'}`}>{b.expiry}</td>
                        <td className="px-4 py-3 text-white font-mono text-xs">{b.weight} {t('unit.kg')}</td>
                        <td className="px-4 py-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${progress < 20 ? 'from-rose-400 to-red-500' : 'from-cyan-400 to-blue-500'} transition-all`} style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-mono text-white whitespace-nowrap">{b.remaining} {t('unit.kg')}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{b.operator}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]?.bg || 'bg-gray-500/20'} ${STATUS_COLORS[b.status]?.text || 'text-gray-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[b.status]?.dot || 'bg-gray-400'}`} />
                            {t(`status.${b.status}`)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 3. Expiry FEFO */}
        {activeTab === 'expiry' && (
          <div className="grid gap-6">
            {/* Expiry summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: t('ink.expired'), count: expiredCount, color: 'from-rose-500 to-red-500', icon: X },
                { label: t('ink.urgent'), count: urgentCount, color: 'from-amber-500 to-orange-500', icon: AlertTriangle },
                { label: t('ink.nearExpiry'), count: nearCount, color: 'from-yellow-500 to-amber-500', icon: Clock },
                { label: t('ink.normal'), count: normalCount, color: 'from-emerald-500 to-teal-500', icon: Check },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div className={`rounded-xl p-4 ${themeConfig.panel}`} key={s.label}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-white">{s.count}</span>
                        <p className={`text-xs ${themeConfig.textSecondary}`}>{s.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FEFO list card */}
            <div className={`rounded-xl p-5 ${themeConfig.panel}`}>
              <div>
                <h3 className={`text-base font-semibold ${themeConfig.textPrimary}`}>{t('ink.fefoTitle')}</h3>
                <p className={`text-xs ${themeConfig.textSecondary} mb-4`}>{t('ink.fefoSubtitle')}</p>
              </div>
              <div className="space-y-2">
                {sortedExpiry.map((b, i) => {
                  const u = getUrgency(b.expiry);
                  const isFirst = i === 0;
                  const urgColors: Record<string, string> = {
                    rose: 'border-rose-500/30 bg-rose-500/5',
                    amber: 'border-amber-500/30 bg-amber-500/5',
                    green: `${themeConfig.border} bg-transparent`,
                  };
                  return (
                    <div key={b.id} className={`flex items-center gap-4 p-3 rounded-lg border ${urgColors[u.color]} transition-all`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isFirst ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white' : `${themeConfig.badge} ${themeConfig.textSecondary}`}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-cyan-300">{b.id}</span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-white">
                            <span className="w-3.5 h-3.5 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[b.color] || '#888' }} />
                            <span>{b.color}</span>
                          </span>
                        </div>
                        <p className={`text-xs ${themeConfig.textSecondary} mt-0.5`}>{b.formula !== '-' ? b.formula : b.operator} · {b.remaining} {t('unit.kg')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-mono ${u.color === 'rose' ? 'text-rose-400' : u.color === 'amber' ? 'text-amber-400' : 'text-white'}`}>{b.expiry}</p>
                        <p className={`text-xs ${u.color === 'rose' ? 'text-rose-400' : u.color === 'amber' ? 'text-amber-400' : themeConfig.textSecondary}`}>
                          {u.days <= 0 ? u.label : `${u.days} ${t('unit.days')}`}
                        </p>
                      </div>
                      {isFirst && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white">FEFO</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4. Shade */}
        {activeTab === 'shade' && (
          <div className="grid gap-6">
            {/* Shade Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`rounded-xl p-4 ${themeConfig.panel}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow">
                    <Palette size={18} />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white">{initialShadeHistory.length}</span>
                    <p className={`text-xs ${themeConfig.textSecondary}`}>Shade Adjustments</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl p-4 ${themeConfig.panel}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow">
                    <Factory size={18} />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white">3</span>
                    <p className={`text-xs ${themeConfig.textSecondary}`}>Jobs</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl p-4 ${themeConfig.panel}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white">3</span>
                    <p className={`text-xs ${themeConfig.textSecondary}`}>Operators</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Adjustments history table */}
            <div className={`rounded-xl overflow-hidden ${themeConfig.panel}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${themeConfig.tableHead}`}>
                      {[t('col.job'), t('col.product'), t('col.color'), t('col.date'), 'Action', 'Material', 'Qty', 'LAB Before', 'LAB After', t('col.operator')].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {initialShadeHistory.map((s, i) => (
                      <tr key={i} className={`border-t ${themeConfig.border} ${themeConfig.tableRow}`}>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-300">{s.job}</td>
                        <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{s.product}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-white">
                            <span className="w-3.5 h-3.5 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[s.color] || '#888' }} />
                            <span>{s.color}</span>
                          </span>
                        </td>
                        <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{s.time}</td>
                        <td className="px-4 py-3 text-white text-xs font-medium">{s.action}</td>
                        <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{s.material}</td>
                        <td className="px-4 py-3 text-white font-mono text-xs">{s.qty}</td>
                        <td className={`px-4 py-3 font-mono text-xs ${themeConfig.textSecondary}`}>{s.labBefore}</td>
                        <td className="px-4 py-3 font-mono text-xs text-cyan-400">{s.labAfter}</td>
                        <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{s.operator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Formula Modal */}
      {showAddFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddFormula(false)}></div>
          <div className={`relative ${themeConfig.panel} rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('ink.addFormula')}</h3>
              <button onClick={() => setShowAddFormula(false)} className={`p-1.5 rounded-lg ${themeConfig.panelHover} ${themeConfig.textSecondary}`}>
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'code', label: 'Formula Code', ph: 'INK-XX-R01' },
                { key: 'product', label: 'Product Code', ph: 'AGH-001' },
                { key: 'pantone', label: 'Pantone', ph: 'PMS 299C' },
                { key: 'viscosity', label: t('col.viscosity'), ph: '18±2 sec' },
              ].map(item => (
                <div key={item.key} className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                  <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>{item.label}</label>
                  <input
                    type="text"
                    value={(formulaForm as any)[item.key]}
                    onChange={e => setFormulaForm({ ...formulaForm, [item.key]: e.target.value })}
                    className="bg-transparent text-white text-sm outline-none w-full"
                    placeholder={item.ph}
                  />
                </div>
              ))}
              <div className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>{t('col.color')}</label>
                <select
                  value={formulaForm.color}
                  onChange={e => setFormulaForm({ ...formulaForm, color: e.target.value })}
                  className="bg-transparent text-white text-sm outline-none w-full"
                >
                  {['Black', 'Cyan', 'Magenta', 'Yellow', 'White', 'Varnish'].map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
              </div>
              <div className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>Solvent</label>
                <select
                  value={formulaForm.solvent}
                  onChange={e => setFormulaForm({ ...formulaForm, solvent: e.target.value })}
                  className="bg-transparent text-white text-sm outline-none w-full"
                >
                  {['Ethyl Acetate', 'Toluene', 'IPA', 'MEK'].map(s => (
                    <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={`mt-4 p-4 rounded-lg ${themeConfig.badge}`}>
              <p className={`text-xs font-semibold ${themeConfig.textSecondary} mb-2`}>LAB Target</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'labL', label: 'L*', ph: '55' },
                  { key: 'labA', label: 'a*', ph: '-30' },
                  { key: 'labB', label: 'b*', ph: '-45' },
                ].map(item => (
                  <div key={item.key} className={`${themeConfig.input} rounded-lg px-2 py-1.5 flex flex-col`}>
                    <label className={`text-[9px] ${themeConfig.textSecondary} font-semibold mb-0.5`}>{item.label}</label>
                    <input
                      type="text"
                      value={(formulaForm as any)[item.key]}
                      onChange={e => setFormulaForm({ ...formulaForm, [item.key]: e.target.value })}
                      className="bg-transparent text-white text-xs outline-none w-full font-mono"
                      placeholder={item.ph}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAddFormula(false)} className={`px-4 py-2.5 rounded-lg text-sm ${themeConfig.badge} ${themeConfig.textSecondary}`}>
                {t('btn.cancel')}
              </button>
              <button onClick={handleSaveFormula} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${themeConfig.primaryButton}`}>
                {t('btn.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mix Ink 3-Step Wizard Modal */}
      {showMix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMix(false)}></div>
          <div className={`relative ${themeConfig.panel} rounded-2xl max-w-md w-full p-6 shadow-2xl z-10`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('ink.mixTitle')}</h3>
              <button onClick={() => setShowMix(false)} className={`p-1.5 rounded-lg ${themeConfig.panelHover} ${themeConfig.textSecondary}`}>
                <X size={18} />
              </button>
            </div>

            {/* Wizard step progress */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s <= mixStep ? `${themeConfig.primaryBg} text-white shadow-lg` : `${themeConfig.badge} ${themeConfig.textSecondary}`}`}>{s}</div>
                  {s < 3 && <div className={`flex-1 h-0.5 ${s < mixStep ? 'bg-cyan-500' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1: Select Formula */}
            {mixStep === 1 && (
              <div className="space-y-4">
                <p className={`text-sm ${themeConfig.textSecondary}`}>{t('ink.selectFormula')}</p>
                <div className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                  <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>Product Code</label>
                  <select
                    value={mixProduct}
                    onChange={e => setMixProduct(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none w-full"
                  >
                    <option value="AGH-001" className="bg-slate-900">AGH-001</option>
                    <option value="BKK-002" className="bg-slate-900">BKK-002</option>
                  </select>
                </div>
                <div className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                  <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>{t('col.color')}</label>
                  <select
                    value={mixColor}
                    onChange={e => setMixColor(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none w-full"
                  >
                    <option value="Black" className="bg-slate-900">Black (BK)</option>
                    <option value="Cyan" className="bg-slate-900">Cyan (CY)</option>
                    <option value="Magenta" className="bg-slate-900">Magenta (MG)</option>
                  </select>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-xs text-cyan-300">{t('ink.formulaUsed')}: INK-BK-R03 (Rev.03 Active)</p>
                </div>
              </div>
            )}

            {/* Step 2: FEFO Scan Raw Materials */}
            {mixStep === 2 && (
              <div className="space-y-4">
                <p className={`text-sm ${themeConfig.textSecondary}`}>{t('ink.scanRaw')}</p>
                <div className="p-3.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-mono font-semibold text-cyan-300">RAW-2024-001</span>
                      <p className={`text-xs ${themeConfig.textSecondary} mt-0.5`}>Black Base · DIC Corp · 38.5 {t('unit.kg')}</p>
                    </div>
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white">FEFO #1</span>
                  </div>
                </div>
                <div className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                  <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>{t('ink.weightUsed')}</label>
                  <input
                    type="number"
                    value={mixWeight}
                    onChange={e => setMixWeight(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none w-full font-mono"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {mixStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <Check size={32} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-400">{t('ink.mixSuccess')}</p>
                  <p className={`text-xs ${themeConfig.textSecondary} mt-1`}>Batch: MIX-2024-092</p>
                </div>
                <div className={`p-3 rounded-lg ${themeConfig.badge}`}>
                  <p className={`text-[10px] ${themeConfig.textSecondary} mb-1`}>Expiry (Earliest Rule)</p>
                  <p className="text-sm font-mono text-white">2024-12-31</p>
                </div>
                <div className={`p-4 rounded-lg ${themeConfig.badge} text-center flex flex-col items-center justify-center`}>
                  <QrCode size={48} className="text-cyan-300 mb-1" />
                  <p className={`text-xs ${themeConfig.textSecondary}`}>{t('ink.qrReady')}</p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2 mt-6">
              {mixStep > 1 && (
                <button onClick={() => setMixStep(mixStep - 1)} className={`px-4 py-2.5 rounded-lg text-sm ${themeConfig.badge} ${themeConfig.textSecondary}`}>
                  {t('btn.back')}
                </button>
              )}
              <button
                onClick={() => mixStep < 3 ? setMixStep(mixStep + 1) : handleMixComplete()}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${themeConfig.primaryButton}`}
              >
                {mixStep < 3 ? t('btn.next') : t('ink.printQr')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function InksPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-gray-400">Loading...</div>}>
      <InksPageContent />
    </Suspense>
  );
}
