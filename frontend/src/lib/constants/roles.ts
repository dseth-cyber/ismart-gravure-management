export const ROLES = ['admin', 'sales', 'planner', 'production', 'qc', 'warehouse', 'inkroom', 'viewer'] as const;
export type UserRole = (typeof ROLES)[number];
