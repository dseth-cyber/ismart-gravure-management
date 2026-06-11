import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';
import { validate, validateLogin } from '../../middleware/validate';
import { z } from 'zod';

const mfaEnableSchema = z.object({
  token: z.string().min(1, 'token is required'),
  secret: z.string().min(1, 'secret is required'),
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

export default router;
