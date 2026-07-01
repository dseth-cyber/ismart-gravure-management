'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useAuth } from '@/lib/auth/auth-provider';
import { DEFAULT_RGL_LAYOUTS } from '@/lib/dashboard/dashboard-config';
import type { RglLayouts } from '@/lib/dashboard/dashboard-config';
import type { ChartType, DataSource } from '@/lib/dashboard/dashboard-config';
import { DashboardCard } from './dashboard-card';
import { AddCardDrawer } from './add-card-drawer';
import { useExport } from '@/lib/hooks/use-export';
import { ExportButton } from '@/components/shared/export-button';
import { Settings, Check, RotateCcw, Plus, QrCode, X, Save, ChevronDown, Trash2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  fetchDefaultLayout, fetchMyLayout, saveDefaultLayout, saveMyLayout, resetMyLayout,
  listMyLayouts, fetchMyLayoutByName, saveMyLayoutByName, deleteMyLayoutByName,
  saveDefaultLayoutByName, listDefaultLayouts,
} from '@/lib/api/layouts';
import type { LayoutSummary } from '@/lib/api/layouts';

const RGL = dynamic(
  () => import('react-grid-layout/legacy').then((m) => {
    const { WidthProvider, Responsive } = m;
    return WidthProvider(Responsive);
  }),
  { ssr: false }
);

import 'react-grid-layout/css/styles.css';

interface ExtraCardDef {
  id: string;
  titleKey: string;
  chartType: ChartType;
  dataSource: DataSource;
}

const DEFAULT_CARD_DEFS: Record<string, { titleKey: string; chartType: string; dataSource: string }> = {
  'card_cylinders':      { titleKey: 'dash.totalCylinders', chartType: 'stat', dataSource: 'cylinders' },
  'card_inks':           { titleKey: 'dash.activeFormulas', chartType: 'stat', dataSource: 'inks' },
  'card_jobs':           { titleKey: 'dash.activeJobs', chartType: 'stat', dataSource: 'jobs' },
  'card_cylinderStatus': { titleKey: 'dash.cylinderStatus', chartType: 'cylinderStatus', dataSource: 'cylinders' },
  'card_recentJobs':     { titleKey: 'dash.recentJobs', chartType: 'table', dataSource: 'jobs' },
  'card_qc':             { titleKey: 'dash.qcRate', chartType: 'pie', dataSource: 'qc' },
  'card_activity':       { titleKey: 'dash.recentActivity', chartType: 'statusHistory', dataSource: 'jobs' },
  'card_location':       { titleKey: 'dash.cylinderByLocation', chartType: 'location', dataSource: 'cylinders' },
  'card_quickMenu':      { titleKey: 'dash.quickActions', chartType: 'quickMenu', dataSource: 'custom' },
};

export function DashboardGrid() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [layouts, setLayouts] = useLocalStorage<RglLayouts>('gm_rgl_layout', DEFAULT_RGL_LAYOUTS);
  const [extraCards, setExtraCards] = useLocalStorage<ExtraCardDef[]>('gm_extra_cards', []);
  const [cardTitles, setCardTitles] = useLocalStorage<Record<string, string>>('gm_card_titles', {});
  const [cardConfigs, setCardConfigs] = useLocalStorage<Record<string, { chartType: string; dataSource: string }>>('gm_card_config', {});
  const [hiddenCards, setHiddenCards] = useLocalStorage<string[]>('gm_hidden_cards', []);

  const [activeLayoutName, setActiveLayoutName] = useLocalStorage<string | null>('gm_active_layout', null);
  const [savedLayouts, setSavedLayouts] = useState<LayoutSummary[]>([]);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSuperadmin = user?.role === 'superadmin' || user?.role === 'admin';

  const currentData = useMemo(() => ({ layouts, extraCards, cardTitles, cardConfigs, hiddenCards }), [layouts, extraCards, cardTitles, cardConfigs, hiddenCards]);

  // Close menu on outside click
  useEffect(() => {
    if (!showLayoutMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowLayoutMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLayoutMenu]);

  // Auto-save every 2s
  useEffect(() => {
    if (!isClient) return;
    const timer = setTimeout(async () => {
      if (activeLayoutName) {
        await saveMyLayoutByName(activeLayoutName, currentData).catch(() => {});
      } else {
        await saveMyLayout(currentData).catch(() => {});
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentData, isClient, activeLayoutName]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const defaultData = await fetchDefaultLayout();
      if (defaultData) {
        if (defaultData.layouts) localStorage.setItem('gm_default_rgl_layout', JSON.stringify(defaultData.layouts));
        if (defaultData.extraCards) localStorage.setItem('gm_default_extra_cards', JSON.stringify(defaultData.extraCards));
        if (defaultData.cardTitles) localStorage.setItem('gm_default_card_titles', JSON.stringify(defaultData.cardTitles));
        if (defaultData.cardConfigs) localStorage.setItem('gm_default_card_config', JSON.stringify(defaultData.cardConfigs));
        if (defaultData.hiddenCards) localStorage.setItem('gm_default_hidden_cards', JSON.stringify(defaultData.hiddenCards));
      }

      const layoutsList = await listMyLayouts();
      setSavedLayouts(layoutsList);

      const loadedName = localStorage.getItem('gm_active_layout');
      if (loadedName && layoutsList.some((l) => l.name === loadedName)) {
        const myData = await fetchMyLayoutByName(loadedName);
        if (myData) {
          if (myData.layouts) setLayouts(myData.layouts);
          if (myData.extraCards) setExtraCards(myData.extraCards);
          if (myData.cardTitles) setCardTitles(myData.cardTitles);
          if (myData.cardConfigs) setCardConfigs(myData.cardConfigs);
          if (myData.hiddenCards) setHiddenCards(myData.hiddenCards);
          return;
        }
      }

      const myData = await fetchMyLayout();
      if (myData) {
        if (myData.layouts) setLayouts(myData.layouts);
        if (myData.extraCards) setExtraCards(myData.extraCards);
        if (myData.cardTitles) setCardTitles(myData.cardTitles);
        if (myData.cardConfigs) setCardConfigs(myData.cardConfigs);
        if (myData.hiddenCards) setHiddenCards(myData.hiddenCards);
      }
    })();
  }, []);

  const switchToLayout = useCallback(async (name: string | null) => {
    setShowLayoutMenu(false);
    if (name === null) {
      setActiveLayoutName(null);
      const myData = await fetchMyLayout();
      if (myData) {
        if (myData.layouts) setLayouts(myData.layouts);
        if (myData.extraCards) setExtraCards(myData.extraCards);
        if (myData.cardTitles) setCardTitles(myData.cardTitles);
        if (myData.cardConfigs) setCardConfigs(myData.cardConfigs);
        if (myData.hiddenCards) setHiddenCards(myData.hiddenCards);
      } else {
        const defaultData = await fetchDefaultLayout();
        if (defaultData) {
          if (defaultData.layouts) setLayouts(defaultData.layouts);
          if (defaultData.extraCards) setExtraCards(defaultData.extraCards);
          if (defaultData.cardTitles) setCardTitles(defaultData.cardTitles);
          if (defaultData.cardConfigs) setCardConfigs(defaultData.cardConfigs);
          if (defaultData.hiddenCards) setHiddenCards(defaultData.hiddenCards);
        } else {
          setLayouts(DEFAULT_RGL_LAYOUTS);
          setExtraCards([]);
          setCardTitles({});
          setCardConfigs({});
          setHiddenCards([]);
        }
      }
      setToast(t('layout.switchedTo', { name: t('layout.defaultLayout') }));
    } else {
      setActiveLayoutName(name);
      const myData = await fetchMyLayoutByName(name);
      if (myData) {
        if (myData.layouts) setLayouts(myData.layouts);
        if (myData.extraCards) setExtraCards(myData.extraCards);
        if (myData.cardTitles) setCardTitles(myData.cardTitles);
        if (myData.cardConfigs) setCardConfigs(myData.cardConfigs);
        if (myData.hiddenCards) setHiddenCards(myData.hiddenCards);
      }
      setToast(t('layout.switchedTo', { name }));
    }
    setTimeout(() => setToast(null), 2500);
  }, [t, setActiveLayoutName, setLayouts, setExtraCards, setCardTitles, setCardConfigs, setHiddenCards]);

  const handleSaveAs = useCallback(async () => {
    const name = saveAsName.trim();
    if (!name) return;
    await saveMyLayoutByName(name, currentData);
    setSavedLayouts((prev) => {
      const exists = prev.find((l) => l.name === name);
      if (exists) return prev;
      return [{ name, updatedAt: new Date().toISOString() }, ...prev];
    });
    setActiveLayoutName(name);
    setShowSaveAs(false);
    setSaveAsName('');
    setToast(t('layout.savedAs', { name }));
    setTimeout(() => setToast(null), 2500);
  }, [saveAsName, currentData, setActiveLayoutName, t]);

  const handleDeleteLayout = useCallback(async (name: string) => {
    await deleteMyLayoutByName(name);
    setSavedLayouts((prev) => prev.filter((l) => l.name !== name));
    if (activeLayoutName === name) {
      setActiveLayoutName(null);
    }
    setShowLayoutMenu(false);
    setToast(t('layout.deletedLayout', { name }));
    setTimeout(() => setToast(null), 2500);
  }, [activeLayoutName, setActiveLayoutName, t]);

  const mergedCardDefs = useMemo(() => {
    const map = { ...DEFAULT_CARD_DEFS };
    for (const c of extraCards) {
      map[c.id] = { titleKey: c.titleKey, chartType: c.chartType, dataSource: c.dataSource };
    }
    return map;
  }, [extraCards]);

  const handleLayoutChange = useCallback((_layout: any, allLayouts: any) => {
    setLayouts(allLayouts as RglLayouts);
  }, [setLayouts]);

  const removeCard = useCallback((cardId: string) => {
    setLayouts((prev) => {
      const next = { ...prev };
      for (const bp of ['lg', 'md', 'sm'] as const) {
        next[bp] = (next[bp] || []).filter((item) => item.i !== cardId);
      }
      return next;
    });
    if (cardId.startsWith('card_extra_')) {
      setExtraCards((prev) => prev.filter((c) => c.id !== cardId));
    } else {
      setHiddenCards((prev) => [...prev, cardId]);
    }
  }, [setLayouts, setExtraCards, setHiddenCards]);

  const resetLayout = useCallback(async () => {
    try {
      await resetMyLayout();
      const defaultData = await fetchDefaultLayout();
      if (defaultData) {
        if (defaultData.layouts) setLayouts(defaultData.layouts);
        if (defaultData.extraCards) setExtraCards(defaultData.extraCards);
        if (defaultData.cardTitles) setCardTitles(defaultData.cardTitles);
        if (defaultData.cardConfigs) setCardConfigs(defaultData.cardConfigs);
        if (defaultData.hiddenCards) setHiddenCards(defaultData.hiddenCards);
      } else {
        setLayouts(DEFAULT_RGL_LAYOUTS);
        setExtraCards([]);
        setCardTitles({});
        setCardConfigs({});
        setHiddenCards([]);
      }
    } catch {
      const saved = localStorage.getItem('gm_default_rgl_layout');
      if (saved) {
        try { setLayouts(JSON.parse(saved)); } catch { setLayouts(DEFAULT_RGL_LAYOUTS); }
      } else {
        setLayouts(DEFAULT_RGL_LAYOUTS);
      }
      const savedExtra = localStorage.getItem('gm_default_extra_cards');
      if (savedExtra) {
        try { setExtraCards(JSON.parse(savedExtra)); } catch { setExtraCards([]); }
      } else {
        setExtraCards([]);
      }
      setCardTitles({});
      setCardConfigs({});
      setHiddenCards([]);
    }
    setActiveLayoutName(null);
    setToast(t('layout.resetDone'));
    setTimeout(() => setToast(null), 2500);
  }, [setLayouts, setExtraCards, setCardTitles, setCardConfigs, setHiddenCards, setActiveLayoutName, t]);

  const saveAsDefault = useCallback(() => {
    const data = { layouts, extraCards, cardTitles, cardConfigs, hiddenCards };
    localStorage.setItem('gm_default_rgl_layout', JSON.stringify(layouts));
    localStorage.setItem('gm_default_extra_cards', JSON.stringify(extraCards));
    localStorage.setItem('gm_default_card_titles', JSON.stringify(cardTitles));
    localStorage.setItem('gm_default_card_config', JSON.stringify(cardConfigs));
    localStorage.setItem('gm_default_hidden_cards', JSON.stringify(hiddenCards));
    saveDefaultLayout(data).catch(() => {});
    setToast(t('layout.savedDefault'));
    setTimeout(() => setToast(null), 2500);
  }, [layouts, extraCards, cardTitles, cardConfigs, hiddenCards, t]);

  const addCard = useCallback((chartType: ChartType, dataSource: DataSource, _colSpan: number, _rowSpan: number) => {
    const id = `card_extra_${Date.now()}`;
    const def: ExtraCardDef = { id, titleKey: `chart.${chartType}`, chartType, dataSource };
    setExtraCards((prev) => [...prev, def]);
    setLayouts((prev) => {
      const next = { ...prev };
      for (const bp of ['lg', 'md', 'sm'] as const) {
        const items = next[bp] || [];
        const maxY = items.reduce((m, item) => Math.max(m, item.y + item.h), 0);
        next[bp] = [...items, { i: id, x: 0, y: maxY, w: 4, h: 3, minW: 2, minH: 2 }];
      }
      return next;
    });
  }, [setExtraCards, setLayouts]);

  const handleTitleChange = useCallback((cardId: string, title: string) => {
    setCardTitles((prev) => ({ ...prev, [cardId]: title }));
  }, [setCardTitles]);

  const handleConfigChange = useCallback((cardId: string, chartType: string, dataSource: string) => {
    setCardConfigs((prev) => ({ ...prev, [cardId]: { chartType, dataSource } }));
  }, [setCardConfigs]);

  const { exportImage, captureRef } = useExport();

  const visibleCardIds = useMemo(() =>
    Object.keys(mergedCardDefs).filter((id) => !hiddenCards.includes(id)),
    [mergedCardDefs, hiddenCards]
  );

  const processedLayouts = useMemo(() => {
    const next = { ...layouts };
    for (const bp of ['lg', 'md', 'sm'] as const) {
      if (next[bp]) {
        next[bp] = next[bp]
          .filter((item) => visibleCardIds.includes(item.i))
          .map((item) => {
            const defaultItem = DEFAULT_RGL_LAYOUTS[bp]?.find((d) => d.i === item.i);
            return {
              ...item,
              minW: defaultItem ? defaultItem.minW : item.minW ?? 2,
              minH: defaultItem ? defaultItem.minH : item.minH ?? 2,
            };
          });
      }
    }
    return next;
  }, [layouts, visibleCardIds]);

  return (
    <div className="relative" ref={captureRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className={`text-[10px] font-bold tracking-widest uppercase ${themeConfig.primaryText}`}>
            OVERVIEW · {t('app.subtitle')}
          </p>
          <h1 className={`text-2xl font-black mt-1 ${themeConfig.textPrimary}`}>{t('dash.title')}</h1>
        </div>

        {isClient && (
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <>
                <button
                  onClick={() => setShowAddDrawer(true)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${themeConfig.border} hover:bg-white/5 ${themeConfig.textPrimary}`}
                >
                  <Plus size={13} />
                  {t('layout.addCard')}
                </button>
                <button
                  onClick={resetLayout}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent bg-white/5 hover:bg-white/10 ${themeConfig.textPrimary}`}
                >
                  <RotateCcw size={13} />
                  {t('layout.reset')}
                </button>
                {isSuperadmin && (
                  <button
                    onClick={saveAsDefault}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent bg-amber-500/20 hover:bg-amber-500/30 text-amber-300`}
                  >
                    <Save size={13} />
                    {t('layout.saveDefault')}
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(false)}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition text-white ${themeConfig.primaryButton}`}
                >
                  <Check size={13} />
                  {t('layout.done')}
                </button>
              </>
            ) : (
              <>
                {/* Layout selector */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowLayoutMenu((v) => !v)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${themeConfig.border} hover:bg-white/5 ${themeConfig.textPrimary}`}
                  >
                    <LayoutDashboard size={13} />
                    {activeLayoutName || t('layout.defaultLayout')}
                    <ChevronDown size={11} />
                  </button>
                  {showLayoutMenu && (
                    <div className={`absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border ${themeConfig.border} backdrop-blur-xl shadow-2xl py-1`}
                      style={{ backgroundColor: 'rgba(15,23,42,0.95)' }}
                    >
                      <div className={`px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase ${themeConfig.textSecondary}`}>
                        {t('layout.selectLayout')}
                      </div>
                      <button
                        onClick={() => switchToLayout(null)}
                        className={`w-full text-left px-3 py-1.5 text-xs transition hover:bg-white/5 flex items-center gap-2 ${!activeLayoutName ? 'text-cyan-400' : themeConfig.textPrimary}`}
                      >
                        {!activeLayoutName && <Check size={11} />}
                        <span className={!activeLayoutName ? 'ml-0' : 'ml-[19px]'}>{t('layout.defaultLayout')}</span>
                      </button>
                      {savedLayouts.map((l) => (
                        <div key={l.name} className="group flex items-center">
                          <button
                            onClick={() => switchToLayout(l.name)}
                            className={`flex-1 text-left px-3 py-1.5 text-xs transition hover:bg-white/5 flex items-center gap-2 ${activeLayoutName === l.name ? 'text-cyan-400' : themeConfig.textPrimary}`}
                          >
                            {activeLayoutName === l.name && <Check size={11} />}
                            <span className={activeLayoutName === l.name ? 'ml-0' : 'ml-[19px]'}>{l.name}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLayout(l.name)}
                            className="px-2 py-1.5 text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition"
                            title={t('layout.deleteLayout')}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <div className={`border-t ${themeConfig.border} mt-1 pt-1`}>
                        <button
                          onClick={() => { setShowLayoutMenu(false); setShowSaveAs(true); setSaveAsName(''); }}
                          className={`w-full text-left px-3 py-1.5 text-xs transition hover:bg-white/5 ${themeConfig.textPrimary} flex items-center gap-2`}
                        >
                          <Save size={11} />
                          {t('layout.saveAs')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent bg-white/5 hover:bg-white/10 ${themeConfig.textPrimary}`}
                >
                  <Settings size={13} />
                  {t('layout.customize')}
                </button>
                <ExportButton
                  showImage={true}
                  onExportImage={() => {
                    const el = captureRef.current;
                    if (el) exportImage(el, 'dashboard-overview');
                  }}
                  className="inline-flex"
                />
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

      {isEditing && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-xs font-semibold border ${themeConfig.border}`}
          style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}
        >
          {t('layout.editing')} — {t('layout.dragHint')}
        </div>
      )}

      {isClient && (
        <RGL
          className="layout"
          layouts={processedLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={80}
          margin={[12, 12]}
          isDraggable={isEditing}
          isResizable={isEditing}
          resizeHandles={['se']}
          draggableHandle=".drag-handle"
          compactType="vertical"
          onLayoutChange={handleLayoutChange}
        >
          {visibleCardIds.map((id) => {
            const def = mergedCardDefs[id];
            if (!def) return null;
            return (
              <div key={id} className="relative group">
                {isEditing && (
                  <button
                    onClick={() => removeCard(id)}
                    className="absolute -top-2 -right-2 z-50 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center shadow-lg transition-opacity"
                    title={t('layout.removeCard')}
                  >
                    <X size={11} />
                  </button>
                )}
                <DashboardCard
                  cardId={id}
                  titleKey={def.titleKey}
                  chartType={cardConfigs[id]?.chartType || def.chartType}
                  dataSource={cardConfigs[id]?.dataSource || def.dataSource}
                  customTitle={cardTitles[id] || undefined}
                  isEditing={isEditing}
                  onTitleChange={(title) => handleTitleChange(id, title)}
                  onConfigChange={(ct, ds) => handleConfigChange(id, ct, ds)}
                />
              </div>
            );
          })}
        </RGL>
      )}

      <AddCardDrawer isOpen={showAddDrawer} onClose={() => setShowAddDrawer(false)} onAddCard={addCard} />

      {/* Save As dialog */}
      {showSaveAs && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-xl border ${themeConfig.border} p-6 w-full max-w-sm shadow-2xl`}
            style={{ backgroundColor: 'rgba(15,23,42,0.95)' }}
          >
            <h3 className={`text-base font-bold mb-4 ${themeConfig.textPrimary}`}>{t('layout.saveAsTitle')}</h3>
            <input
              autoFocus
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAs(); }}
              placeholder={t('layout.enterName')}
              className={`w-full px-3 py-2 rounded-lg text-sm border ${themeConfig.border} bg-white/5 ${themeConfig.textPrimary} placeholder:text-gray-500 outline-none focus:border-cyan-500 transition`}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSaveAs(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition border ${themeConfig.border} hover:bg-white/5 ${themeConfig.textPrimary}`}
              >
                {t('btn.cancel')}
              </button>
              <button
                onClick={handleSaveAs}
                disabled={!saveAsName.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40"
              >
                {t('layout.saveAs')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}

      <style>{`
        .react-grid-item > .react-resizable-handle {
          opacity: 0.6 !important;
        }
        .react-grid-item > .react-resizable-handle::after {
          border-right-color: rgba(34,211,238,0.8) !important;
          border-bottom-color: rgba(34,211,238,0.8) !important;
        }
      `}</style>
    </div>
  );
}