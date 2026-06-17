import { Request, Response, NextFunction } from 'express';
import { PermissionService } from './permission.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuditService } from '../audit/audit.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class PermissionController {
  // ── List all permissions ──
  static async listPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const permissions = await PermissionService.listPermissions();
      return res.status(200).json({ status: 'success', statusCode: 200, data: permissions } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Create a permission ──
  static async createPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { name, module, action, description } = req.body;
      if (!name || !module || !action) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'name, module, action are required' } as ApiResponse);
      }
      const perm = await PermissionService.createPermission({ name, module, action, description });
      await AuditService.record(req, 'permission.create', `Created permission: ${name}`);
      return res.status(201).json({ status: 'success', statusCode: 201, data: perm } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Delete a permission ──
  static async deletePermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      await PermissionService.deletePermission(id);
      await AuditService.record(req, 'permission.delete', `Deleted permission: ${id}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission deleted' } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Update a permission ──
  static async updatePermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const { name, module, action, description } = req.body;
      if (!name || !module || !action) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'name, module, action are required' } as ApiResponse);
      }
      const perm = await PermissionService.updatePermission(id, { name, module, action, description });
      await AuditService.record(req, 'permission.update', `Updated permission: ${name}`);
      return res.status(200).json({ status: 'success', statusCode: 200, data: perm } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Get role permissions ──
  static async getRolePermissions(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const perms = await PermissionService.getRolePermissions(String(req.params.role));
      return res.status(200).json({ status: 'success', statusCode: 200, data: perms } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Assign permission to role ──
  static async assignPermissionToRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { role, permissionId } = req.body;
      if (!role || !permissionId) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'role and permissionId required' } as ApiResponse);
      }
      await PermissionService.assignPermissionToRole(role, permissionId);
      await AuditService.record(req, 'permission.assign_role', `Assigned permission ${permissionId} to role ${role}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission assigned to role' } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Remove permission from role ──
  static async removePermissionFromRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { role, permissionId } = req.body;
      await PermissionService.removePermissionFromRole(role, permissionId);
      await AuditService.record(req, 'permission.remove_role', `Removed permission ${permissionId} from role ${role}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission removed from role' } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── User permission overrides ──
  static async grantUserPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId, permissionId } = req.body;
      await PermissionService.grantUserPermission(userId, permissionId);
      await AuditService.record(req, 'permission.grant_user', `Granted permission ${permissionId} to user ${userId}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission granted to user' } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async denyUserPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId, permissionId } = req.body;
      await PermissionService.denyUserPermission(userId, permissionId);
      await AuditService.record(req, 'permission.deny_user', `Denied permission ${permissionId} for user ${userId}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Permission denied for user' } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async batchGrantUserPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId, permissionIds } = req.body;
      if (!userId || !permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'userId and permissionIds[] are required' } as ApiResponse);
      }
      const results = await PermissionService.batchGrantUserPermissions(userId, permissionIds);
      await AuditService.record(req, 'permission.batch_grant', `Batch granted ${results} permissions to user ${userId}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: `Granted ${results} permissions` } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async batchDenyUserPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId, permissionIds } = req.body;
      if (!userId || !permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'userId and permissionIds[] are required' } as ApiResponse);
      }
      const results = await PermissionService.batchDenyUserPermissions(userId, permissionIds);
      await AuditService.record(req, 'permission.batch_deny', `Batch denied ${results} permissions for user ${userId}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: `Denied ${results} permissions` } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getUserPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = String(req.params.userId || req.user?.userId || '');
      const perms = await PermissionService.getUserPermissions(userId);
      return res.status(200).json({ status: 'success', statusCode: 200, data: perms } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Check current user's permission ──
  static async checkPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const permissionName = String(req.query.permission || '');
      if (!permissionName) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'permission query param required' } as ApiResponse);
      }
      const { matchPermission } = require('../../middleware/permission');
      const { getUserPermissions } = require('../../middleware/permission');
      const perms = await getUserPermissions(req.user!.userId, req.user!.role);
      const allowed = matchPermission(permissionName, perms);
      return res.status(200).json({ status: 'success', statusCode: 200, data: { permission: permissionName, allowed } } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Role CRUD ──
  static async listRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const roles = await PermissionService.listRoles();
      return res.status(200).json({ status: 'success', statusCode: 200, data: roles } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ status: 'error', statusCode: 400, message: 'name is required' } as ApiResponse);
      const role = await PermissionService.createRole(name.toLowerCase().trim(), description);
      await AuditService.record(req, 'role.create', `Created role: ${name}`);
      return res.status(201).json({ status: 'success', statusCode: 201, data: role } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async deleteRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const name = String(req.params.name);
      await PermissionService.deleteRole(name);
      await AuditService.record(req, 'role.delete', `Deleted role: ${name}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Role deleted' } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Scopes ──
  static async listScopes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const scopes = await PermissionService.listScopes();
      return res.status(200).json({ status: 'success', statusCode: 200, data: scopes } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async createScope(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { type, name, parentId } = req.body;
      if (!type || !name) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'type and name required' } as ApiResponse);
      }
      const scope = await PermissionService.createScope({ type, name, parentId });
      return res.status(201).json({ status: 'success', statusCode: 201, data: scope } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async updateScope(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const { type, name, parentId } = req.body;
      if (!type || !name) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'type and name required' } as ApiResponse);
      }
      const scope = await PermissionService.updateScope(id, { type, name, parentId });
      await AuditService.record(req, 'scope.update', `Updated scope: ${name}`);
      return res.status(200).json({ status: 'success', statusCode: 200, data: scope } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async deleteScope(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      await PermissionService.deleteScope(id);
      await AuditService.record(req, 'scope.delete', `Deleted scope: ${id}`);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Scope deleted' } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async assignUserScope(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { userId, scopeId } = req.body;
      await PermissionService.assignUserScope(userId, scopeId);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Scope assigned to user' } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getUserScopes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = String(req.params.userId || req.user?.userId || '');
      const scopes = await PermissionService.getUserScopes(userId);
      return res.status(200).json({ status: 'success', statusCode: 200, data: scopes } as ApiResponse);
    } catch (error) { next(error); }
  }
}
