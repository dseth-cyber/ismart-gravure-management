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
import { Plus, Lock, Unlock, RotateCw } from 'lucide-react';
import { ROLES } from '@/lib/constants/roles';

interface User {
  id: string;
  username: string;
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [confirmLockUser, setConfirmLockUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/auth/users');
      setUsers(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const isLocked = (u: User) => u.lockedUntil && new Date(u.lockedUntil) > new Date();

  const handleToggleLock = async (u: User) => {
    try {
      await apiClient.put(`/api/v1/auth/users/${u.id}`, { locked: !isLocked(u) });
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user');
    }
  };

  const handleChangeRole = async (u: User, role: string) => {
    try {
      await apiClient.put(`/api/v1/auth/users/${u.id}`, { role });
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = { username: (form.username as any).value, password: (form.password as any).value, role: (form.role as any).value };
    try {
      await apiClient.post('/api/v1/auth/users', data);
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader
          titleKey="settings.userMgt"
          subtitleKey="settings.userMgtDesc"
          actions={
            <AppButton variant="primary" onClick={() => { setEditUser(null); setDialogOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> {t('settings.addUser')}
            </AppButton>
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
                    <td className="p-3">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                        className={`rounded border px-2 py-1 text-xs ${themeConfig.border} ${themeConfig.panel}`}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
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
                      <button
                        onClick={() => setConfirmLockUser(u)}
                        className={`rounded p-1.5 transition ${themeConfig.panelHover}`}
                        title={isLocked(u) ? t('settings.unlock') : t('settings.lock')}
                      >
                        {isLocked(u) ? <Unlock className="h-4 w-4 text-emerald-400" /> : <Lock className="h-4 w-4 text-amber-400" />}
                      </button>
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
          onClose={() => setDialogOpen(false)}
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.username')}</label>
              <input name="username" required minLength={3} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.password')}</label>
              <input name="password" type="password" required minLength={8} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMuted}`}>{t('settings.role')}</label>
              <select name="role" defaultValue="viewer" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeConfig.border} ${themeConfig.panel}`}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="ghost" type="button" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</AppButton>
              <AppButton variant="primary" type="submit">{t('common.create')}</AppButton>
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
      </div>
    </AppLayout>
  );
}
