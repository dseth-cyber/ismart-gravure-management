"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
const permission_service_1 = require("./permission.service");
const audit_service_1 = require("../audit/audit.service");
class PermissionController {
    // ── List all permissions ──
    static async listPermissions(req, res, next) {
        try {
            const permissions = await permission_service_1.PermissionService.listPermissions();
            return res.status(200).json({ status: 'success', statusCode: 200, data: permissions });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Create a permission ──
    static async createPermission(req, res, next) {
        try {
            const { name, module, action, description } = req.body;
            if (!name || !module || !action) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'name, module, action are required' });
            }
            const perm = await permission_service_1.PermissionService.createPermission({ name, module, action, description });
            await audit_service_1.AuditService.record(req, 'permission.create', `Created permission: ${name}`);
            return res.status(201).json({ status: 'success', statusCode: 201, data: perm });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Delete a permission ──
    static async deletePermission(req, res, next) {
        try {
            const id = String(req.params.id);
            await permission_service_1.PermissionService.deletePermission(id);
            await audit_service_1.AuditService.record(req, 'permission.delete', `Deleted permission: ${id}`);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Get role permissions ──
    static async getRolePermissions(req, res, next) {
        try {
            const perms = await permission_service_1.PermissionService.getRolePermissions(String(req.params.role));
            return res.status(200).json({ status: 'success', statusCode: 200, data: perms });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Assign permission to role ──
    static async assignPermissionToRole(req, res, next) {
        try {
            const { role, permissionId } = req.body;
            if (!role || !permissionId) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'role and permissionId required' });
            }
            await permission_service_1.PermissionService.assignPermissionToRole(role, permissionId);
            await audit_service_1.AuditService.record(req, 'permission.assign_role', `Assigned permission ${permissionId} to role ${role}`);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission assigned to role' });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Remove permission from role ──
    static async removePermissionFromRole(req, res, next) {
        try {
            const { role, permissionId } = req.body;
            await permission_service_1.PermissionService.removePermissionFromRole(role, permissionId);
            await audit_service_1.AuditService.record(req, 'permission.remove_role', `Removed permission ${permissionId} from role ${role}`);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission removed from role' });
        }
        catch (error) {
            next(error);
        }
    }
    // ── User permission overrides ──
    static async grantUserPermission(req, res, next) {
        try {
            const { userId, permissionId } = req.body;
            await permission_service_1.PermissionService.grantUserPermission(userId, permissionId);
            await audit_service_1.AuditService.record(req, 'permission.grant_user', `Granted permission ${permissionId} to user ${userId}`);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission granted to user' });
        }
        catch (error) {
            next(error);
        }
    }
    static async denyUserPermission(req, res, next) {
        try {
            const { userId, permissionId } = req.body;
            await permission_service_1.PermissionService.denyUserPermission(userId, permissionId);
            await audit_service_1.AuditService.record(req, 'permission.deny_user', `Denied permission ${permissionId} for user ${userId}`);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission denied for user' });
        }
        catch (error) {
            next(error);
        }
    }
    static async getUserPermissions(req, res, next) {
        try {
            const userId = String(req.params.userId || req.user?.userId || '');
            const perms = await permission_service_1.PermissionService.getUserPermissions(userId);
            return res.status(200).json({ status: 'success', statusCode: 200, data: perms });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Check current user's permission ──
    static async checkPermission(req, res, next) {
        try {
            const permissionName = String(req.query.permission || '');
            if (!permissionName) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'permission query param required' });
            }
            const { matchPermission } = require('../../middleware/permission');
            const { getUserPermissions } = require('../../middleware/permission');
            const perms = await getUserPermissions(req.user.userId, req.user.role);
            const allowed = matchPermission(permissionName, perms);
            return res.status(200).json({ status: 'success', statusCode: 200, data: { permission: permissionName, allowed } });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Scopes ──
    static async listScopes(req, res, next) {
        try {
            const scopes = await permission_service_1.PermissionService.listScopes();
            return res.status(200).json({ status: 'success', statusCode: 200, data: scopes });
        }
        catch (error) {
            next(error);
        }
    }
    static async createScope(req, res, next) {
        try {
            const { type, name, parentId } = req.body;
            if (!type || !name) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'type and name required' });
            }
            const scope = await permission_service_1.PermissionService.createScope({ type, name, parentId });
            return res.status(201).json({ status: 'success', statusCode: 201, data: scope });
        }
        catch (error) {
            next(error);
        }
    }
    static async assignUserScope(req, res, next) {
        try {
            const { userId, scopeId } = req.body;
            await permission_service_1.PermissionService.assignUserScope(userId, scopeId);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Scope assigned to user' });
        }
        catch (error) {
            next(error);
        }
    }
    static async getUserScopes(req, res, next) {
        try {
            const userId = String(req.params.userId || req.user?.userId || '');
            const scopes = await permission_service_1.PermissionService.getUserScopes(userId);
            return res.status(200).json({ status: 'success', statusCode: 200, data: scopes });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PermissionController = PermissionController;
