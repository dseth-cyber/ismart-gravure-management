import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from './error';
import { AuthenticatedRequest } from './auth';

async function getUserPermissions(userId: string, role: string): Promise<Set<string>> {
  const perms = new Set<string>();

  // SUPERADMIN gets everything
  if (role === 'superadmin') {
    perms.add('*:*');
    return perms;
  }

  // Role-based permissions
  const rolePerms = await prisma.rolePermission.findMany({
    where: { role: role as any },
    include: { permission: true },
  });
  for (const rp of rolePerms) {
    perms.add(rp.permission.name);
  }

  // User-specific grants (override)
  const userPerms = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true },
  });
  for (const up of userPerms) {
    if (up.effect === 'deny') {
      perms.delete(up.permission.name);
    } else {
      perms.add(up.permission.name);
    }
  }

  return perms;
}

function matchPermission(required: string, granted: Set<string>): boolean {
  if (granted.has('*:*')) return true;
  if (granted.has(required)) return true;

  // Wildcard: module:* matches any action in that module
  const [reqModule] = required.split('.');
  if (granted.has(`${reqModule}:*`)) return true;

  return false;
}

export function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized: Authentication required', 401));
    }

    getUserPermissions(req.user.userId, req.user.role).then(userPerms => {
      const hasAll = permissions.every(p => matchPermission(p, userPerms));
      if (!hasAll) {
        return next(new AppError(`Forbidden: Required permission(s): ${permissions.join(', ')}`, 403));
      }
      next();
    }).catch(err => {
      next(new AppError('Error checking permissions', 500));
    });
  };
}

export { getUserPermissions, matchPermission };
