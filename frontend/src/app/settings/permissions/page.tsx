'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { AppButton } from '@/components/shared/app-button';
import { AppDialog } from '@/components/shared/app-dialog';
import { StatusBadge, type StatusKind } from '@/components/shared/status-badge';
import { useTheme } from '@/lib/theme/theme-provider';
import { apiClient } from '@/lib/api/client';
import { Plus, Trash2, Check, X, Shield, Globe, Edit } from 'lucide-react';
import { getRoles, saveRoles } from '@/lib/constants/roles';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type TabId = 'permissions' | 'role-perms' | 'overrides' | 'scopes' | 'roles';

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
  const searchParams = useSearchParams();
  const optionClass = themeConfig.name === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white';
  const [activeTab, setActiveTab] = useState<TabId>((searchParams.get('tab') as TabId) || 'permissions');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Permissions tab
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Role permissions tab
  const [selectedRole, setSelectedRole] = useState<string>('admin');

  // User overrides tab
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedGrantPerm, setSelectedGrantPerm] = useState('');

  // Scopes tab
  const [addScopeDialogOpen, setAddScopeDialogOpen] = useState(false);
  const [assignScopeDialogOpen, setAssignScopeDialogOpen] = useState(false);
  const [scopeAssignUser, setScopeAssignUser] = useState('');
  const [scopeAssignId, setScopeAssignId] = useState('');

  // Edit & Delete dialog states
  const [editPerm, setEditPerm] = useState<Permission | null>(null);
  const [editPermDialogOpen, setEditPermDialogOpen] = useState(false);
  const [editScope, setEditScope] = useState<Scope | null>(null);
  const [editScopeDialogOpen, setEditScopeDialogOpen] = useState(false);
  const [addScopeType, setAddScopeType] = useState('company');
  const [roles, setRoles] = useState<string[]>([]);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [editScopeType, setEditScopeType] = useState('company');

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: 'permissions', labelKey: 'perm.allPermissions' },
    { id: 'role-perms', labelKey: 'perm.rolePerms' },
    { id: 'overrides', labelKey: 'perm.userOverrides' },
    { id: 'scopes', labelKey: 'perm.scopes' },
    { id: 'roles', labelKey: 'perm.roles' },
  ];

  const queryClient = useQueryClient();

  // 1. All permissions
  const { data: permissions = [], isLoading: permLoading } = useQuery<Permission[], Error>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/permissions');
      return res.data.data || [];
    }
  });

  // 2. Role permissions
  const { data: rolePermData, isLoading: rolePermLoading } = useQuery({
    queryKey: ['rolePermissions', selectedRole],
    queryFn: async () => {
      if (!selectedRole) return { rolePerms: [], availPerms: [] };
      const [roleRes, allRes] = await Promise.all([
        apiClient.get(`/api/v1/permissions/roles/${selectedRole}`),
        apiClient.get('/api/v1/permissions'),
      ]);
      return {
        rolePerms: (roleRes.data.data || []) as Permission[],
        availPerms: (allRes.data.data || []) as Permission[],
      };
    },
    enabled: !!selectedRole
  });
  const rolePerms = rolePermData?.rolePerms || [];
  const availPerms = rolePermData?.availPerms || [];

  // 3. Users list
  const { data: users = [] } = useQuery<UserInfo[], Error>({
    queryKey: ['usersList'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/auth/users');
      return res.data.data || [];
    }
  });

  // 4. User permission overrides
  const { data: userPermsData } = useQuery({
    queryKey: ['userPermissions', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return { userPerms: [], overridePerms: [] };
      const [userPermRes, allRes] = await Promise.all([
        apiClient.get(`/api/v1/permissions/users/${selectedUser}`),
        apiClient.get('/api/v1/permissions'),
      ]);
      return {
        userPerms: userPermRes.data.data || [],
        overridePerms: (allRes.data.data || []) as Permission[],
      };
    },
    enabled: !!selectedUser
  });
  const userPerms = userPermsData?.userPerms || [];
  const overridePerms = userPermsData?.overridePerms || [];

  // 5. Scopes list
  const { data: scopes = [], isLoading: scopeLoading } = useQuery<Scope[], Error>({
    queryKey: ['scopesList'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/permissions/scopes');
      return res.data.data || [];
    }
  });

  useEffect(() => {
    setRoles(getRoles());
  }, []);

  // Pre-select user from URL param
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && users.length > 0) {
      setSelectedUser(userId);
    }
  }, [searchParams, users]);

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
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedRole] });
    } catch (err: any) {
      showError(err?.response?.data?.message || t('perm.error'));
    }
  };

  const handleDeletePermission = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/permissions/${id}`);
      showSuccess(t('perm.deleted'));
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedRole] });
    } catch { showError(t('perm.error')); }
  };

  const handleAssignToRole = async (permId: string) => {
    try {
      await apiClient.post('/api/v1/permissions/roles/assign', { permissionId: permId, role: selectedRole });
      showSuccess(t('perm.assigned'));
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedRole] });
    } catch { showError(t('perm.error')); }
  };

  const handleRemoveFromRole = async (permId: string) => {
    try {
      await apiClient.post('/api/v1/permissions/roles/remove', { permissionId: permId, role: selectedRole });
      showSuccess(t('perm.removed'));
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedRole] });
    } catch { showError(t('perm.error')); }
  };

  const handleGrantUser = async () => {
    if (!selectedGrantPerm || !selectedUser) return;
    try {
      await apiClient.post('/api/v1/permissions/users/grant', { userId: selectedUser, permissionId: selectedGrantPerm });
      showSuccess(t('perm.assigned'));
      setSelectedGrantPerm('');
      queryClient.invalidateQueries({ queryKey: ['userPermissions', selectedUser] });
    } catch { showError(t('perm.error')); }
  };

  const handleDenyUser = async (permId: string) => {
    if (!selectedUser) return;
    try {
      await apiClient.post('/api/v1/permissions/users/deny', { userId: selectedUser, permissionId: permId });
      showSuccess(t('perm.assigned'));
      queryClient.invalidateQueries({ queryKey: ['userPermissions', selectedUser] });
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
      queryClient.invalidateQueries({ queryKey: ['scopesList'] });
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

  const handleEditPermission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editPerm) return;
    const f = e.currentTarget;
    const data = {
      name: (f.name as any).value,
      module: (f.module as any).value,
      action: (f.action as any).value,
      description: (f.desc as any).value || null
    };
    try {
      await apiClient.put(`/api/v1/permissions/${editPerm.id}`, data);
      setEditPermDialogOpen(false);
      setEditPerm(null);
      showSuccess(t('perm.saved'));
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedRole] });
    } catch (err: any) {
      showError(err?.response?.data?.message || t('perm.error'));
    }
  };

  const handleEditScope = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editScope) return;
    const f = e.currentTarget;
    const data = {
      type: (f.type as any).value,
      name: (f.name as any).value,
      parentId: (f.parent as any).value || null
    };
    try {
      await apiClient.put(`/api/v1/permissions/scopes/${editScope.id}`, data);
      setEditScopeDialogOpen(false);
      setEditScope(null);
      showSuccess(t('perm.saved'));
      queryClient.invalidateQueries({ queryKey: ['scopesList'] });
    } catch (err: any) {
      showError(err?.response?.data?.message || t('perm.error'));
    }
  };

  const handleDeleteScope = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/permissions/scopes/${id}`);
      showSuccess(t('perm.deleted'));
      queryClient.invalidateQueries({ queryKey: ['scopesList'] });
    } catch {
      showError(t('perm.error'));
    }
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    const roleClean = newRoleInput.trim().toLowerCase();
    if (!roleClean) return;
    if (roles.includes(roleClean)) {
      showError(t('perm.roleExists') || 'Role already exists');
      return;
    }
    const updated = [...roles, roleClean];
    saveRoles(updated);
    setRoles(updated);
    setNewRoleInput('');
    showSuccess(t('perm.roleAdded') || 'Role added successfully');
  };

  const handleDeleteRole = (roleToDelete: string) => {
    if (roleToDelete === 'admin' || roleToDelete === 'viewer') {
      showError(t('perm.cannotDeleteSystemRole') || 'Cannot delete system roles');
      return;
    }
    if (confirm(t('perm.confirmDeleteRole') || `Are you sure you want to delete the role "${roleToDelete}"?`)) {
      const updated = roles.filter(r => r !== roleToDelete);
      saveRoles(updated);
      setRoles(updated);
      showSuccess(t('perm.roleDeleted') || 'Role deleted successfully');
    }
  };

  const availableForRole = availPerms.filter((ap) => !rolePerms.some((rp) => rp.id === ap.id));

  const tabContent = (tab: TabId) => {
    switch (tab) {
      case 'permissions':
        return (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className={`text-sm ${themeConfig.textMuted}`}>{permissions.length} {t('perm.allPermissions')}</p>
              <AppButton variant="primary" onClick={() => setAddDialogOpen(true)}>
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
                        <td className={`p-3 text-xs ${themeConfig.textMuted}`}>{t('perm.desc.' + p.name.replace(':', '_')) || p.description || '-'}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setEditPerm(p); setEditPermDialogOpen(true); }} className={`rounded p-1.5 transition ${themeConfig.panelHover}`} title={t('common.edit') || 'Edit'}>
                              <Edit className="h-4 w-4 text-blue-400" />
                            </button>
                            <button onClick={() => handleDeletePermission(p.id)} className={`rounded p-1.5 transition ${themeConfig.panelHover}`} title={t('perm.removePerm')}>
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
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
              <div className="w-48 text-slate-100">
                <SearchableSelect
                  value={selectedRole}
                  onChange={setSelectedRole}
                  placeholder={t('common.select')}
                  options={roles.map((r) => ({ value: r, label: r }))}
                />
              </div>
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
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold">{p.name}</span>
                          <span className={`text-[11px] ${themeConfig.textMuted}`}>{t('perm.desc.' + p.name.replace(':', '_')) || p.description}</span>
                        </div>
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
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold">{p.name}</span>
                          <span className={`text-[11px] ${themeConfig.textMuted}`}>{t('perm.desc.' + p.name.replace(':', '_')) || p.description}</span>
                        </div>
                        <button onClick={() => handleAssignToRole(p.id)} className={`rounded p-1 text-xs text-emerald-400 hover:${themeConfig.panelHover}`}>
                          {t('perm.assignPerm')}
                        </button>
                      </div>
                    ))}
                    {availableForRole.length === 0 && <p className={`text-xs ${themeConfig.textMuted}`}>{t('perm.allAssigned') || 'All permissions assigned'}</p>}
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
              <div className="w-64 text-slate-100">
                <SearchableSelect
                  value={selectedUser}
                  onChange={setSelectedUser}
                  placeholder="—"
                  options={users.map((u) => ({ value: u.id, label: `${u.username} (${u.role})` }))}
                />
              </div>
            </div>
            {selectedUser && (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="w-80 md:w-96 text-slate-100">
                    <SearchableSelect
                      value={selectedGrantPerm}
                      onChange={setSelectedGrantPerm}
                      placeholder={t('perm.assignPerm') || 'Select Permission'}
                      options={overridePerms.map((p) => {
                        const desc = t('perm.desc.' + p.name.replace(':', '_')) || p.description;
                        return {
                          value: p.id,
                          label: `${p.name}${desc ? ` (${desc})` : ''}`,
                        };
                      })}
                    />
                  </div>
                  <AppButton variant="primary" onClick={handleGrantUser} disabled={!selectedGrantPerm}>
                    <Check className="mr-1 h-3 w-3" /> {t('perm.grant')}
                  </AppButton>
                </div>
                <div className="space-y-1">
                  {userPerms.length === 0 ? (
                    <p className={`text-sm ${themeConfig.textMuted}`}>{t('perm.noOverrides')}</p>
                  ) : userPerms.map((up: any) => {
                    const name = up.permission?.name || up.name;
                    const desc = t('perm.desc.' + name.replace(':', '_')) || up.permission?.description || up.description;
                    return (
                      <div key={up.id} className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${themeConfig.border}`}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold">{name}</span>
                            <StatusBadge status={up.effect === 'deny' ? 'blocked' as StatusKind : 'done' as StatusKind} />
                            <span className={`text-xs ${themeConfig.textMuted}`}>{up.effect}</span>
                          </div>
                          {desc && <span className={`text-[11px] ${themeConfig.textMuted}`}>{desc}</span>}
                        </div>
                        {up.effect !== 'deny' && (
                          <button onClick={() => handleDenyUser(up.permissionId || up.id)} className={`rounded p-1 text-xs text-red-400 hover:${themeConfig.panelHover}`}>
                            <X className="h-3 w-3" /> {t('perm.deny')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );

      case 'scopes':
        return (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className={`text-sm ${themeConfig.textMuted}`}>{scopes.length} {t('perm.scopesCount') || 'scopes'}</p>
              <div className="flex gap-2">
                <AppButton variant="primary" onClick={() => setAssignScopeDialogOpen(true)}>
                  <Globe className="mr-1 h-3 w-3" /> {t('perm.assignScope')}
                </AppButton>
                <AppButton variant="secondary" onClick={() => { setAddScopeType('company'); setAddScopeDialogOpen(true); }}>
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
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('perm.parent') || 'Parent'}</th>
                      <th className="p-3 text-right text-xs font-bold uppercase tracking-wider">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                    {scopes.map((s) => (
                      <tr key={s.id} className={`transition hover:${themeConfig.panelHover}`}>
                        <td className="p-3 font-medium">{s.name}</td>
                        <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${themeConfig.badge}`}>{s.type}</span></td>
                        <td className={`p-3 text-xs ${themeConfig.textMuted}`}>{s.parentId || '-'}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setEditScope(s); setEditScopeType(s.type); setEditScopeDialogOpen(true); }} className={`rounded p-1.5 transition ${themeConfig.panelHover}`} title={t('common.edit') || 'Edit'}>
                              <Edit className="h-4 w-4 text-blue-400" />
                            </button>
                            <button onClick={() => handleDeleteScope(s.id)} className={`rounded p-1.5 transition ${themeConfig.panelHover}`} title={t('common.delete') || 'Delete'}>
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'roles':
        return (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className={`text-sm ${themeConfig.textMuted}`}>{roles.length} {t('perm.rolesCount') || 'roles'}</p>
              <form onSubmit={handleAddRole} className="flex gap-2">
                <input
                  type="text"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  placeholder={t('perm.newRoleName') || 'New Role Name'}
                  required
                  className={`rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`}
                  style={{ backgroundColor: 'var(--input-bg, rgba(255,255,255,0.05))', borderColor: 'var(--border-color, rgba(255,255,255,0.1))' }}
                />
                <AppButton variant="primary" type="submit">
                  <Plus className="mr-1 h-3.5 w-3.5" /> {t('perm.addRole') || 'Add Role'}
                </AppButton>
              </form>
            </div>
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${themeConfig.border}`}>
                    <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('perm.roleName') || 'Role Name'}</th>
                    <th className="p-3 text-right text-xs font-bold uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                  {roles.map((r) => (
                    <tr key={r} className={`transition hover:${themeConfig.panelHover}`}>
                      <td className="p-3 font-medium">{r}</td>
                      <td className="p-3 text-right">
                        {r !== 'admin' && r !== 'viewer' ? (
                          <button onClick={() => handleDeleteRole(r)} className={`rounded p-1.5 transition ${themeConfig.panelHover}`} title={t('common.delete') || 'Delete'}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        ) : (
                          <span className={`text-xs ${themeConfig.textMuted}`}>{t('perm.systemRole') || 'System Role'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.nameFormat') || 'Name (module:action)'}</label>
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
              <input type="hidden" name="type" value={addScopeType} />
              <SearchableSelect
                label={t('perm.scopeType')}
                value={addScopeType}
                onChange={setAddScopeType}
                required
                placeholder={t('common.select')}
                options={[
                  { value: 'company', label: t('perm.scopeCompany') || 'Company' },
                  { value: 'factory', label: t('perm.scopeFactory') || 'Factory' },
                  { value: 'department', label: t('perm.scopeDept') || 'Department' },
                  { value: 'warehouse', label: t('perm.scopeWarehouse') || 'Warehouse' },
                ]}
              />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.scopeName')}</label>
              <input name="name" required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.parentId') || 'Parent ID'}</label>
              <input name="parent" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono ${themeConfig.border} ${themeConfig.panel}`} placeholder={t('common.optional') || 'Optional'} />
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
              <SearchableSelect
                label={t('perm.selectUser')}
                value={scopeAssignUser}
                onChange={setScopeAssignUser}
                placeholder="—"
                options={users.map((u) => ({ value: u.id, label: `${u.username} (${u.role})` }))}
              />
            </div>
            <div>
              <SearchableSelect
                label={t('perm.scopeName')}
                value={scopeAssignId}
                onChange={setScopeAssignId}
                placeholder="—"
                options={scopes.map((s) => ({ value: s.id, label: `${s.name} (${s.type})` }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="ghost" type="button" onClick={() => setAssignScopeDialogOpen(false)}>{t('common.cancel')}</AppButton>
              <AppButton variant="primary" onClick={handleAssignScope}>{t('common.save')}</AppButton>
            </div>
          </div>
        </AppDialog>

        {/* Edit Permission Dialog */}
        <AppDialog open={editPermDialogOpen} titleKey="common.edit" onClose={() => { setEditPermDialogOpen(false); setEditPerm(null); }}>
          {editPerm && (
            <form onSubmit={handleEditPermission} className="space-y-4">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.nameFormat') || 'Name (module:action)'}</label>
                <input name="name" defaultValue={editPerm.name} required placeholder="e.g. user:create" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono ${themeConfig.border} ${themeConfig.panel}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.module')}</label>
                  <input name="module" defaultValue={editPerm.module} required placeholder="auth" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.action')}</label>
                  <input name="action" defaultValue={editPerm.action} required placeholder="users.create" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
                </div>
              </div>
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.description')}</label>
                <input name="desc" defaultValue={editPerm.description || ''} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <AppButton variant="ghost" type="button" onClick={() => { setEditPermDialogOpen(false); setEditPerm(null); }}>{t('common.cancel')}</AppButton>
                <AppButton variant="primary" type="submit">{t('common.save')}</AppButton>
              </div>
            </form>
          )}
        </AppDialog>

        {/* Edit Scope Dialog */}
        <AppDialog open={editScopeDialogOpen} titleKey="common.edit" onClose={() => { setEditScopeDialogOpen(false); setEditScope(null); }}>
          {editScope && (
            <form onSubmit={handleEditScope} className="space-y-4">
              <div>
                <input type="hidden" name="type" value={editScopeType} />
                <SearchableSelect
                  label={t('perm.scopeType')}
                  value={editScopeType}
                  onChange={setEditScopeType}
                  required
                  placeholder={t('common.select')}
                  options={[
                    { value: 'company', label: t('perm.scopeCompany') || 'Company' },
                    { value: 'factory', label: t('perm.scopeFactory') || 'Factory' },
                    { value: 'department', label: t('perm.scopeDept') || 'Department' },
                    { value: 'warehouse', label: t('perm.scopeWarehouse') || 'Warehouse' },
                  ]}
                />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.scopeName')}</label>
                <input name="name" defaultValue={editScope.name} required className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('perm.parentId') || 'Parent ID'}</label>
                <input name="parent" defaultValue={editScope.parentId || ''} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono ${themeConfig.border} ${themeConfig.panel}`} placeholder={t('common.optional') || 'Optional'} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <AppButton variant="ghost" type="button" onClick={() => { setEditScopeDialogOpen(false); setEditScope(null); }}>{t('common.cancel')}</AppButton>
                <AppButton variant="primary" type="submit">{t('common.save')}</AppButton>
              </div>
            </form>
          )}
        </AppDialog>
      </div>
    </AppLayout>
  );
}
