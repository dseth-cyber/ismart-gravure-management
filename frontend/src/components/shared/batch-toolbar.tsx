'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Square, Trash2, RotateCcw } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-provider';

type BatchAction = {
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'warning';
  onClick: (selectedIds: string[]) => void;
  showWhenTrash?: boolean;
};

type BatchToolbarProps<T extends { id: string }> = {
  items: T[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  getId?: (item: T) => string;
  actions?: BatchAction[];
  showTrash?: boolean;
};

export function BatchToolbar<T extends { id: string }>({
  items,
  selectedIds,
  onSelectionChange,
  getId,
  actions = [],
  showTrash = false,
}: BatchToolbarProps<T>) {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();

  const visibleActions = actions.filter(a => a.showWhenTrash === undefined || a.showWhenTrash === showTrash);

  const allVisibleIds = items.map(item => (getId ? getId(item) : item.id));
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleToggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allVisibleIds);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-3 ${themeConfig.badge}`}>
      <button
        onClick={handleToggleAll}
        className={`flex items-center gap-1.5 text-xs font-medium ${themeConfig.textSecondary} ${themeConfig.panelHover} px-2 py-1 rounded transition-colors`}
      >
        {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
        <span>{allSelected ? t('common.deselectAll') : t('common.selectAll')}</span>
      </button>

      {selectedIds.length > 0 && (
        <>
          <span className={`text-xs ${themeConfig.textSecondary} border-l ${themeConfig.border} pl-2`}>
            {selectedIds.length} {t('common.selected')}
          </span>
          <div className="flex items-center gap-1 ml-1">
            {visibleActions.map((action, i) => {
              const variantStyles: Record<string, string> = {
                primary: `${themeConfig.primaryBg} text-white hover:opacity-90`,
                danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
                warning: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
              };
              const baseStyle = variantStyles[action.variant || 'primary'];
              return (
                <button
                  key={i}
                  onClick={() => action.onClick(selectedIds)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${baseStyle}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

type BatchSelectAllCheckboxProps = {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
};

export function BatchSelectAllCheckbox({ checked, indeterminate, onChange }: BatchSelectAllCheckboxProps) {
  const { themeConfig } = useTheme();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`p-1 rounded ${themeConfig.panelHover} ${themeConfig.textSecondary}`}
    >
      {checked ? <CheckSquare size={14} /> : indeterminate ? <Square size={14} className="opacity-50" /> : <Square size={14} />}
    </button>
  );
}

type BatchRowCheckboxProps = {
  checked: boolean;
  onChange: () => void;
};

export function BatchRowCheckbox({ checked, onChange }: BatchRowCheckboxProps) {
  const { themeConfig } = useTheme();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`p-1 rounded ${themeConfig.panelHover} ${themeConfig.textSecondary}`}
    >
      {checked ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
    </button>
  );
}
