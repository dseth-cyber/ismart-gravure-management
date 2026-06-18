'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { AppButton } from '@/components/shared/app-button';
import { useTheme } from '@/lib/theme/theme-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { apiClient } from '@/lib/api/client';
import { Eye, EyeOff, Save, Eye as EyeIcon, EyeOff as EyeOffIcon, Check } from 'lucide-react';

const SECTIONS = ['password', 'session', 'menu'] as const;

const MENU_GROUPS = [
  { key: 'overview', label: 'Dashboard (Overview)' },
  { key: 'cylinder', label: 'Cylinder' },
  { key: 'ink', label: 'Ink' },
  { key: 'production', label: 'Production' },
  { key: 'system', label: 'System / Settings' },
  { key: 'progress', label: 'Progress (Roadmap)' },
];

export default function SystemSettingsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const { user, changePassword } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('password');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Menu visibility state
  const [menuVis, setMenuVis] = useState<Record<string, Record<string, 'show' | 'hide'>>>({});
  const [menuVisDirty, setMenuVisDirty] = useState(false);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [roles, setRoles] = useState<string[]>([]);
  const [menuSaving, setMenuSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gm_roles');
    if (stored) {
      try { setRoles(JSON.parse(stored)); } catch { setRoles(['admin', 'viewer', 'operator', 'supervisor', 'qa_manager', 'plant_manager', 'production_manager', 'qa_supervisor']); }
    } else {
      setRoles(['admin', 'viewer', 'operator', 'supervisor', 'qa_manager', 'plant_manager', 'production_manager', 'qa_supervisor']);
    }
  }, []);

  useEffect(() => {
    apiClient.get('/api/v1/settings')
      .then(res => {
        if (res.data?.status === 'success' && res.data.data) {
          const mv = res.data.data.find((s: any) => s.key === 'menu_visibility');
          if (mv?.value) {
            try { setMenuVis(JSON.parse(mv.value)); } catch {}
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleMenuGroup = (role: string, groupKey: string) => {
    setMenuVis(prev => {
      const current: 'show' | 'hide' | undefined = prev[role]?.[groupKey];
      const nextVal: 'show' | 'hide' = current === 'hide' ? 'show' : 'hide';
      return { ...prev, [role]: { ...prev[role], [groupKey]: nextVal } };
    });
    setMenuVisDirty(true);
  };

  const saveMenuVisibility = async () => {
    setMenuSaving(true);
    try {
      await apiClient.put('/api/v1/settings', { key: 'menu_visibility', value: JSON.stringify(menuVis) });
      setMsg('Menu visibility saved successfully');
      setMenuVisDirty(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save menu visibility');
    }
    setMenuSaving(false);
  };

  const resetMenuVisibility = () => {
    setMenuVis({});
    setMenuVisDirty(true);
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const current = (form.currentPassword as any).value;
    const newPw = (form.newPassword as any).value;
    const confirm = (form.confirmPassword as any).value;
    if (newPw !== confirm) { setError(t('settings.pwMismatch')); return; }
    try {
      await changePassword(current, newPw);
      setMsg(t('settings.pwChanged'));
    } catch (err: any) {
      setError(err?.response?.data?.message || t('settings.pwError'));
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader titleKey="settings.system" subtitleKey="settings.systemDesc" />

        {msg && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">{msg}</div>}
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

        <div className="flex gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setActiveSection(s); setMsg(''); setError(''); }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeSection === s ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : `${themeConfig.panel} ${themeConfig.textPrimary} border ${themeConfig.border}`
              }`}
            >
              {t(`settings.${s}`)}
            </button>
          ))}
        </div>

        {activeSection === 'password' && (
          <form onSubmit={handleChangePassword} className={`max-w-lg space-y-4 rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.currentPw')}</label>
              <div className="relative mt-1">
                <input name="currentPassword" type={showPw ? 'text' : 'password'} required className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-gray-400">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.newPw')}</label>
              <input name="newPassword" type="password" required minLength={8} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.confirmPw')}</label>
              <input name="confirmPassword" type="password" required minLength={8} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <AppButton variant="primary" type="submit">
              <Save className="mr-1.5 h-4 w-4" /> {t('common.save')}
            </AppButton>
          </form>
        )}

        {activeSection === 'session' && (
          <div className={`max-w-lg space-y-4 rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
            <div className={`rounded-lg border p-4 ${themeConfig.border}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.loggedInAs')}</p>
              <p className={`mt-1 text-lg font-bold ${themeConfig.textPrimary}`}>{user?.username || '-'}</p>
            </div>
            <div className={`rounded-lg border p-4 ${themeConfig.border}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.role')}</p>
              <p className={`mt-1 text-lg font-bold ${themeConfig.textPrimary}`}>{user?.role || '-'}</p>
            </div>
            <div className={`rounded-lg border p-4 ${themeConfig.border}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.memberSince')}</p>
              <p className={`mt-1 text-lg font-bold ${themeConfig.textPrimary}`}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        )}

        {activeSection === 'menu' && (
          <div className={`space-y-4 rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-white/10">
              <div>
                <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>Menu Visibility</h3>
                <p className={`text-xs ${themeConfig.textMuted}`}>Override sidebar menu visibility per role (default = show based on permissions)</p>
              </div>
              <div className="flex gap-2">
                <AppButton variant="secondary" onClick={resetMenuVisibility} disabled={!menuVisDirty}>
                  Reset to Defaults
                </AppButton>
                <AppButton variant="primary" onClick={saveMenuVisibility} disabled={!menuVisDirty || menuSaving}>
                  {menuSaving ? 'Saving...' : <><Save className="mr-1.5 h-4 w-4" /> Save</>}
                </AppButton>
              </div>
            </div>

            {/* Role selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    selectedRole === role
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow'
                      : `${themeConfig.border} ${themeConfig.badge} ${themeConfig.panelHover} ${themeConfig.textSecondary}`
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Menu group toggles for selected role */}
            <div className="space-y-2">
              {MENU_GROUPS.map(group => {
                const current = menuVis[selectedRole]?.[group.key];
                const isHidden = current === 'hide';
                return (
                  <div
                    key={group.key}
                    className={`flex items-center justify-between p-3 rounded-lg border transition ${
                      isHidden ? 'opacity-50 border-red-500/20 bg-red-500/5' : `${themeConfig.border} ${themeConfig.badge}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isHidden ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <span className={`text-sm font-semibold ${themeConfig.textPrimary}`}>{group.label}</span>
                      {isHidden && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleMenuGroup(selectedRole, group.key)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        isHidden ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        isHidden ? 'left-0.5' : 'left-6.5'
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
