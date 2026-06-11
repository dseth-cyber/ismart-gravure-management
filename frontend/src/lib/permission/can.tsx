'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

type PermissionContextType = {
  permissions: Set<string>;
  loading: boolean;
  check: (permission: string) => boolean;
};

const PermissionContext = createContext<PermissionContextType>({
  permissions: new Set(),
  loading: true,
  check: () => false,
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const res = await apiClient.get<ApiResponse>('/api/v1/permissions');
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        const perms = new Set(res.data.data.map((p: any) => p.name));
        setPermissions(perms);
      }
    } catch {
      // Fallback: permissions not available
    }
    setLoading(false);
  };

  const check = (permission: string): boolean => {
    if (permissions.has('*:*')) return true;
    if (permissions.has(permission)) return true;
    const [module] = permission.split(':');
    if (permissions.has(`${module}:*`)) return true;
    return false;
  };

  return (
    <PermissionContext.Provider value={{ permissions, loading, check }}>
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
