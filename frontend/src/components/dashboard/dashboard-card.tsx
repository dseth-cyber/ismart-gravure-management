'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/theme-provider';
import { ChartFactory } from '@/components/charts/chart-factory';
import { GripVertical } from 'lucide-react';

interface Props {
  cardId: string;
  titleKey: string;
  chartType: string;
  dataSource: string;
  customTitle?: string;
  isEditing: boolean;
  onTitleChange?: (title: string) => void;
}

export function DashboardCard({ cardId: _id, titleKey, chartType, dataSource, customTitle, isEditing, onTitleChange }: Props) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
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
          <div className="drag-handle p-1 rounded hover:bg-white/10 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 ml-2">
            <GripVertical size={14} />
          </div>
        )}
      </div>

      <div className="flex-1 px-3 pb-3 min-h-0">
        <ChartFactory chartType={chartType} dataSource={dataSource} height={200} />
      </div>
    </div>
  );
}
