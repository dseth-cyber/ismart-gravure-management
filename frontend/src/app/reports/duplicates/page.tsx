'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Fuse from 'fuse.js';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { useTheme } from '@/lib/theme/theme-provider';
import { listCylinders } from '@/lib/services/cylinder';
import { listFormulas, listBatches } from '@/lib/services/ink';
import { listMasterData } from '@/lib/services/master-data';
import { apiClient } from '@/lib/api/client';
import { AlertTriangle, Check, Search, ShieldAlert } from 'lucide-react';

interface DuplicateGroup {
  entity: string;
  field: string;
  items: { id: string; label: string; score: number }[];
}

function findDuplicates(data: any[], keys: string[], threshold = 0.4): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const used = new Set<number>();

  const fuse = new Fuse(data, {
    keys,
    threshold,
    distance: 100,
    includeScore: true,
    minMatchCharLength: 2,
  });

  for (let i = 0; i < data.length; i++) {
    if (used.has(i)) continue;
    const item = data[i];
    const label = keys.map(k => item[k] || '').join(' ');
    const results = fuse.search(label);
    const matches = results
      .filter(r => r.item !== item && !used.has(data.indexOf(r.item)) && typeof r.score === 'number' && r.score < threshold)
      .map(r => ({ id: String(r.item.id || r.item.code || r.item._id || ''), label: keys.map(k => r.item[k] || '').join(' '), score: Math.round((1 - (r.score ?? 1)) * 100) }));

    if (matches.length > 0) {
      groups.push({
        entity: keys[0],
        field: keys.join(', '),
        items: [{ id: String(item.id || item.code || ''), label, score: 100 }, ...matches],
      });
      used.add(i);
      matches.forEach(() => { /* skip — already tracked */ });
    }
  }
  return groups;
}

const ENTITY_CONFIGS = [
  { key: 'masterDataStatus', label: 'Master Data — Status', queryKey: ['masterDataStatus'], fetch: () => listMasterData('status', false).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['name', 'nameTh'] },
  { key: 'masterDataCylinderType', label: 'Master Data — Cylinder Type', queryKey: ['masterDataCylinderType'], fetch: () => listMasterData('cylinderType', false).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['name', 'nameTh'] },
  { key: 'masterDataDefectType', label: 'Master Data — Defect Type', queryKey: ['masterDataDefectType'], fetch: () => listMasterData('defectType', false).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['name', 'nameTh'] },
  { key: 'masterDataMachine', label: 'Master Data — Machine', queryKey: ['masterDataMachine'], fetch: () => listMasterData('machine', false).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['name', 'nameTh'] },
  { key: 'masterDataRack', label: 'Master Data — Rack', queryKey: ['masterDataRack'], fetch: () => listMasterData('rack', false).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['name', 'nameTh'] },
  { key: 'masterDataSupplier', label: 'Master Data — Supplier', queryKey: ['masterDataSupplier'], fetch: () => listMasterData('supplier', false).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['name', 'nameTh'] },
  { key: 'masterDataInkType', label: 'Master Data — Ink Type', queryKey: ['masterDataInkType'], fetch: () => listMasterData('inkType', false).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['name', 'nameTh'] },
  { key: 'masterDataSolvent', label: 'Master Data — Solvent', queryKey: ['masterDataSolvent'], fetch: () => listMasterData('solvent', false).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['name', 'nameTh'] },
  { key: 'cylinders', label: 'Cylinders', queryKey: ['cylinders'], fetch: () => listCylinders({}).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['id'] },
  { key: 'formulas', label: 'Ink Formulas', queryKey: ['formulas'], fetch: () => listFormulas({}).then(d => d.map(i => ({ ...i, _id: i.code }))), keys: ['code'] },
  { key: 'batches', label: 'Ink Batches', queryKey: ['batches'], fetch: () => listBatches({}).then(d => d.map(i => ({ ...i, _id: i.id }))), keys: ['id'] },
  { key: 'products', label: 'Products', queryKey: ['allProducts'], fetch: () => apiClient.get('/api/v1/products').then(r => (r.data.data || []).map((i: any) => ({ ...i, _id: i.code }))), keys: ['code', 'name'] },
  { key: 'customers', label: 'Customers', queryKey: ['allCustomers'], fetch: () => apiClient.get('/api/v1/customers').then(r => (r.data.data || []).map((i: any) => ({ ...i, _id: i.code }))), keys: ['code', 'name'] },
];

export default function DuplicateReportPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [threshold, setThreshold] = useState(0.4);
  const [hideIgnored, setHideIgnored] = useState(true);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());

  const queries = ENTITY_CONFIGS.map(cfg => ({
    ...cfg,
    query: useQuery({
      queryKey: cfg.queryKey,
      queryFn: cfg.fetch,
      staleTime: 60000,
      retry: 1,
    }),
  }));

  const allDuplicates = useMemo(() => {
    const all: { entity: string; field: string; label: string; items: DuplicateGroup['items'] }[] = [];
    for (const q of queries) {
      if (!q.query.data) continue;
      const groups = findDuplicates(q.query.data, q.keys, threshold);
      for (const g of groups) {
        all.push({ entity: q.label, field: g.field, label: `${q.label}: ${g.items.map(i => i.label).join(' ~ ')}`, items: g.items });
      }
    }
    return all;
  }, [queries, threshold]);

  const visibleDuplicates = useMemo(() => {
    if (!hideIgnored) return allDuplicates;
    return allDuplicates.filter(d => !ignored.has(d.label));
  }, [allDuplicates, hideIgnored, ignored]);

  const totalDuplicates = allDuplicates.length;

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader
          titleKey="Duplicate Report"
          subtitleKey="Fuzzy matching scan across all entities"
          actions={
            <div className="flex items-center gap-3">
              <label className={`text-xs font-bold ${themeConfig.textSecondary}`}>
                Threshold: {(threshold * 100).toFixed(0)}%
                <input type="range" min="10" max="80" value={threshold * 100} onChange={e => setThreshold(parseInt(e.target.value) / 100)} className="ml-2 w-20" />
              </label>
              <label className={`text-xs flex items-center gap-1 ${themeConfig.textSecondary}`}>
                <input type="checkbox" checked={hideIgnored} onChange={e => setHideIgnored(e.target.checked)} />
                Hide ignored
              </label>
            </div>
          }
        />

        <div className={`rounded-xl p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="text-amber-400" size={20} />
            <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>
              Potential Duplicates: {totalDuplicates}
            </h3>
          </div>

          {queries.some(q => q.query.isLoading) && (
            <div className={`text-center py-8 text-sm ${themeConfig.textMuted}`}>Scanning data...</div>
          )}

          {!queries.some(q => q.query.isLoading) && visibleDuplicates.length === 0 && (
            <div className={`text-center py-8 text-sm ${themeConfig.textMuted}`}>
              <Check size={32} className="mx-auto mb-2 text-emerald-400" />
              No potential duplicates found
            </div>
          )}

          <div className="space-y-3">
            {visibleDuplicates.map((dup, idx) => (
              <div key={idx} className={`rounded-lg border p-4 ${themeConfig.border} ${themeConfig.badge}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-[10px] font-bold uppercase ${themeConfig.textMuted}`}>{dup.entity}</span>
                    <p className={`text-sm font-bold ${themeConfig.textPrimary} mt-0.5`}>{dup.field}</p>
                  </div>
                  <button
                    onClick={() => { const s = new Set(ignored); s.add(dup.label); setIgnored(s); }}
                    className={`p-1 rounded hover:bg-white/10 ${themeConfig.textMuted}`}
                    title="Ignore"
                  >
                    <AlertTriangle size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dup.items.map((item, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${i === 0 ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>
                      <Search size={10} />
                      <span>{item.label}</span>
                      {i > 0 && <span className="opacity-60">({item.score}%)</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
