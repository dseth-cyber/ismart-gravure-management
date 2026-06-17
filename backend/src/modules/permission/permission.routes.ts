import { Router } from 'express';
import { PermissionController } from './permission.controller';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { validate, validateCreatePermission } from '../../middleware/validate';
import { z } from 'zod';

const roleAssignSchema = z.object({
  permissionId: z.string().min(1),
  role: z.string().min(1, 'role is required'),
});

const userPermSchema = z.object({
  userId: z.string().min(1),
  permissionId: z.string().min(1),
});

const router = Router();

// All permission management routes require auth
router.use(requireAuth);

// Available to all authenticated users
router.get('/check', PermissionController.checkPermission);
router.get('/', PermissionController.listPermissions);
router.get('/users/me', PermissionController.getUserPermissions);
router.get('/scopes/user/me', PermissionController.getUserScopes);

// Admin-only routes (require admin role)
router.use(requireRoles(['admin']));

// Permissions CRUD (admin)
router.post('/', PermissionController.createPermission);
router.put('/:id', PermissionController.updatePermission);
router.delete('/:id', PermissionController.deletePermission);

// Role CRUD + role-permission mapping
router.get('/roles', PermissionController.listRoles);
router.post('/roles', PermissionController.createRole);
router.delete('/roles/:name', PermissionController.deleteRole);
router.get('/roles/:role', PermissionController.getRolePermissions);
router.post('/roles/assign', validate(roleAssignSchema), PermissionController.assignPermissionToRole);
router.post('/roles/remove', validate(roleAssignSchema), PermissionController.removePermissionFromRole);

// User permission overrides (admin manages other users)
router.post('/users/grant', validate(userPermSchema), PermissionController.grantUserPermission);
router.post('/users/deny', validate(userPermSchema), PermissionController.denyUserPermission);
router.post('/users/batch-grant', PermissionController.batchGrantUserPermissions);
router.post('/users/batch-deny', PermissionController.batchDenyUserPermissions);
router.get('/users/:userId', PermissionController.getUserPermissions);

// Scope management (admin)
router.get('/scopes', PermissionController.listScopes);
router.post('/scopes', PermissionController.createScope);
router.put('/scopes/:id', PermissionController.updateScope);
router.delete('/scopes/:id', PermissionController.deleteScope);
router.post('/scopes/assign', PermissionController.assignUserScope);
router.get('/scopes/user/:userId', PermissionController.getUserScopes);

export default router;
