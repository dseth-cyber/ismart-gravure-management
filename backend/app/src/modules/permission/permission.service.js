"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class PermissionService {
    // ── Permission CRUD ──
    static async listPermissions() {
        return database_1.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
    }
    static async createPermission(data) {
        const existing = await database_1.prisma.permission.findUnique({ where: { name: data.name } });
        if (existing)
            throw new error_1.AppError('Permission already exists', 409);
        return database_1.prisma.permission.create({ data });
    }
    static async deletePermission(id) {
        return database_1.prisma.permission.delete({ where: { id } });
    }
    // ── Role-Permission Mapping ──
    static async getRolePermissions(role) {
        const rps = await database_1.prisma.rolePermission.findMany({
            where: { role: role },
            include: { permission: true },
        });
        return rps.map(rp => rp.permission);
    }
    static async assignPermissionToRole(role, permissionId) {
        const permission = await database_1.prisma.permission.findUnique({ where: { id: permissionId } });
        if (!permission)
            throw new error_1.AppError('Permission not found', 404);
        return database_1.prisma.rolePermission.upsert({
            where: { role_permissionId: { role: role, permissionId } },
            update: {},
            create: { role: role, permissionId },
        });
    }
    static async removePermissionFromRole(role, permissionId) {
        return database_1.prisma.rolePermission.deleteMany({
            where: { role: role, permissionId },
        });
    }
    // ── User Permission Override ──
    static async grantUserPermission(userId, permissionId) {
        return database_1.prisma.userPermission.upsert({
            where: { userId_permissionId: { userId, permissionId } },
            update: { effect: 'grant' },
            create: { userId, permissionId, effect: 'grant' },
        });
    }
    static async denyUserPermission(userId, permissionId) {
        return database_1.prisma.userPermission.upsert({
            where: { userId_permissionId: { userId, permissionId } },
            update: { effect: 'deny' },
            create: { userId, permissionId, effect: 'deny' },
        });
    }
    static async removeUserPermission(userId, permissionId) {
        return database_1.prisma.userPermission.deleteMany({
            where: { userId, permissionId },
        });
    }
    static async getUserPermissions(userId) {
        return database_1.prisma.userPermission.findMany({
            where: { userId },
            include: { permission: true },
        });
    }
    // ── Scope Management ──
    static async listScopes() {
        return database_1.prisma.scope.findMany({ include: { children: true } });
    }
    static async createScope(data) {
        return database_1.prisma.scope.create({ data });
    }
    static async assignUserScope(userId, scopeId) {
        return database_1.prisma.userScope.upsert({
            where: { userId_scopeId: { userId, scopeId } },
            update: {},
            create: { userId, scopeId },
        });
    }
    static async removeUserScope(userId, scopeId) {
        return database_1.prisma.userScope.deleteMany({ where: { userId, scopeId } });
    }
    static async getUserScopes(userId) {
        return database_1.prisma.userScope.findMany({
            where: { userId },
            include: { scope: true },
        });
    }
}
exports.PermissionService = PermissionService;
