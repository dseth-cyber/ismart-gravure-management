'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { AppButton } from '@/components/shared/app-button';
import { AppDialog } from '@/components/shared/app-dialog';
import { StatusBadge, type StatusKind } from '@/components/shared/status-badge';
import { useTheme } from '@/lib/theme/theme-provider';
import { apiClient } from '@/lib/api/client';
import { Plus, Lock, Unlock, RotateCw, Edit, Shield, Trash2 } from 'lucide-react';
import { getRoles } from '@/lib/constants/roles';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  lastPasswordChange: string | null;
}

export default function UserManagementPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const optionClass = themeConfig.name === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showTrash, setShowTrash] = useState(false);

  const { data: users = [], isLoading: loading, error: queryError } = useQuery<User[]>({
    queryKey: ['users', showTrash],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/auth/users', {
        params: { showDeleted: showTrash ? 'true' : 'false' }
      });
      return res.data.data || [];
    }
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError.message : String(queryError));
    } else {
      setError('');
    }
  }, [queryError]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [confirmLockUser, setConfirmLockUser] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [confirmPermanentDeleteUser, setConfirmPermanentDeleteUser] = useState<User | null>(null);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createRole, setCreateRole] = useState('viewer');
  const [editRole, setEditRole] = useState('viewer');
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    setRoles(getRoles());
  }, []);

  useEffect(() => {
    const loadRequired = async () => {
      try {
        const { listSettings } = await import('@/lib/services/setting');
        const dbSettings = await listSettings();
        const setting = dbSettings.find(s => s.key === 'requiredFields.user');
        if (setting) {
          setRequiredFields(JSON.parse(setting.value));
        }
      } catch (e) {
        console.error('Failed to load required fields settings', e);
      }
    };
    loadRequired();
  }, [dialogOpen, editDialogOpen]);

  const isLocked = (u: User) => u.lockedUntil && new Date(u.lockedUntil) > new Date();

  const handleToggleLock = async (u: User) => {
    try {
      await apiClient.put(`/api/v1/auth/users/${u.id}`, { locked: !isLocked(u) });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.username as any).value;
    const email = (form.email as any).value;
    const role = (form.role as any).value;
    const password = (form.password as any).value;
    const confirmPassword = (form.confirmPassword as any).value;
    if (requiredFields.includes('username') && (!username || username.trim() === '')) {
      setError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${t('settings.username') || 'Username'}`);
      return;
    }
    if (requiredFields.includes('email') && (!email || email.trim() === '')) {
      setError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${t('settings.email') || 'Email'}`);
      return;
    }
    if (requiredFields.includes('role') && (!role || role.trim() === '')) {
      setError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${t('settings.role') || 'Role'}`);
      return;
    }
    if (requiredFields.includes('password') && (!password || password.trim() === '')) {
      setError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${t('settings.password') || 'Password'}`);
      return;
    }
    if (password !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }
    const body: any = { username, password, role };
    if (email) body.email = email;
    try {
      await apiClient.post('/api/v1/auth/users', body);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    const form = e.currentTarget;
    const username = (form.username as any).value;
    const email = (form.email as any).value;
    const role = (form.role as any).value;
    const password = (form.password as any).value;
    const confirmPassword = (form.confirmPassword as any).value;
    if (requiredFields.includes('username') && (!username || username.trim() === '')) {
      setError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${t('settings.username') || 'Username'}`);
      return;
    }
    if (requiredFields.includes('email') && (!email || email.trim() === '')) {
      setError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${t('settings.email') || 'Email'}`);
      return;
    }
    if (requiredFields.includes('role') && (!role || role.trim() === '')) {
      setError(`${t('common.requiredFieldsMissing') || 'Required fields missing'}: ${t('settings.role') || 'Role'}`);
      return;
    }
    if (password && password !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }
    const body: any = { username, role };
    if (email) body.email = email;
    else body.email = null;
    if (password) body.password = password;
    try {
      await apiClient.put(`/api/v1/auth/users/${editUser.id}`, body);
      setEditDialogOpen(false);
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    try {
      await apiClient.delete(`/api/v1/auth/users/${confirmDeleteUser.id}`);
      setConfirmDeleteUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRestoreUser = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/auth/users/${id}/restore`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to restore user');
    }
  };

  const handlePermanentDeleteUser = async () => {
    if (!confirmPermanentDeleteUser) return;
    try {
      await apiClient.delete(`/api/v1/auth/users/${confirmPermanentDeleteUser.id}/permanent`);
      setConfirmPermanentDeleteUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to permanently delete user');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await apiClient.delete('/api/v1/auth/users/trash/empty');
      setEmptyTrashConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to empty trash');
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader
          titleKey="settings.userMgt"
          subtitleKey="settings.userMgtDesc"
          actions={
            <div className="flex items-center gap-2">
              <AppButton variant="primary" onClick={() => { setEditUser(null); setCreateRole('viewer'); setDialogOpen(true); }}>
                <Plus className="mr-1.5 h-4 w-4" /> {t('settings.addUser')}
              </AppButton>
              <AppButton
                variant="ghost"
                onClick={() => setShowTrash(v => !v)}
                className={`gap-1.5 ${showTrash ? 'bg-red-600 hover:bg-red-500 text-white font-semibold' : ''}`}
              >
                <Trash2 className="h-4 w-4" />
                {showTrash ? t('common.viewActive') || 'View Active' : t('common.trashBin') || 'Trash Bin'}
              </AppButton>
              {showTrash && users.length > 0 && (
                <AppButton
                  variant="ghost"
                  onClick={() => setEmptyTrashConfirmOpen(true)}
                  className="gap-1.5 text-red-400 border border-red-500/30 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('settings.emptyTrash') || 'Empty Trash'}
                </AppButton>
              )}
            </div>
          }
        />

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className={`rounded-lg p-8 text-center text-sm ${themeConfig.textMuted}`}>{t('common.loading')}</div>
        ) : users.length === 0 ? (
          <div className={`rounded-lg p-8 text-center text-sm ${themeConfig.textMuted}`}>{t('common.empty')}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${themeConfig.border}`}>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('settings.username')}</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('settings.email')}</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('settings.role')}</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">MFA</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('settings.status')}</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">{t('settings.created')}</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                {users.map((u) => (
                  <tr key={u.id} className={`transition hover:${themeConfig.panelHover}`}>
                    <td className="p-3 font-medium">{u.username}</td>
                    <td className={`p-3 text-xs ${themeConfig.textMuted}`}>{u.email || '-'}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${themeConfig.badge}`}>{u.role}</span>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={u.mfaEnabled ? 'done' as StatusKind : 'todo' as StatusKind} />
                    </td>
                    <td className="p-3">
                      {isLocked(u) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                          <Lock className="h-3 w-3" /> {t('settings.locked')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                          <Unlock className="h-3 w-3" /> {t('settings.active')}
                        </span>
                      )}
                    </td>
                    <td className={`p-3 text-xs ${themeConfig.textMuted}`}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {showTrash ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleRestoreUser(u.id)}
                            className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                            title={t('common.restore') || 'Restore'}
                          >
                            <RotateCw className="h-4 w-4 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => setConfirmPermanentDeleteUser(u)}
                            className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                            title={t('common.deletePermanent') || 'Delete Permanently'}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditUser(u); setEditRole(u.role); setEditDialogOpen(true); }}
                            className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                            title={t('common.edit')}
                          >
                            <Edit className="h-4 w-4 text-cyan-400" />
                          </button>
                          <button
                            onClick={() => router.push(`/settings/permissions?tab=overrides&user=${u.id}`)}
                            className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                            title={t('settings.manageUser')}
                          >
                            <Shield className="h-4 w-4 text-violet-400" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteUser(u)}
                            className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                          <button
                            onClick={() => setConfirmLockUser(u)}
                            className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                            title={isLocked(u) ? t('settings.unlock') : t('settings.lock')}
                          >
                            {isLocked(u) ? <Unlock className="h-4 w-4 text-emerald-400" /> : <Lock className="h-4 w-4 text-amber-400" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AppDialog
          open={dialogOpen}
          titleKey="settings.addUser"
          onClose={() => { setDialogOpen(false); setError(''); }}
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>
                {t('settings.username')} {requiredFields.includes('username') && <span className="text-red-500">*</span>}
              </label>
              <input name="username" minLength={3} required={requiredFields.includes('username')} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>
                {t('settings.email')} {requiredFields.includes('email') && <span className="text-red-500">*</span>}
              </label>
              <input name="email" type="email" placeholder="user@example.com" required={requiredFields.includes('email')}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <input type="hidden" name="role" value={createRole} />
              <SearchableSelect
                label={t('settings.role')}
                value={createRole}
                onChange={setCreateRole}
                required={requiredFields.includes('role')}
                placeholder={t('common.select')}
                options={roles.map((r) => ({ value: r, label: r }))}
              />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>
                {t('settings.password')} {requiredFields.includes('password') && <span className="text-red-500">*</span>}
              </label>
              <input name="password" type="password" minLength={8} required={requiredFields.includes('password')} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.confirmPassword')}</label>
              <input name="confirmPassword" type="password" minLength={8} required={requiredFields.includes('password')} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="ghost" type="button" onClick={() => { setDialogOpen(false); setError(''); }}>{t('common.cancel')}</AppButton>
              <AppButton variant="primary" type="submit">{t('common.create')}</AppButton>
            </div>
          </form>
        </AppDialog>

        <AppDialog
          open={editDialogOpen}
          titleKey="settings.editUser"
          onClose={() => { setEditDialogOpen(false); setEditUser(null); }}
        >
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>
                {t('settings.username')} {requiredFields.includes('username') && <span className="text-red-500">*</span>}
              </label>
              <input name="username" defaultValue={editUser?.username || ''} minLength={3} required={requiredFields.includes('username')}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>
                {t('settings.email')} {requiredFields.includes('email') && <span className="text-red-500">*</span>}
              </label>
              <input name="email" type="email" defaultValue={editUser?.email || ''} placeholder="user@example.com" required={requiredFields.includes('email')}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <input type="hidden" name="role" value={editRole} />
              <SearchableSelect
                label={t('settings.role')}
                value={editRole}
                onChange={setEditRole}
                required={requiredFields.includes('role')}
                placeholder={t('common.select')}
                options={roles.map((r) => ({ value: r, label: r }))}
              />
            </div>
            <hr className={`border-t ${themeConfig.border}`} />
            <p className={`text-xs font-semibold ${themeConfig.textMuted}`}>{t('settings.changePasswordOpt')}</p>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.newPassword')}</label>
              <input name="password" type="password" minLength={8}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.confirmNewPassword')}</label>
              <input name="confirmPassword" type="password" minLength={8}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="ghost" type="button" onClick={() => { setEditDialogOpen(false); setEditUser(null); }}>{t('common.cancel')}</AppButton>
              <AppButton variant="primary" type="submit">{t('common.save')}</AppButton>
            </div>
          </form>
        </AppDialog>

        {confirmLockUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setConfirmLockUser(null)}></div>
            <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>
                {isLocked(confirmLockUser) ? t('settings.unlockUser') : t('settings.lockUser')}
              </h3>
              <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
                {isLocked(confirmLockUser)
                  ? t('settings.unlockConfirm', { username: confirmLockUser.username })
                  : t('settings.lockConfirm', { username: confirmLockUser.username })}
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmLockUser(null)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                  {t('btn.cancel')}
                </button>
                <button
                  onClick={() => { handleToggleLock(confirmLockUser); setConfirmLockUser(null); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow ${isLocked(confirmLockUser) ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                >
                  {isLocked(confirmLockUser) ? t('settings.unlock') : t('settings.lock')}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setConfirmDeleteUser(null)}></div>
            <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('settings.deleteUser')}</h3>
              <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
                {t('settings.deleteUserConfirm', { username: confirmDeleteUser.username })}
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDeleteUser(null)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                  {t('btn.cancel')}
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
                >
                  {t('common.delete') || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmPermanentDeleteUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setConfirmPermanentDeleteUser(null)}></div>
            <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('common.deletePermanent') || 'Delete Permanently'}</h3>
              <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
                Are you sure you want to permanently delete &quot;{confirmPermanentDeleteUser.username}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmPermanentDeleteUser(null)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                  {t('btn.cancel')}
                </button>
                <button
                  onClick={handlePermanentDeleteUser}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
                >
                  {t('common.delete') || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {emptyTrashConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`absolute inset-0 ${themeConfig.dialogOverlay}`} onClick={() => setEmptyTrashConfirmOpen(false)}></div>
            <div className={`relative rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 ${themeConfig.dialog}`}>
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary} mb-3`}>{t('settings.emptyTrash') || 'Empty Trash'}</h3>
              <p className={`text-sm ${themeConfig.textSecondary} mb-6`}>
                Are you sure you want to empty the user trash bin? All deleted users will be permanently purged.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEmptyTrashConfirmOpen(false)} className={`px-4 py-2 rounded-lg text-xs font-bold ${themeConfig.secondaryButton}`}>
                  {t('btn.cancel')}
                </button>
                <button
                  onClick={handleEmptyTrash}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow bg-red-600 hover:bg-red-500"
                >
                  {t('common.delete') || 'Empty'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
