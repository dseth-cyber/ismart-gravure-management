"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permission_controller_1 = require("./permission.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const zod_1 = require("zod");
const roleAssignSchema = zod_1.z.object({
    permissionId: zod_1.z.string().min(1),
    role: zod_1.z.enum(['superadmin', 'admin', 'sales', 'planner', 'production', 'qc', 'warehouse', 'inkroom', 'viewer']),
});
const userPermSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    permissionId: zod_1.z.string().min(1),
});
const router = (0, express_1.Router)();
// All permission management routes require auth
router.use(auth_1.requireAuth);
// Available to all authenticated users
router.get('/check', permission_controller_1.PermissionController.checkPermission);
router.get('/', permission_controller_1.PermissionController.listPermissions);
router.get('/users/me', permission_controller_1.PermissionController.getUserPermissions);
router.get('/scopes/user/me', permission_controller_1.PermissionController.getUserScopes);
// Admin-only routes
router.use((0, auth_1.requireRoles)(['admin']));
// Permissions CRUD (admin)
router.post('/', permission_controller_1.PermissionController.createPermission);
router.delete('/:id', permission_controller_1.PermissionController.deletePermission);
// Role-permission mapping
router.get('/roles/:role', permission_controller_1.PermissionController.getRolePermissions);
router.post('/roles/assign', (0, validate_1.validate)(roleAssignSchema), permission_controller_1.PermissionController.assignPermissionToRole);
router.post('/roles/remove', (0, validate_1.validate)(roleAssignSchema), permission_controller_1.PermissionController.removePermissionFromRole);
// User permission overrides (admin manages other users)
router.post('/users/grant', (0, validate_1.validate)(userPermSchema), permission_controller_1.PermissionController.grantUserPermission);
router.post('/users/deny', (0, validate_1.validate)(userPermSchema), permission_controller_1.PermissionController.denyUserPermission);
router.get('/users/:userId', permission_controller_1.PermissionController.getUserPermissions);
// Scope management (admin)
router.get('/scopes', permission_controller_1.PermissionController.listScopes);
router.post('/scopes', permission_controller_1.PermissionController.createScope);
router.post('/scopes/assign', permission_controller_1.PermissionController.assignUserScope);
router.get('/scopes/user/:userId', permission_controller_1.PermissionController.getUserScopes);
exports.default = router;
