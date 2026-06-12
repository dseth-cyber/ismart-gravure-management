'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { AppButton } from '@/components/shared/app-button';
import { useTheme } from '@/lib/theme/theme-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { apiClient } from '@/lib/api/client';
import { Eye, EyeOff, Save } from 'lucide-react';

const SECTIONS = ['password', 'session'] as const;

export default function SystemSettingsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const { user, changePassword } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('password');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

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
      </div>
    </AppLayout>
  );
}
