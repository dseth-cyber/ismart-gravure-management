'use client';

import { I18nProvider } from '@/lib/i18n/i18n-provider';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { PermissionProvider } from '@/lib/permission/can';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <PermissionProvider>{children}</PermissionProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
