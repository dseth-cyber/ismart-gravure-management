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

  static async updatePermission(id: string, data: { name: string; module: string; action: string; description?: string }) {
    return prisma.permission.update({
      where: { id },
      data,
    });
  }

  static async deletePermission(id: string) {
    return prisma.permission.delete({ where: { id } });
  }

  // ── Exists checks ──
  static async checkPermissionExists(field: string, value: string): Promise<boolean> {
    if (field === 'name') {
      const perm = await prisma.permission.findUnique({ where: { name: value } });
      return !!perm;
    }
    return false;
  }

  static async checkRoleExists(field: string, value: string): Promise<boolean> {
    if (field === 'name') {
      const role = await prisma.role.findUnique({ where: { name: value } });
      return !!role;
    }
    return false;
  }

  // ── Role CRUD ──
  static async listRoles() {
    return prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  static async createRole(name: string, description?: string) {
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) throw new AppError('Role already exists', 409);
    return prisma.role.create({ data: { name, description, isSystem: false } });
  }

  static async deleteRole(name: string) {
    const role = await prisma.role.findUnique({ where: { name } });
    if (!role) throw new AppError('Role not found', 404);
    if (role.isSystem) throw new AppError('Cannot delete system role', 400);
    await prisma.rolePermission.deleteMany({ where: { role: name as any } });
    return prisma.role.delete({ where: { name } });
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

  static async batchGrantUserPermissions(userId: string, permissionIds: string[]) {
    let count = 0;
    for (const permissionId of permissionIds) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId, permissionId } },
        update: { effect: 'grant' },
        create: { userId, permissionId, effect: 'grant' },
      });
      count++;
    }
    return count;
  }

  static async batchDenyUserPermissions(userId: string, permissionIds: string[]) {
    let count = 0;
    for (const permissionId of permissionIds) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId, permissionId } },
        update: { effect: 'deny' },
        create: { userId, permissionId, effect: 'deny' },
      });
      count++;
    }
    return count;
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

  static async updateScope(id: string, data: { type: string; name: string; parentId?: string | null }) {
    return prisma.scope.update({
      where: { id },
      data,
    });
  }

  static async deleteScope(id: string) {
    return prisma.scope.delete({
      where: { id },
    });
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
