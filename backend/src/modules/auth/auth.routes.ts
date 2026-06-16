import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { validate, validateLogin } from '../../middleware/validate';
import { z } from 'zod';

const mfaEnableSchema = z.object({
  token: z.string().min(1, 'token is required'),
  secret: z.string().min(1, 'secret is required'),
});

const createUserSchema = z.object({
  username: z.string().min(3, 'username must be at least 3 characters'),
  password: z.string().min(8, 'password must be at least 8 characters'),
  role: z.string().min(1, 'role is required'),
  email: z.string().email('invalid email').optional().nullable(),
});

const updateUserSchema = z.object({
  username: z.string().min(3, 'username must be at least 3 characters').optional(),
  email: z.string().email('invalid email').optional().nullable(),
  role: z.string().min(1).optional(),
  locked: z.boolean().optional(),
  password: z.string().min(8, 'password must be at least 8 characters').optional(),
  adminPassword: z.string().min(1, 'admin password is required').optional(),
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

router.post('/login', AuthController.login);
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
router.get('/users', requireAuth, requireRoles(['admin']), AuthController.listUsers);
router.delete('/users/trash/empty', requireAuth, requireRoles(['admin']), AuthController.emptyUserTrash);
router.get('/users/:id', requireAuth, requireRoles(['admin']), AuthController.getUser);
router.post('/users', requireAuth, requireRoles(['admin']), validate(createUserSchema), AuthController.createUser);
router.put('/users/:id', requireAuth, requireRoles(['admin']), validate(updateUserSchema), AuthController.updateUser);
router.delete('/users/:id', requireAuth, requireRoles(['admin']), AuthController.deleteUser);
router.post('/users/:id/restore', requireAuth, requireRoles(['admin']), AuthController.restoreUser);
router.delete('/users/:id/permanent', requireAuth, requireRoles(['admin']), AuthController.permanentDeleteUser);

export default router;
