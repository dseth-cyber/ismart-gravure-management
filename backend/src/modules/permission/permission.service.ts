import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';

export class PermissionService {
  // ── Permission CRUD ──
  static async listPermissions() {
    return prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  }

  static async createPermission(data: { name: string; module: string; action: string; description?: string }) {
    const existing = await prisma.permission.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Permission already exists', 409);
    return prisma.permission.create({ data });
  }

  static async deletePermission(id: string) {
    return prisma.permission.delete({ where: { id } });
  }

  // ── Role-Permission Mapping ──
  static async getRolePermissions(role: string) {
    const rps = await prisma.rolePermission.findMany({
      where: { role: role as any },
      include: { permission: true },
    });
    return rps.map(rp => rp.permission);
  }

  static async assignPermissionToRole(role: string, permissionId: string) {
    const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) throw new AppError('Permission not found', 404);

    return prisma.rolePermission.upsert({
      where: { role_permissionId: { role: role as any, permissionId } },
      update: {},
      create: { role: role as any, permissionId },
    });
  }

  static async removePermissionFromRole(role: string, permissionId: string) {
    return prisma.rolePermission.deleteMany({
      where: { role: role as any, permissionId },
    });
  }

  // ── User Permission Override ──
  static async grantUserPermission(userId: string, permissionId: string) {
    return prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId } },
      update: { effect: 'grant' },
      create: { userId, permissionId, effect: 'grant' },
    });
  }

  static async denyUserPermission(userId: string, permissionId: string) {
    return prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId } },
      update: { effect: 'deny' },
      create: { userId, permissionId, effect: 'deny' },
    });
  }

  static async removeUserPermission(userId: string, permissionId: string) {
    return prisma.userPermission.deleteMany({
      where: { userId, permissionId },
    });
  }

  static async getUserPermissions(userId: string) {
    return prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
  }

  // ── Scope Management ──
  static async listScopes() {
    return prisma.scope.findMany({ include: { children: true } });
  }

  static async createScope(data: { type: string; name: string; parentId?: string }) {
    return prisma.scope.create({ data });
  }

  static async assignUserScope(userId: string, scopeId: string) {
    return prisma.userScope.upsert({
      where: { userId_scopeId: { userId, scopeId } },
      update: {},
      create: { userId, scopeId },
    });
  }

  static async removeUserScope(userId: string, scopeId: string) {
    return prisma.userScope.deleteMany({ where: { userId, scopeId } });
  }

  static async getUserScopes(userId: string) {
    return prisma.userScope.findMany({
      where: { userId },
      include: { scope: true },
    });
  }
}
