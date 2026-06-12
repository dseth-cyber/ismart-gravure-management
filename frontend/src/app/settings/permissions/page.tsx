'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { AppButton } from '@/components/shared/app-button';
import { AppDialog } from '@/components/shared/app-dialog';
import { StatusBadge, type StatusKind } from '@/components/shared/status-badge';
import { useTheme } from '@/lib/theme/theme-provider';
import { apiClient } from '@/lib/api/client';
import { Plus, Trash2, Check, X, Shield, Globe } from 'lucide-react';

const ROLES = ['admin', 'sales', 'planner', 'production', 'qc', 'warehouse', 'inkroom', 'viewer'] as const;

type TabId = 'permissions' | 'role-perms' | 'overrides' | 'scopes';

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

interface UserInfo {
  id: string;
  username: string;
  role: string;
}

interface Scope {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
}

export default function PermissionsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('permissions');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Permissions tab
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permLoading, setPermLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Role permissions tab
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [rolePerms, setRolePerms] = useState<Permission[]>([]);
  const [availPerms, setAvailPerms] = useState<Permission[]>([]);
  const [rolePermLoading, setRolePermLoading] = useState(false);

  // User overrides tab
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userPerms, setUserPerms] = useState<any[]>([]);
  const [overridePerms, setOverridePerms] = useState<Permission[]>([]);
  const [selectedGrantPerm, setSelectedGrantPerm] = useState('');

  // Scopes tab
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [addScopeDialogOpen, setAddScopeDialogOpen] = useState(false);
  const [assignScopeDialogOpen, setAssignScopeDialogOpen] = useState(false);
  const [scopeAssignUser, setScopeAssignUser] = useState('');
  const [scopeAssignId, setScopeAssignId] = useState('');

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: 'permissions', labelKey: 'perm.allPermissions' },
    { id: 'role-perms', labelKey: 'perm.rolePerms' },
    { id: 'overrides', labelKey: 'perm.userOverrides' },
    { id: 'scopes', labelKey: 'perm.scopes' },
  ];

  // Load permissions catalog
  const fetchPermissions = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/permissions');
      setPermissions(res.data.data || []);
    } catch { /* ignore */ }
    setPermLoading(false);
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  // Load role permissions
  const fetchRolePerms = useCallback(async () => {
    if (!selectedRole) return;
    setRolePermLoading(true);
    try {
      const [roleRes, allRes] = await Promise.all([
        apiClient.get(`/api/v1/permissions/roles/${selectedRole}`),
        apiClient.get('/api/v1/permissions'),
      ]);
      setRolePerms(roleRes.data.data || []);
      setAvailPerms(allRes.data.data || []);
    } catch { /* ignore */ }
    setRolePermLoading(false);
  }, [selectedRole]);

  useEffect(() => { fetchRolePerms(); }, [fetchRolePerms]);

  // Load users for overrides
  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/auth/users');
      setUsers(res.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Load user permission overrides
  const fetchUserPerms = useCallback(async () => {
    if (!selectedUser) { setUserPerms([]); return; }
    try {
      const [userPermRes, allRes] = await Promise.all([
        apiClient.get(`/api/v1/permissions/users/${selectedUser}`),
        apiClient.get('/api/v1/permissions'),
      ]);
      setUserPerms(userPermRes.data.data || []);
      setOverridePerms(allRes.data.data || []);
    } catch { /* ignore */ }
  }, [selectedUser]);

  useEffect(() => { fetchUserPerms(); }, [fetchUserPerms]);

  // Load scopes
  const fetchScopes = useCallback(async () => {
    setScopeLoading(true);
    try {
      const res = await apiClient.get('/api/v1/permissions/scopes');
      setScopes(res.data.data || []);
    } catch { /* ignore */ }
    setScopeLoading(false);
  }, []);

  useEffect(() => { fetchScopes(); }, [fetchScopes]);

  const showError = (msg: string) => { setError(msg); setSuccess(''); setTimeout(() => setError(''), 3000); };
  const showSuccess = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); };

  const handleCreatePermission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const data = {
      name: (f.name as any).value,
      module: (f.module as any).value,
      action: (f.action as any).value,
      description: (f.desc as any).value,
    };
    try {
      await apiClient.post('/api/v1/permissions', data);
      setAddDialogOpen(false);
      showSuccess(t('perm.saved'));
      fetchPermissions();
      fetchRolePerms();
    } catch (err: any) {
      showError(err?.response?.data?.message || t('perm.error'));
    }
  };

  const handleDeletePermission = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/permissions/${id}`);
      showSuccess(t('perm.deleted'));
      fetchPermissions();
      fetchRolePerms();
    } catch { showError(t('perm.error')); }
  };

  const handleAssignToRole = async (permId: string) => {
    try {
      await apiClient.post('/api/v1/permissions/roles/assign', { permissionId: permId, role: selectedRole });
      showSuccess(t('perm.assigned'));
      fetchRolePerms();
    } catch { showError(t('perm.error')); }
  };

  const handleRemoveFromRole = async (permId: string) => {
    try {
      await apiClient.post('/api/v1/permissions/roles/remove', { permissionId: permId, role: selectedRole });
      showSuccess(t('perm.removed'));
      fetchRolePerms();
    } catch { showError(t('perm.error')); }
  };

  const handleGrantUser = async () => {
    if (!selectedGrantPerm || !selectedUser) return;
    try {
      await apiClient.post('/api/v1/permissions/users/grant', { userId: selectedUser, permissionId: selectedGrantPerm });
      showSuccess(t('perm.assigned'));
      setSelectedGrantPerm('');
      fetchUserPerms();
    } catch { showError(t('perm.error')); }
  };

  const handleDenyUser = async (permId: string) => {
    if (!selectedUser) return;
    try {
      await apiClient.post('/api/v1/permissions/users/deny', { userId: selectedUser, permissionId: permId });
      showSuccess(t('perm.assigned'));
      fetchUserPerms();
    } catch { showError(t('perm.error')); }
  };

  const handleCreateScope = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const data = { type: (f.type as any).value, name: (f.name as any).value, parentId: (f.parent as any).value || null };
    try {
      await apiClient.post('/api/v1/permissions/scopes', data);
      setAddScopeDialogOpen(false);
      showSuccess(t('perm.scopeCreated'));
      fetchScopes();
    } catch { showError(t('perm.error')); }
  };

  const handleAssignScope = async () => {
    if (!scopeAssignUser || !scopeAssignId) return;
    try {
      await apiClient.post('/api/v1/permissions/scopes/assign', { userId: scopeAssignUser, scopeId: scopeAssignId });
      showSuccess(t('perm.assigned'));
      setAssignScopeDialogOpen(false);
    } catch { showError(t('perm.error')); }
  };

  const availableForRole = availPerms.filter((ap) => !rolePerms.some((rp) => rp.id === ap.id));

  const tabContent = (tab: TabId) => {
    switch (tab) {
      case 'permissions':
        return (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className={`text-sm ${themeConfig.textMuted}`}>{permissions.length} {t('perm.allPermissions')}</p>
              <AppButton variant="primary" size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-1 h-3 w-3" /> {t('perm.addPermission')}
              </AppButton>
            </div>
            {permLoading ? (
              <div className={`py-8 text-center text-sm ${themeConfig.textMuted}`}>{t('common.loading')}</div>
            ) : permissions.length === 0 ? (
              <div className={`py-8 text-center text-sm ${themeConfig.textMuted}`}>{t('common.empty')}</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${themeConfig.border}`}>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('perm.permName')}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('perm.module')}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('perm.action')}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('perm.description')}</th>
                      <th className="p-3 text-right text-xs font-bold uppercase tracking-wider">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                    {permissions.map((p) => (
                      <tr key={p.id} className={`transition hover:${themeConfig.panelHover}`}>
                        <td className="p-3 font-mono text-xs font-medium">{p.name}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${themeConfig.badge}`}>{p.module}</span>
                        </td>
                        <td className="p-3 text-xs">{p.action}</td>
                        <td className={`p-3 text-xs ${themeConfig.textMuted}`}>{p.description || '-'}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeletePermission(p.id)} className={`rounded p-1.5 transition ${themeConfig.panelHover}`} title={t('perm.removePerm')}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'role-perms':
        return (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.selectRole')}</label>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
                className={`rounded border px-3 py-1.5 text-sm ${themeConfig.border} ${themeConfig.panel}`}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {rolePermLoading ? (
              <div className={`py-8 text-center text-sm ${themeConfig.textMuted}`}>{t('common.loading')}</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className={`mb-2 text-sm font-bold ${themeConfig.textPrimary}`}>{t('perm.rolePerms')} — {selectedRole}</h3>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {rolePerms.map((p) => (
                      <div key={p.id} className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${themeConfig.border}`}>
                        <span className="font-mono text-xs">{p.name}</span>
                        <button onClick={() => handleRemoveFromRole(p.id)} className={`rounded p-1 text-xs text-red-400 hover:${themeConfig.panelHover}`}>
                          {t('perm.removePerm')}
                        </button>
                      </div>
                    ))}
                    {rolePerms.length === 0 && <p className={`text-xs ${themeConfig.textMuted}`}>{t('common.empty')}</p>}
                  </div>
                </div>
                <div>
                  <h3 className={`mb-2 text-sm font-bold ${themeConfig.textPrimary}`}>{t('perm.assignPerm')}</h3>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {availableForRole.map((p) => (
                      <div key={p.id} className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${themeConfig.border}`}>
                        <span className="font-mono text-xs">{p.name}</span>
                        <button onClick={() => handleAssignToRole(p.id)} className={`rounded p-1 text-xs text-emerald-400 hover:${themeConfig.panelHover}`}>
                          {t('perm.assignPerm')}
                        </button>
                      </div>
                    ))}
                    {availableForRole.length === 0 && <p className={`text-xs ${themeConfig.textMuted}`}>All permissions assigned</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'overrides':
        return (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.selectUser')}</label>
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                className={`rounded border px-3 py-1.5 text-sm ${themeConfig.border} ${themeConfig.panel}`}>
                <option value="">—</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
              </select>
            </div>
            {selectedUser && (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <select value={selectedGrantPerm} onChange={(e) => setSelectedGrantPerm(e.target.value)}
                    className={`rounded border px-3 py-1.5 text-sm ${themeConfig.border} ${themeConfig.panel}`}>
                    <option value="">{t('perm.selectRole')}</option>
                    {overridePerms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <AppButton variant="primary" size="sm" onClick={handleGrantUser} disabled={!selectedGrantPerm}>
                    <Check className="mr-1 h-3 w-3" /> {t('perm.grant')}
                  </AppButton>
                </div>
                <div className="space-y-1">
                  {userPerms.length === 0 ? (
                    <p className={`text-sm ${themeConfig.textMuted}`}>{t('perm.noOverrides')}</p>
                  ) : userPerms.map((up: any) => (
                    <div key={up.id} className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${themeConfig.border}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{up.permission?.name || up.name}</span>
                        <StatusBadge status={up.effect === 'deny' ? 'blocked' as StatusKind : 'done' as StatusKind} />
                        <span className={`text-xs ${themeConfig.textMuted}`}>{up.effect}</span>
                      </div>
                      {up.effect !== 'deny' && (
                        <button onClick={() => handleDenyUser(up.permissionId || up.id)} className={`rounded p-1 text-xs text-red-400 hover:${themeConfig.panelHover}`}>
                          <X className="h-3 w-3" /> {t('perm.deny')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 'scopes':
        return (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className={`text-sm ${themeConfig.textMuted}`}>{scopes.length} scopes</p>
              <div className="flex gap-2">
                <AppButton variant="primary" size="sm" onClick={() => setAssignScopeDialogOpen(true)}>
                  <Globe className="mr-1 h-3 w-3" /> {t('perm.assignScope')}
                </AppButton>
                <AppButton variant="secondary" size="sm" onClick={() => setAddScopeDialogOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" /> {t('perm.addScope')}
                </AppButton>
              </div>
            </div>
            {scopeLoading ? (
              <div className={`py-8 text-center text-sm ${themeConfig.textMuted}`}>{t('common.loading')}</div>
            ) : scopes.length === 0 ? (
              <div className={`py-8 text-center text-sm ${themeConfig.textMuted}`}>{t('common.empty')}</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${themeConfig.border}`}>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('perm.scopeName')}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('perm.scopeType')}</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">Parent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                    {scopes.map((s) => (
                      <tr key={s.id} className={`transition hover:${themeConfig.panelHover}`}>
                        <td className="p-3 font-medium">{s.name}</td>
                        <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${themeConfig.badge}`}>{s.type}</span></td>
                        <td className={`p-3 text-xs ${themeConfig.textMuted}`}>{s.parentId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader titleKey="perm.title" subtitleKey="perm.subtitle" />

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? `${themeConfig.primaryText} ${themeConfig.panel} shadow-sm`
                  : `${themeConfig.textMuted} hover:${themeConfig.panelHover}`
              }`}
            >
              <Shield className="mr-1.5 inline h-4 w-4" /> {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className={`rounded-lg p-5 ${themeConfig.panel} ${themeConfig.shadow}`}>
          {tabContent(activeTab)}
        </div>

        {/* Add Permission Dialog */}
        <AppDialog open={addDialogOpen} titleKey="perm.addPermission" onClose={() => setAddDialogOpen(false)}>
          <form onSubmit={handleCreatePermission} className="space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>Name (module:action)</label>
              <input name="name" required placeholder="e.g. user:create" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.module')}</label>
                <input name="module" required placeholder="auth" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.action')}</label>
                <input name="action" required placeholder="users.create" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
              </div>
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.description')}</label>
              <input name="desc" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="ghost" type="button" onClick={() => setAddDialogOpen(false)}>{t('common.cancel')}</AppButton>
              <AppButton variant="primary" type="submit">{t('common.create')}</AppButton>
            </div>
          </form>
        </AppDialog>

        {/* Add Scope Dialog */}
        <AppDialog open={addScopeDialogOpen} titleKey="perm.addScope" onClose={() => setAddScopeDialogOpen(false)}>
          <form onSubmit={handleCreateScope} className="space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.scopeType')}</label>
              <select name="type" required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`}>
                <option value="company">Company</option>
                <option value="factory">Factory</option>
                <option value="department">Department</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.scopeName')}</label>
              <input name="name" required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>Parent ID</label>
              <input name="parent" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono ${themeConfig.border} ${themeConfig.panel}`} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="ghost" type="button" onClick={() => setAddScopeDialogOpen(false)}>{t('common.cancel')}</AppButton>
              <AppButton variant="primary" type="submit">{t('common.create')}</AppButton>
            </div>
          </form>
        </AppDialog>

        {/* Assign Scope Dialog */}
        <AppDialog open={assignScopeDialogOpen} titleKey="perm.assignScope" onClose={() => setAssignScopeDialogOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.selectUser')}</label>
              <select value={scopeAssignUser} onChange={(e) => setScopeAssignUser(e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`}>
                <option value="">—</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.scopeName')}</label>
              <select value={scopeAssignId} onChange={(e) => setScopeAssignId(e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`}>
                <option value="">—</option>
                {scopes.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="ghost" type="button" onClick={() => setAssignScopeDialogOpen(false)}>{t('common.cancel')}</AppButton>
              <AppButton variant="primary" onClick={handleAssignScope}>{t('common.save')}</AppButton>
            </div>
          </div>
        </AppDialog>
      </div>
    </AppLayout>
  );
}
