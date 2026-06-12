'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { ChartFactory } from '@/components/charts/chart-factory';
import type { ChartType } from '@/lib/dashboard/dashboard-config';
import { GripVertical, Settings } from 'lucide-react';

interface Props {
  cardId: string;
  titleKey: string;
  chartType: string;
  dataSource: string;
  customTitle?: string;
  isEditing: boolean;
  onTitleChange?: (title: string) => void;
  onConfigChange?: (chartType: string, dataSource: string) => void;
}

const CHART_OPTIONS = ['timeSeries', 'bar', 'stat', 'gauge', 'barGauge', 'table', 'pie', 'stateTimeline', 'heatmap', 'statusHistory', 'histogram', 'text', 'alertList', 'dashboardList', 'cylinderStatus', 'activityFeed', 'location'] as const;
const DATA_OPTIONS = ['cylinders', 'inks', 'jobs', 'qc', 'production', 'alerts', 'inventory', 'custom'] as const;

export function DashboardCard({ cardId: _id, titleKey, chartType: initChart, dataSource: initSource, customTitle, isEditing, onTitleChange, onConfigChange }: Props) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const displayTitle = customTitle || t(titleKey as any) || titleKey;

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  return (
    <div className={`rounded-xl overflow-hidden ${themeConfig.panel} ${themeConfig.shadow} h-full flex flex-col ${isEditing ? 'ring-1 ring-white/10' : ''}`}>
      <div className={`flex items-center justify-between px-3 pt-2.5 pb-1 ${isEditing ? 'select-none' : ''}`}>
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              setEditingTitle(false);
              if (titleDraft.trim() && titleDraft !== displayTitle && onTitleChange) {
                onTitleChange(titleDraft.trim());
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            className={`flex-1 text-sm font-bold bg-transparent border-b outline-none px-0 py-0 ${themeConfig.textPrimary} ${themeConfig.border}`}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className={`text-sm font-bold ${themeConfig.textPrimary} truncate ${isEditing ? 'cursor-pointer hover:opacity-70' : ''}`}
            onDoubleClick={isEditing ? () => { setTitleDraft(displayTitle); setEditingTitle(true); } : undefined}
          >
            {displayTitle}
          </h3>
        )}
        {isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 rounded hover:bg-white/10 text-gray-400"
            >
              <Settings size={13} />
            </button>
            <div className="drag-handle p-1 rounded hover:bg-white/10 text-gray-400 cursor-grab active:cursor-grabbing">
              <GripVertical size={14} />
            </div>
          </div>
        )}
      </div>

      {isEditing && showConfig && (
        <div className={`mx-3 mb-2 p-2 rounded-lg ${themeConfig.badge} border ${themeConfig.border}`}>
          <div className="flex gap-2 items-center text-xs">
            <span className="opacity-60">Type:</span>
            <select
              value={initChart}
              onChange={(e) => onConfigChange?.(e.target.value, initSource)}
              style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: '#e2e8f0' }}
              className="text-xs rounded px-1.5 py-1 border border-white/20 outline-none"
            >
              {CHART_OPTIONS.map((ct) => (
                <option key={ct} value={ct} style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>
                  {t(`chart.${ct}` as any)}
                </option>
              ))}
            </select>
            <span className="opacity-60 ml-2">Source:</span>
            <select
              value={initSource}
              onChange={(e) => onConfigChange?.(initChart, e.target.value)}
              style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: '#e2e8f0' }}
              className="text-xs rounded px-1.5 py-1 border border-white/20 outline-none"
            >
              {DATA_OPTIONS.map((ds) => (
                <option key={ds} value={ds} style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>{t(`ds.${ds}` as any)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex-1 px-3 pb-3 min-h-0">
        <ChartFactory chartType={initChart as ChartType} dataSource={initSource} height={200} />
      </div>
    </div>
  );
}
