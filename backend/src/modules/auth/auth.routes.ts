import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

const mfaEnableSchema = z.object({
  token: z.string().min(1, 'token is required'),
  secret: z.string().min(1, 'secret is required'),
});

const permissionOverrideSchema = z.object({
  permissionId: z.string().min(1),
  effect: z.enum(['grant', 'deny']),
});

const createUserSchema = z.object({
  username: z.string().min(3, 'username must be at least 3 characters'),
  password: z.string().min(8, 'password must be at least 8 characters'),
  role: z.string().min(1, 'role is required'),
  email: z.string().email('invalid email').optional().nullable(),
  permissions: z.array(permissionOverrideSchema).optional(),
});

const updateUserSchema = z.object({
  username: z.string().min(3, 'username must be at least 3 characters').optional(),
  email: z.string().email('invalid email').optional().nullable(),
  role: z.string().min(1).optional(),
  locked: z.boolean().optional(),
  password: z.string().min(8, 'password must be at least 8 characters').optional(),
  adminPassword: z.string().min(1, 'admin password is required').optional(),
  permissions: z.array(permissionOverrideSchema).optional(),
});

const mfaVerifySchema = z.object({
  tempToken: z.string().min(1, 'tempToken is required'),
  code: z.string().length(6, 'code must be 6 digits'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'newPassword must be at least 8 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/mfa/verify', validate(mfaVerifySchema), AuthController.verifyMfa);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.post('/logout', requireAuth, AuthController.logout);
router.post('/change-password', requireAuth, validate(changePasswordSchema), AuthController.changePassword);
router.get('/me', requireAuth, AuthController.me);

// MFA management (authenticated)
router.post('/mfa/generate', requireAuth, AuthController.mfaGenerate);
router.post('/mfa/enable', requireAuth, validate(mfaEnableSchema), AuthController.mfaEnable);
router.post('/mfa/disable', requireAuth, AuthController.mfaDisable);
router.get('/mfa/status', requireAuth, AuthController.mfaStatus);

// ── User Management (admin) ──
router.get('/users', requireAuth, requirePermission('auth:users.read'), AuthController.listUsers);
router.delete('/users/trash/empty', requireAuth, requirePermission('auth:users.delete'), AuthController.emptyUserTrash);
router.get('/users/exists', requireAuth, requirePermission('auth:users.read'), AuthController.checkUserExists);
router.get('/users/:id', requireAuth, requirePermission('auth:users.read'), AuthController.getUser);
router.post('/users', requireAuth, requirePermission('auth:users.create'), validate(createUserSchema), AuthController.createUser);
router.put('/users/:id', requireAuth, requirePermission('auth:users.update'), validate(updateUserSchema), AuthController.updateUser);
router.delete('/users/:id', requireAuth, requirePermission('auth:users.delete'), AuthController.deleteUser);
router.post('/users/:id/restore', requireAuth, requirePermission('auth:users.delete'), AuthController.restoreUser);
router.delete('/users/:id/permanent', requireAuth, requirePermission('auth:users.delete'), AuthController.permanentDeleteUser);

export default router;
