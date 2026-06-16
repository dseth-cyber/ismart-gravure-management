export const ROLES = ['admin', 'sales', 'planner', 'production', 'qc', 'warehouse', 'inkroom', 'viewer'] as const;
export type UserRole = string;

export function getRoles(): string[] {
  if (typeof window === 'undefined') {
    return [...ROLES];
  }
  const saved = window.localStorage.getItem('system_roles');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  // If not in localStorage yet, seed it with default ROLES
  window.localStorage.setItem('system_roles', JSON.stringify([...ROLES]));
  return [...ROLES];
}

export function saveRoles(roles: string[]): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('system_roles', JSON.stringify(roles));
  }
}
