'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, Plus, Download, Search, RefreshCw, AlertTriangle, Clock, Check, X, FlaskConical, Droplets, Palette, Factory, User, QrCode, Printer, Trash2, RotateCw, FileSpreadsheet, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/app-layout';
import { AppDialog, ConfirmDialog } from '@/components/shared/app-dialog';
import { useTheme } from '@/lib/theme/theme-provider';
import { 
  listFormulas, createFormula, listBatches, createBatch, updateBatch,
  deleteFormula, restoreFormula, permanentDeleteFormula, emptyFormulaTrash,
  deleteBatch, restoreBatch, permanentDeleteBatch, emptyBatchTrash,
  batchUpdateFormulaStatus, batchDeleteFormulas, batchRestoreFormulas,
  batchDeleteBatches, batchRestoreBatches
} from '@/lib/services/ink';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebouncedCheck } from '@/lib/hooks/use-debounced-check';
import { apiClient } from '@/lib/api/client';
import { BatchToolbar, BatchSelectAllCheckbox, BatchRowCheckbox } from '@/components/shared/batch-toolbar';
import { useExport, type ExportColumn } from '@/lib/hooks/use-export';
import { ExportButton } from '@/components/shared/export-button';
import { ImportButton } from '@/components/shared/import-button';
import { bulkCreateFormulas, bulkCreateBatches } from '@/lib/services/ink';

const QrLabel = dynamic(() => import('@/components/shared/qr-label').then(m => ({ default: m.QrLabel })), { ssr: false });
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { InkFormulaDto, InkBatchDto } from '@shared/dto/ink/ink.dto';

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

  const queryClient = useQueryClient();

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
  
  // Search/Filters
  const [search, setSearch] = useState('');

  // Add formula modal
  const [printTarget, setPrintTarget] = useState<{ type: 'ink'; data: InkBatchDto } | null>(null);
  const [showAddFormula, setShowAddFormula] = useState(false);
  const [formulaForm, setFormulaForm] = useState({ code: '', product: '', color: 'Black', pantone: '', solvent: 'Ethyl Acetate', viscosity: '', labL: '', labA: '', labB: '' });

  // Mix Ink wizard modal
  const [showMix, setShowMix] = useState(false);
  const [mixStep, setMixStep] = useState(1);
  const [mixProduct, setMixProduct] = useState('AGH-001');
  const [mixColor, setMixColor] = useState('Black');
  const [mixWeight, setMixWeight] = useState('15');

  // Trash bin toggles and dialog targets
  const [showTrashFormulas, setShowTrashFormulas] = useState(false);
  const [showTrashBatches, setShowTrashBatches] = useState(false);
  
  // React Query fetching
  const { data: formulas = [], isLoading: formulasLoading, error: formulasError, refetch: refetchFormulas } = useQuery<InkFormulaDto[]>({
    queryKey: ['formulas', showTrashFormulas],
    queryFn: () => listFormulas({ showDeleted: showTrashFormulas ? 'true' : 'false' }),
  });

  const { data: batches = [], isLoading: batchesLoading, error: batchesError, refetch: refetchBatches } = useQuery<InkBatchDto[]>({
    queryKey: ['batches', showTrashBatches],
    queryFn: () => listBatches({ showDeleted: showTrashBatches ? 'true' : 'false' }),
  });

  const loading = formulasLoading || batchesLoading;
  const error = (formulasError instanceof Error ? formulasError.message : formulasError ? String(formulasError) : '') || 
                (batchesError instanceof Error ? batchesError.message : batchesError ? String(batchesError) : '');
  const refetch = () => { refetchFormulas(); refetchBatches(); };

  const [confirmDeleteFormula, setConfirmDeleteFormula] = useState<string | null>(null);
  const [confirmPermanentDeleteFormula, setConfirmPermanentDeleteFormula] = useState<string | null>(null);
  const [emptyFormulaTrashConfirm, setEmptyFormulaTrashConfirm] = useState(false);

  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<string | null>(null);
  const [confirmPermanentDeleteBatch, setConfirmPermanentDeleteBatch] = useState<string | null>(null);
  const [emptyBatchTrashConfirm, setEmptyBatchTrashConfirm] = useState(false);

  // Batch selection
  const [selectedFormulaIds, setSelectedFormulaIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batchFormulaStatusOpen, setBatchFormulaStatusOpen] = useState(false);
  const [batchFormulaDeleteOpen, setBatchFormulaDeleteOpen] = useState(false);
  const [batchFormulaRestoreOpen, setBatchFormulaRestoreOpen] = useState(false);
  const [batchBatchesDeleteOpen, setBatchBatchesDeleteOpen] = useState(false);
  const [batchBatchesRestoreOpen, setBatchBatchesRestoreOpen] = useState(false);

  // Dynamic Required Fields configurations
  const [requiredFieldsFormula, setRequiredFieldsFormula] = useState<string[]>([]);
  const [requiredFieldsBatch, setRequiredFieldsBatch] = useState<string[]>([]);
  const [formulaError, setFormulaError] = useState('');
  const [batchError, setBatchError] = useState('');

  const codeDuplicateStatus = useDebouncedCheck(
    formulaForm.code,
    async (val) => {
      const res = await apiClient.get(`/api/v1/inks/formulas/exists?field=code&value=${encodeURIComponent(val)}`);
      return res.data?.data?.exists ?? false;
    },
    400
  );

  useEffect(() => {
    const loadRequired = async () => {
      try {
        const { listSettings } = await import('@/lib/services/setting');
        const dbSettings = await listSettings();
        const fSetting = dbSettings.find(s => s.key === 'requiredFields.inkFormula');
        if (fSetting) setRequiredFieldsFormula(JSON.parse(fSetting.value));
        const bSetting = dbSettings.find(s => s.key === 'requiredFields.inkBatch');
        if (bSetting) setRequiredFieldsBatch(JSON.parse(bSetting.value));
      } catch (e) {
        console.error('Failed to load required fields settings', e);
      }
    };
    loadRequired();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setPrintTarget((e as CustomEvent).detail as any);
    document.addEventListener('print-label', handler);
    return () => document.removeEventListener('print-label', handler);
  }, []);

  // Filtering lists
  // Clear selection when tab, search, or trash state changes
  useEffect(() => {
    setSelectedFormulaIds([]);
    setSelectedBatchIds([]);
  }, [activeTab, search, showTrashFormulas, showTrashBatches]);

  const handleBatchFormulaStatusChange = async (status: string) => {
    try {
      await batchUpdateFormulaStatus(selectedFormulaIds, status);
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
      setSelectedFormulaIds([]);
    } catch (err) {
      console.error('Failed to batch update formula status', err);
    } finally {
      setBatchFormulaStatusOpen(false);
    }
  };

  const handleBatchFormulaDelete = async () => {
    try {
      await batchDeleteFormulas(selectedFormulaIds);
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
      setSelectedFormulaIds([]);
    } catch (err) {
      console.error('Failed to batch delete formulas', err);
    } finally {
      setBatchFormulaDeleteOpen(false);
    }
  };

  const handleBatchFormulaRestore = async () => {
    try {
      await batchRestoreFormulas(selectedFormulaIds);
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
      setSelectedFormulaIds([]);
    } catch (err) {
      console.error('Failed to batch restore formulas', err);
    } finally {
      setBatchFormulaRestoreOpen(false);
    }
  };

  const handleBatchBatchesDelete = async () => {
    try {
      await batchDeleteBatches(selectedBatchIds);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setSelectedBatchIds([]);
    } catch (err) {
      console.error('Failed to batch delete batches', err);
    } finally {
      setBatchBatchesDeleteOpen(false);
    }
  };

  const handleBatchBatchesRestore = async () => {
    try {
      await batchRestoreBatches(selectedBatchIds);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setSelectedBatchIds([]);
    } catch (err) {
      console.error('Failed to batch restore batches', err);
    } finally {
      setBatchBatchesRestoreOpen(false);
    }
  };

  const filteredFormulas = formulas.filter(f => 
    !search || 
    f.code.toLowerCase().includes(search.toLowerCase()) || 
    (f.productCode || '').toLowerCase().includes(search.toLowerCase()) || 
    f.color.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBatches = batches.filter(b => 
    !search || 
    b.id.toLowerCase().includes(search.toLowerCase()) || 
    b.color.toLowerCase().includes(search.toLowerCase())
  );

  // Expiry FEFO Sorting & Calculations
  const sortedExpiry = [...batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  const getUrgency = (expiryDate: string) => {
    if (!expiryDate) return { label: t('ink.normal'), color: 'green', days: 999 };
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    if (days <= 0) return { label: t('ink.expired'), color: 'rose', days };
    if (days <= 7) return { label: t('ink.urgent'), color: 'rose', days };
    if (days <= 30) return { label: t('ink.nearExpiry'), color: 'amber', days };
    return { label: t('ink.normal'), color: 'green', days };
  };

  const expiredCount = sortedExpiry.filter(b => getUrgency(b.expiryDate).days <= 0).length;
  const urgentCount = sortedExpiry.filter(b => { const d = getUrgency(b.expiryDate).days; return d > 0 && d <= 7; }).length;
  const nearCount = sortedExpiry.filter(b => { const d = getUrgency(b.expiryDate).days; return d > 7 && d <= 30; }).length;
  const normalCount = sortedExpiry.filter(b => getUrgency(b.expiryDate).days > 30).length;

  const handleSaveFormula = async () => {
    if (formulaForm.code && codeDuplicateStatus === 'exists') {
      setFormulaError(t('common.alreadyExists'));
      return;
    }
    const missing: string[] = [];
    requiredFieldsFormula.forEach(field => {
      let val = '';
      if (field === 'productCode') val = formulaForm.product;
      else if (field === 'labTarget') val = formulaForm.labL || formulaForm.labA || formulaForm.labB;
      else val = (formulaForm as any)[field];

      if (!val || String(val).trim() === '') {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      setFormulaError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${missing.map(f => t(`ink.${f}`) || f).join(', ')}`);
      return;
    }
    setFormulaError('');

    try {
      await createFormula({
        code: formulaForm.code || `INK-${formulaForm.color.substring(0, 2).toUpperCase()}-R${Math.floor(Math.random() * 9 + 1)}`,
        productCode: formulaForm.product || 'UNKNOWN-001',
        color: formulaForm.color,
        pantone: formulaForm.pantone || 'Custom',
        viscosity: formulaForm.viscosity || '18±2 sec',
        labTarget: `L:${formulaForm.labL || '0'} a:${formulaForm.labA || '0'} b:${formulaForm.labB || '0'}`,
        solvent: formulaForm.solvent,
      });
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
      setShowAddFormula(false);
      setFormulaForm({ code: '', product: '', color: 'Black', pantone: '', solvent: 'Ethyl Acetate', viscosity: '', labL: '', labA: '', labB: '' });
    } catch (err: any) {
      console.error('Failed to create formula:', err);
      setFormulaError(err?.response?.data?.message || err?.message || 'Failed to create formula');
    }
  };

  const handleMixComplete = async () => {
    const missing: string[] = [];
    requiredFieldsBatch.forEach(field => {
      let val = '';
      if (field === 'mixDate') val = new Date().toISOString().split('T')[0];
      else if (field === 'expiryDate') val = '2024-09-20';
      else if (field === 'weight') val = mixWeight;
      else if (field === 'operator') val = 'สมหมาย';
      else if (field === 'mixProduct') val = mixProduct;
      else if (field === 'mixColor') val = mixColor;
      
      if (!val || String(val).trim() === '') {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      setBatchError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${missing.map(f => t(`ink.${f}`) || f).join(', ')}`);
      return;
    }
    setBatchError('');

    try {
      await createBatch({
        id: `MIX-2024-${Math.floor(100 + Math.random() * 900)}`,
        formulaCode: `INK-${mixColor.substring(0, 2).toUpperCase()}-R03`,
        productCode: mixProduct,
        color: mixColor,
        mixDate: new Date().toISOString().split('T')[0],
        expiryDate: '2024-09-20',
        weight: parseFloat(mixWeight) || 15.0,
        operator: 'สมหมาย',
      });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setShowMix(false);
      setMixStep(1);
    } catch (err: any) {
      console.error('Failed to create batch:', err);
      setBatchError(err?.response?.data?.message || err?.message || 'Failed to create batch');
    }
  };

  const { exportExcel, exportPDF } = useExport();

  const formulaColumns: ExportColumn[] = [
    { key: 'code', label: 'Formula' },
    { key: 'productCode', label: 'Product' },
    { key: 'color', label: 'Color' },
    { key: 'pantone', label: 'Pantone' },
    { key: 'revision', label: 'Revision' },
    { key: 'viscosity', label: 'Viscosity' },
    { key: 'labTarget', label: 'Lab Target' },
    { key: 'status', label: 'Status' },
  ];

  const batchColumns: ExportColumn[] = [
    { key: 'id', label: 'Batch' },
    { key: 'formulaCode', label: 'Formula' },
    { key: 'color', label: 'Color' },
    { key: 'mixDate', label: 'Mix Date' },
    { key: 'expiryDate', label: 'Expiry' },
    { key: 'weight', label: 'Weight', format: (v) => `${v} kg` },
    { key: 'remaining', label: 'Remaining', format: (v) => `${v} kg` },
    { key: 'operator', label: 'Operator' },
    { key: 'status', label: 'Status' },
  ];

  // Trash bins handlers
  const handleDeleteFormula = async (code: string) => {
    try {
      await deleteFormula(code);
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
    } catch (err) {
      console.error('Failed to soft delete formula', err);
    }
  };

  const handleRestoreFormula = async (code: string) => {
    try {
      await restoreFormula(code);
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
    } catch (err) {
      console.error('Failed to restore formula', err);
    }
  };

  const handlePermanentDeleteFormula = async () => {
    if (!confirmPermanentDeleteFormula) return;
    try {
      await permanentDeleteFormula(confirmPermanentDeleteFormula);
      setConfirmPermanentDeleteFormula(null);
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
    } catch (err) {
      console.error('Failed to permanent delete formula', err);
    }
  };

  const handleEmptyFormulaTrash = async () => {
    try {
      await emptyFormulaTrash();
      setEmptyFormulaTrashConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
    } catch (err) {
      console.error('Failed to empty formula trash', err);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    try {
      await deleteBatch(id);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch (err) {
      console.error('Failed to soft delete batch', err);
    }
  };

  const handleRestoreBatch = async (id: string) => {
    try {
      await restoreBatch(id);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch (err) {
      console.error('Failed to restore batch', err);
    }
  };

  const handlePermanentDeleteBatch = async () => {
    if (!confirmPermanentDeleteBatch) return;
    try {
      await permanentDeleteBatch(confirmPermanentDeleteBatch);
      setConfirmPermanentDeleteBatch(null);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch (err) {
      console.error('Failed to permanent delete batch', err);
    }
  };

  const handleEmptyBatchTrash = async () => {
    try {
      await emptyBatchTrash();
      setEmptyBatchTrashConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch (err) {
      console.error('Failed to empty batch trash', err);
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${themeConfig.textPrimary}`}>{t('ink.title')}</h1>
            <p className={`text-sm ${themeConfig.textSecondary} mt-0.5`}>{t('ink.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'formulas' && (
              <>
                <button onClick={() => { setShowAddFormula(true); setFormulaError(''); }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium text-white transition-all ${themeConfig.primaryButton} shadow`}>
                  <Plus size={15} />
                  {t('ink.addFormula')}
                </button>
                <button onClick={() => setShowTrashFormulas(v => !v)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all shadow ${
                    showTrashFormulas ? 'bg-red-600 hover:bg-red-500 text-white font-semibold' : `${themeConfig.secondaryButton}`
                  }`}>
                  <Trash2 size={15} />
                  {showTrashFormulas ? t('common.viewActive') || 'View Active' : t('common.trashBin') || 'Trash Bin'}
                </button>
                {showTrashFormulas && formulas.length > 0 && (
                  <button onClick={() => setEmptyFormulaTrashConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all shadow text-red-400 border border-red-500/30 hover:bg-red-500/10">
                    <Trash2 size={15} />
                    {t('common.emptyTrash') || 'Empty Trash'}
                  </button>
                )}
              </>
            )}
            {activeTab === 'batch' && (
              <>
                <button onClick={() => { setShowMix(true); setBatchError(''); }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium text-white transition-all ${themeConfig.primaryButton} shadow`}>
                  <FlaskConical size={15} />
                  {t('btn.mixInk')}
                </button>
                <button onClick={() => setShowTrashBatches(v => !v)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all shadow ${
                    showTrashBatches ? 'bg-red-600 hover:bg-red-500 text-white font-semibold' : `${themeConfig.secondaryButton}`
                  }`}>
                  <Trash2 size={15} />
                  {showTrashBatches ? t('common.viewActive') || 'View Active' : t('common.trashBin') || 'Trash Bin'}
                </button>
                {showTrashBatches && batches.length > 0 && (
                  <button onClick={() => setEmptyBatchTrashConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all shadow text-red-400 border border-red-500/30 hover:bg-red-500/10">
                    <Trash2 size={15} />
                    {t('common.emptyTrash') || 'Empty Trash'}
                  </button>
                )}
              </>
            )}
            {activeTab !== 'formulas' && activeTab !== 'batch' && (
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

        {loading ? (
          <div className={`flex items-center justify-center py-16 ${themeConfig.textSecondary}`}>
            <RefreshCw size={20} className="animate-spin mr-2" />
            {t('common.loading')}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-rose-400 gap-2">
            <AlertTriangle size={24} />
            <p className="text-sm">{error}</p>
            <button onClick={() => refetch()} className={`px-4 py-2 rounded-lg text-sm font-medium ${themeConfig.primaryButton}`}>
              {t('btn.retry')}
            </button>
          </div>
        ) : null}

        {!loading && !error && activeTab === 'formulas' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
              <ImportButton
                fieldMapping={[
                  { key: 'code', label: 'Formula Code', required: true },
                  { key: 'name', label: 'Name' },
                  { key: 'color', label: 'Color' },
                ]}
                onImport={async (rows, mapping) => {
                  await bulkCreateFormulas(rows as any);
                  queryClient.invalidateQueries({ queryKey: ['ink-formulas'] });
                }}
              />
              <ExportButton
                showImage={false}
                onExportExcel={() => exportExcel(filteredFormulas as any, formulaColumns, 'ink-formulas')}
                onExportPDF={() => exportPDF(filteredFormulas as any, formulaColumns, 'ink-formulas', 'Ink Formulas')}
              />
            </div>
            </div>
            <BatchToolbar
              items={filteredFormulas}
              selectedIds={selectedFormulaIds}
              onSelectionChange={setSelectedFormulaIds}
              getId={(f: any) => f.code}
              showTrash={showTrashFormulas}
              actions={showTrashFormulas ? [
                { label: t('common.restore'), icon: <RotateCw size={13} />, variant: 'warning', onClick: () => setBatchFormulaRestoreOpen(true) },
                { label: t('common.permanentDelete'), icon: <Trash2 size={13} />, variant: 'danger', onClick: () => setBatchFormulaDeleteOpen(true) },
              ] : [
                { label: t('ink.changeStatus'), onClick: () => setBatchFormulaStatusOpen(true) },
                { label: t('common.delete'), icon: <Trash2 size={13} />, variant: 'danger', onClick: () => setBatchFormulaDeleteOpen(true) },
              ]}
            />
            <div className={`rounded-xl overflow-hidden ${themeConfig.panel}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${themeConfig.tableHead}`}>
                      <th className="px-4 py-3 w-10">
                        <BatchSelectAllCheckbox
                          checked={filteredFormulas.length > 0 && filteredFormulas.every(f => selectedFormulaIds.includes(f.code))}
                          indeterminate={selectedFormulaIds.length > 0 && !filteredFormulas.every(f => selectedFormulaIds.includes(f.code))}
                          onChange={() => {
                            const allIds = filteredFormulas.map(f => f.code);
                            if (filteredFormulas.every(f => selectedFormulaIds.includes(f.code))) {
                              setSelectedFormulaIds(prev => prev.filter(id => !allIds.includes(id)));
                            } else {
                              setSelectedFormulaIds(prev => [...new Set([...prev, ...allIds])]);
                            }
                          }}
                        />
                      </th>
                      {[t('col.formula'), t('col.product'), t('col.color'), t('col.pantone'), t('col.revision'), t('col.viscosity'), t('col.labTarget'), t('col.status'), t('common.actions') || 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFormulas.map(f => (
                      <tr key={f.code + f.revision} className={`${themeConfig.tableRow} transition-colors border-t ${themeConfig.border}`}>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <BatchRowCheckbox
                            checked={selectedFormulaIds.includes(f.code)}
                            onChange={() => {
                              setSelectedFormulaIds(prev =>
                                prev.includes(f.code) ? prev.filter(id => id !== f.code) : [...prev, f.code]
                              );
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-300">{f.code}</td>
                        <td className="px-4 py-3 text-white">{f.productCode}</td>
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
                        <td className={`px-4 py-3 ${themeConfig.textSecondary} font-mono text-xs`}>{f.labTarget}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[f.status]?.bg || 'bg-gray-500/20'} ${STATUS_COLORS[f.status]?.text || 'text-gray-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[f.status]?.dot || 'bg-gray-400'}`} />
                            {t(`status.${f.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-left">
                          {showTrashFormulas ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleRestoreFormula(f.code)} className="text-emerald-400 hover:text-emerald-300">
                                <RotateCw size={15} />
                              </button>
                              <button onClick={() => setConfirmPermanentDeleteFormula(f.code)} className="text-red-500 hover:text-red-400">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => handleDeleteFormula(f.code)} className="text-red-400 hover:text-red-300">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'batch' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
              <ImportButton
                fieldMapping={[
                  { key: 'batchNo', label: 'Batch No', required: true },
                  { key: 'formulaCode', label: 'Formula Code', required: true },
                  { key: 'quantity', label: 'Quantity' },
                ]}
                onImport={async (rows, mapping) => {
                  await bulkCreateBatches(rows as any);
                  queryClient.invalidateQueries({ queryKey: ['ink-batches'] });
                }}
              />
              <ExportButton
                showImage={false}
                onExportExcel={() => exportExcel(filteredBatches as any, batchColumns, 'ink-batches')}
                onExportPDF={() => exportPDF(filteredBatches as any, batchColumns, 'ink-batches', 'Ink Batches')}
              />
            </div>
            </div>
            <BatchToolbar
              items={filteredBatches}
              selectedIds={selectedBatchIds}
              onSelectionChange={setSelectedBatchIds}
              showTrash={showTrashBatches}
              actions={showTrashBatches ? [
                { label: t('common.restore'), icon: <RotateCw size={13} />, variant: 'warning', onClick: () => setBatchBatchesRestoreOpen(true) },
                { label: t('common.permanentDelete'), icon: <Trash2 size={13} />, variant: 'danger', onClick: () => setBatchBatchesDeleteOpen(true) },
              ] : [
                { label: t('common.delete'), icon: <Trash2 size={13} />, variant: 'danger', onClick: () => setBatchBatchesDeleteOpen(true) },
              ]}
            />
            <div className={`rounded-xl overflow-hidden ${themeConfig.panel}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${themeConfig.tableHead}`}>
                      <th className="px-4 py-3 w-10">
                        <BatchSelectAllCheckbox
                          checked={filteredBatches.length > 0 && filteredBatches.every(b => selectedBatchIds.includes(b.id))}
                          indeterminate={selectedBatchIds.length > 0 && !filteredBatches.every(b => selectedBatchIds.includes(b.id))}
                          onChange={() => {
                            const allIds = filteredBatches.map(b => b.id);
                            if (filteredBatches.every(b => selectedBatchIds.includes(b.id))) {
                              setSelectedBatchIds(prev => prev.filter(id => !allIds.includes(id)));
                            } else {
                              setSelectedBatchIds(prev => [...new Set([...prev, ...allIds])]);
                            }
                          }}
                        />
                      </th>
                      {[t('col.batch'), t('col.formula'), t('col.color'), t('ink.mixDate'), t('col.expiry'), t('col.weight'), t('col.remaining'), t('col.operator'), t('col.status'), t('common.actions') || 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map(b => {
                      const progress = b.weight > 0 ? (b.remaining / b.weight) * 100 : 0;
                      return (
                        <tr key={b.id} className={`${themeConfig.tableRow} transition-colors border-t ${themeConfig.border}`}>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <BatchRowCheckbox
                              checked={selectedBatchIds.includes(b.id)}
                              onChange={() => {
                                setSelectedBatchIds(prev =>
                                  prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id]
                                );
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-300">{b.id}</td>
                        <td className={`px-4 py-3 font-mono text-xs ${themeConfig.textSecondary}`}>{b.formulaCode}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-white">
                            <span className="w-4 h-4 rounded-sm border border-white/20" style={{ backgroundColor: COLOR_MAP[b.color] || '#888' }} />
                            <span>{b.color}</span>
                          </span>
                        </td>
                        <td className={`px-4 py-3 ${themeConfig.textSecondary} text-xs`}>{b.mixDate}</td>
                        <td className={`px-4 py-3 text-xs font-mono ${b.status === 'expired' ? 'text-rose-400' : b.status === 'nearExpiry' ? 'text-amber-400' : 'text-white'}`}>{b.expiryDate}</td>
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
                        <td className="px-2 py-3 text-left">
                          {showTrashBatches ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleRestoreBatch(b.id)} className="text-emerald-400 hover:text-emerald-300">
                                <RotateCw size={15} />
                              </button>
                              <button onClick={() => setConfirmPermanentDeleteBatch(b.id)} className="text-red-500 hover:text-red-400">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => document.dispatchEvent(new CustomEvent('print-label', { detail: { type: 'ink', data: b } }))}
                                className={`p-1 rounded ${themeConfig.panelHover} ${themeConfig.textSecondary} hover:text-cyan-400`}
                                title="Print Label"
                              >
                                <Printer size={15} />
                              </button>
                              <button onClick={() => handleDeleteBatch(b.id)} className="text-red-400 hover:text-red-300">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        {/* Tab Content 3. Expiry FEFO */}
        {!loading && !error && activeTab === 'expiry' && (
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
                  const u = getUrgency(b.expiryDate);
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
                        <p className={`text-xs ${themeConfig.textSecondary} mt-0.5`}>{(b.formulaCode && b.formulaCode !== '-' ? b.formulaCode : b.operator)} · {b.remaining} {t('unit.kg')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-mono ${u.color === 'rose' ? 'text-rose-400' : u.color === 'amber' ? 'text-amber-400' : 'text-white'}`}>{b.expiryDate}</p>
                        <p className={`text-xs ${u.color === 'rose' ? 'text-rose-400' : u.color === 'amber' ? 'text-amber-400' : themeConfig.textSecondary}`}>
                          {u.days <= 0 ? u.label : `${u.days} ${t('unit.days')}`}
                        </p>
                      </div>
                      {isFirst && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white">{t('ink.fefoBadge')}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4. Shade */}
        {!loading && !error && activeTab === 'shade' && (
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
                    <p className={`text-xs ${themeConfig.textSecondary}`}>{t('nav.inkShade')}</p>
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
                    <p className={`text-xs ${themeConfig.textSecondary}`}>{t('col.jobs')}</p>
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
                    <p className={`text-xs ${themeConfig.textSecondary}`}>{t('col.operator')}</p>
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
                      {[t('col.job'), t('col.product'), t('col.color'), t('col.date'), t('col.action'), t('col.material'), t('col.qty'), t('col.labBefore'), t('col.labAfter'), t('col.operator')].map(h => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddFormula(false)}></div>
          <div className={`relative ${themeConfig.panel} rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 overflow-visible`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{t('ink.addFormula')}</h3>
              <button onClick={() => setShowAddFormula(false)} className={`p-1.5 rounded-lg ${themeConfig.panelHover} ${themeConfig.textSecondary}`}>
                <X size={18} />
              </button>
            </div>
            {formulaError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {formulaError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'code', label: t('col.formula'), ph: 'INK-XX-R01' },
                { key: 'product', label: t('col.productCode'), ph: 'AGH-001' },
                { key: 'pantone', label: t('col.pantone'), ph: 'PMS 299C' },
                { key: 'viscosity', label: t('col.viscosity'), ph: '18±2 sec' },
              ].map(item => {
                const isRequired = item.key === 'product' ? requiredFieldsFormula.includes('productCode') : requiredFieldsFormula.includes(item.key);
                return (
                  <div key={item.key} className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                    <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>
                      {item.label} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={(formulaForm as any)[item.key]}
                      onChange={e => setFormulaForm({ ...formulaForm, [item.key]: e.target.value })}
                      className="bg-transparent text-white text-sm outline-none w-full"
                      placeholder={item.ph}
                    />
                    {item.key === 'code' && codeDuplicateStatus === 'exists' && (
                      <span className="text-[10px] text-red-400 mt-0.5">{t('common.alreadyExists')}</span>
                    )}
                    {item.key === 'code' && codeDuplicateStatus === 'checking' && (
                      <span className="text-[10px] text-slate-500 mt-0.5">...</span>
                    )}
                  </div>
                );
              })}
              <div className="flex flex-col gap-1 w-full text-slate-100">
                <SearchableSelect
                  label={`${t('col.color')}`}
                  value={formulaForm.color}
                  onChange={(v) => setFormulaForm({ ...formulaForm, color: v })}
                  required={requiredFieldsFormula.includes('color')}
                  placeholder={t('common.select')}
                  options={['Black', 'Cyan', 'Magenta', 'Yellow', 'White', 'Varnish'].map(c => ({ value: c, label: c }))}
                />
              </div>
              <div className="flex flex-col gap-1 w-full text-slate-100">
                <SearchableSelect
                  label="Solvent"
                  value={formulaForm.solvent}
                  onChange={(v) => setFormulaForm({ ...formulaForm, solvent: v })}
                  required={requiredFieldsFormula.includes('solvent')}
                  placeholder={t('common.select')}
                  options={['Ethyl Acetate', 'Toluene', 'IPA', 'MEK'].map(s => ({ value: s, label: s }))}
                />
              </div>
            </div>
            <div className={`mt-4 p-4 rounded-lg ${themeConfig.badge}`}>
              <p className={`text-xs font-semibold ${themeConfig.textSecondary} mb-2`}>
                {t('col.labTarget')} {requiredFieldsFormula.includes('labTarget') && <span className="text-red-500">*</span>}
              </p>
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
            {batchError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {batchError}
              </div>
            )}

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
                <div className="flex flex-col gap-1 w-full text-slate-100">
                  <SearchableSelect
                    label={`${t('col.productCode')}`}
                    value={mixProduct}
                    onChange={setMixProduct}
                    required={requiredFieldsBatch.includes('mixProduct')}
                    placeholder={t('common.select')}
                    options={[
                      { value: 'AGH-001', label: 'AGH-001' },
                      { value: 'BKK-002', label: 'BKK-002' },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-1 w-full text-slate-100">
                  <SearchableSelect
                    label={`${t('col.color')}`}
                    value={mixColor}
                    onChange={setMixColor}
                    required={requiredFieldsBatch.includes('mixColor')}
                    placeholder={t('common.select')}
                    options={[
                      { value: 'Black', label: 'Black (BK)' },
                      { value: 'Cyan', label: 'Cyan (CY)' },
                      { value: 'Magenta', label: 'Magenta (MG)' },
                    ]}
                  />
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
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white">{t('ink.fefoRank', { rank: 1 })}</span>
                  </div>
                </div>
                <div className={`${themeConfig.badge} rounded-lg px-3 py-2.5 flex flex-col`}>
                  <label className={`text-[10px] ${themeConfig.textSecondary} font-semibold mb-1`}>
                    {t('ink.weightUsed')} {requiredFieldsBatch.includes('weight') && <span className="text-red-500">*</span>}
                  </label>
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

      {confirmPermanentDeleteFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setConfirmPermanentDeleteFormula(null)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.deletePermanent') || 'Delete Permanently'}</h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              Are you sure you want to permanently delete formula "{confirmPermanentDeleteFormula}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmPermanentDeleteFormula(null)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button
                onClick={handlePermanentDeleteFormula}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
              >
                {t('common.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {emptyFormulaTrashConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setEmptyFormulaTrashConfirm(false)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.emptyTrash') || 'Empty Trash'}</h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              Are you sure you want to empty the formulas trash bin? All deleted formulas will be permanently purged.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEmptyFormulaTrashConfirm(false)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button
                onClick={handleEmptyFormulaTrash}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
              >
                {t('common.delete') || 'Empty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmPermanentDeleteBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setConfirmPermanentDeleteBatch(null)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.deletePermanent') || 'Delete Permanently'}</h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              Are you sure you want to permanently delete batch "{confirmPermanentDeleteBatch}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmPermanentDeleteBatch(null)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button
                onClick={handlePermanentDeleteBatch}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
              >
                {t('common.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {emptyBatchTrashConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setEmptyBatchTrashConfirm(false)}></div>
          <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.emptyTrash') || 'Empty Trash'}</h3>
            <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
              Are you sure you want to empty the batches trash bin? All deleted batches will be permanently purged.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEmptyBatchTrashConfirm(false)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                {t('btn.cancel')}
              </button>
              <button
                onClick={handleEmptyBatchTrash}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
              >
                {t('common.delete') || 'Empty'}
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
              title={`Ink Batch - ${printTarget.data.id}`}
              type="ink"
              fields={[
                { label: 'ID', value: printTarget.data.id },
                { label: 'Formula', value: printTarget.data.formulaCode as string || '—' },
                { label: 'Color', value: printTarget.data.color },
                { label: 'Mix Date', value: printTarget.data.mixDate ? printTarget.data.mixDate as string : '—' },
                { label: 'Expiry', value: printTarget.data.expiryDate },
                { label: 'Weight', value: `${printTarget.data.weight} kg` },
                { label: 'Operator', value: printTarget.data.operator },
              ]}
            />
          </div>
        </div>
      )}

      {/* Batch Formula Status Dialog */}
      <AppDialog
        open={batchFormulaStatusOpen}
        titleKey="ink.changeStatus"
        onClose={() => setBatchFormulaStatusOpen(false)}
      >
        <div className="grid gap-2">
          <p className={`text-sm ${themeConfig.textSecondary} mb-1`}>
            {t('ink.batchFormulaStatusDesc', { count: selectedFormulaIds.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            {['active', 'superseded'].map(s => (
              <button
                key={s}
                onClick={() => handleBatchFormulaStatusChange(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${themeConfig.badge} ${themeConfig.textSecondary} ${themeConfig.panelHover} hover:text-white`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </div>
      </AppDialog>

      {/* Batch Formula Delete Dialog */}
      <ConfirmDialog
        open={batchFormulaDeleteOpen}
        titleKey={showTrashFormulas ? 'common.permanentDelete' : 'common.delete'}
        descriptionKey={showTrashFormulas ? 'ink.batchFormulaDeleteConfirm' : 'ink.batchFormulaDeleteConfirm'}
        onConfirm={handleBatchFormulaDelete}
        onClose={() => setBatchFormulaDeleteOpen(false)}
      />

      {/* Batch Formula Restore Dialog */}
      <ConfirmDialog
        open={batchFormulaRestoreOpen}
        titleKey="common.restore"
        descriptionKey="ink.batchFormulaRestoreConfirm"
        onConfirm={handleBatchFormulaRestore}
        onClose={() => setBatchFormulaRestoreOpen(false)}
      />

      {/* Batch Batches Delete Dialog */}
      <ConfirmDialog
        open={batchBatchesDeleteOpen}
        titleKey={showTrashBatches ? 'common.permanentDelete' : 'common.delete'}
        descriptionKey={showTrashBatches ? 'ink.batchBatchesDeleteConfirm' : 'ink.batchBatchesDeleteConfirm'}
        onConfirm={handleBatchBatchesDelete}
        onClose={() => setBatchBatchesDeleteOpen(false)}
      />

      {/* Batch Batches Restore Dialog */}
      <ConfirmDialog
        open={batchBatchesRestoreOpen}
        titleKey="common.restore"
        descriptionKey="ink.batchBatchesRestoreConfirm"
        onConfirm={handleBatchBatchesRestore}
        onClose={() => setBatchBatchesRestoreOpen(false)}
      />
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
