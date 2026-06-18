'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/lib/theme/theme-provider';
import { Search } from 'lucide-react';

interface PermissionItem {
  id: string;
  name: string;
  module: string;
}

interface PermissionSelectorProps {
  permissions: PermissionItem[];
  overrides: Record<string, string>;
  onChange: (overrides: Record<string, string>) => void;
}

export function PermissionSelector({ permissions, overrides, onChange }: PermissionSelectorProps) {
  const { themeConfig } = useTheme();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const modules = useMemo(() => {
    const m = new Set(permissions.map(p => p.module));
    return [...m].sort();
  }, [permissions]);

  const filtered = useMemo(() => {
    return permissions.filter(p => {
      if (moduleFilter && p.module !== moduleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.module.toLowerCase().includes(q);
      }
      return true;
    });
  }, [permissions, search, moduleFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, PermissionItem[]> = {};
    filtered.forEach(p => {
      if (!g[p.module]) g[p.module] = [];
      g[p.module].push(p);
    });
    return g;
  }, [filtered]);

  const toggle = (id: string) => {
    const next = { ...overrides };
    if (next[id] === 'grant') delete next[id];
    else next[id] = 'grant';
    onChange(next);
  };

  const toggleModule = (module: string, grant: boolean) => {
    const next = { ...overrides };
    const modPerms = permissions.filter(p => p.module === module);
    modPerms.forEach(p => {
      if (grant) next[p.id] = 'grant';
      else delete next[p.id];
    });
    onChange(next);
  };

  const moduleAllGranted = (module: string) => {
    const modPerms = permissions.filter(p => p.module === module);
    return modPerms.length > 0 && modPerms.every(p => overrides[p.id] === 'grant');
  };

  const grantedCount = Object.values(overrides).filter(v => v === 'grant').length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search permissions..."
            className={`w-full rounded border pl-6 pr-2 py-1 text-xs ${themeConfig.border} ${themeConfig.panel}`}
          />
        </div>
        {modules.length > 0 && (
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className={`rounded border px-2 py-1 text-xs ${themeConfig.border} ${themeConfig.panel}`}
          >
            <option value="">All Modules</option>
            {modules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border p-2 space-y-2" style={{ borderColor: 'var(--border-color, rgba(255,255,255,0.1))' }}>
        {permissions.length === 0 ? (
          <p className={`text-xs text-center py-4 ${themeConfig.textMuted}`}>No permissions loaded</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className={`text-xs text-center py-4 ${themeConfig.textMuted}`}>No matching permissions</p>
        ) : (
          Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <div className="flex items-center justify-between mb-1 px-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moduleAllGranted(module)}
                    onChange={e => toggleModule(module, e.target.checked)}
                    className="h-3 w-3"
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.textSecondary}`}>
                    {module} ({perms.length})
                  </span>
                </label>
                {moduleAllGranted(module) && (
                  <button
                    type="button"
                    onClick={() => toggleModule(module, false)}
                    className="text-[10px] text-red-400 hover:text-red-300 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-0.5 pl-1">
                {perms.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-xs py-[1px]">
                    <input
                      type="checkbox"
                      checked={overrides[p.id] === 'grant'}
                      onChange={() => toggle(p.id)}
                      className="h-3 w-3"
                    />
                    <span className="flex-1">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
