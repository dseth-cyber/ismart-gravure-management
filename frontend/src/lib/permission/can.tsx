'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { useAuth } from '@/lib/auth/auth-provider';

type PermissionContextType = {
  permissions: Set<string>;
  loading: boolean;
  check: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
};

const PermissionContext = createContext<PermissionContextType>({
  permissions: new Set(),
  loading: true,
  check: () => false,
  refreshPermissions: async () => {},
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!accessToken) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse>('/api/v1/permissions/users/me');
      if (res.data?.status === 'success' && res.data.data) {
        const data = res.data.data;
        const names = Array.isArray(data) ? data.map((p: any) => p.name ?? p.permission?.name ?? p) : [];
        const perms = new Set(names);
        setPermissions(perms);
      }
    } catch {
      // Fallback: permissions not available
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const check = useCallback((permission: string): boolean => {
    if (permissions.has('*:*')) return true;
    if (permissions.has(permission)) return true;
    const [module] = permission.split(':');
    if (permissions.has(`${module}:*`)) return true;
    return false;
  }, [permissions]);

  return (
    <PermissionContext.Provider value={{ permissions, loading, check, refreshPermissions: loadPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}

export function Can({ permission, children, fallback = null }: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { check, loading } = usePermission();

  if (loading) return null;
  if (!check(permission)) return fallback;
  return <>{children}</>;
}
