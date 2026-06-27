'use client';

import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { useTheme } from '@/lib/theme/theme-provider';
import { Users, Bell, Settings as SettingsIcon, Shield, KeyRound, ClipboardList } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-provider';
import { usePermission } from '@/lib/permission/can';

const cards = [
  { key: 'userMgt', icon: Users, href: '/settings/users', color: 'from-blue-500 to-indigo-600' },
  { key: 'permissions', icon: KeyRound, href: '/settings/permissions', color: 'from-amber-500 to-orange-600' },
  { key: 'notifications', icon: Bell, href: '/settings/notifications', color: 'from-cyan-500 to-teal-500' },
  { key: 'system', icon: SettingsIcon, href: '/settings/system', color: 'from-purple-500 to-pink-500' },
  { key: 'mfa', icon: Shield, href: '/settings/mfa', color: 'from-emerald-500 to-green-600' },
  { key: 'auditLogs', icon: ClipboardList, href: '/settings/audit', color: 'from-rose-500 to-red-600' },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const { user } = useAuth();
  const { check, loading } = usePermission();

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center text-sm text-gray-400">
          {t('common.loading') || 'Loading...'}
        </div>
      </AppLayout>
    );
  }

  const visibleCards = cards.filter(c => {
    if (isAdmin) return true;
    if (c.key === 'userMgt') return check('auth:users.read');
    if (c.key === 'permissions') return check('permissions:manage');
    if (c.key === 'notifications') return check('notifications:settings.manage');
    if (c.key === 'auditLogs') return check('audit:read');
    if (c.key === 'system') return check('settings:system.manage');
    return true;
  });

  return (
    <AppLayout>
      <div className="grid gap-6">
        <PageHeader titleKey="settings.title" subtitleKey="settings.subtitle" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.key}
                href={card.href}
                className={`group rounded-lg p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${themeConfig.panel} ${themeConfig.shadow}`}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} shadow-md`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className={`mt-4 font-bold ${themeConfig.textPrimary}`}>{t(`settings.${card.key}`)}</h3>
                <p className={`mt-1 text-sm ${themeConfig.textSecondary}`}>{t(`settings.${card.key}Desc`)}</p>
              </a>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

