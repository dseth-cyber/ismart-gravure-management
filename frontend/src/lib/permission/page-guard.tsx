'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermission } from './can';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PageGuard({ permission, children, fallback }: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { check, loading } = usePermission();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !check(permission)) {
      const redirectTimer = setTimeout(() => {
        router.push('/');
      }, 5000);
      return () => clearTimeout(redirectTimer);
    }
  }, [loading, check, permission, router]);

  if (loading) return null;

  if (!check(permission)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="w-16 h-16 text-red-400" />
        <h2 className="text-xl font-bold text-red-400">{t('common.forbidden')}</h2>
        <p className="text-sm text-gray-400 max-w-md text-center">
          You do not have permission to access this page. You will be redirected to the dashboard shortly.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md hover:shadow-lg transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
