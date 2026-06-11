"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const zod_1 = require("zod");
const mfaEnableSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'token is required'),
    secret: zod_1.z.string().min(1, 'secret is required'),
});
const mfaVerifySchema = zod_1.z.object({
    tempToken: zod_1.z.string().min(1, 'tempToken is required'),
    code: zod_1.z.string().length(6, 'code must be 6 digits'),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8, 'newPassword must be at least 8 characters'),
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'refreshToken is required'),
});
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.AuthController.login);
router.post('/mfa/verify', (0, validate_1.validate)(mfaVerifySchema), auth_controller_1.AuthController.verifyMfa);
router.post('/refresh', (0, validate_1.validate)(refreshSchema), auth_controller_1.AuthController.refresh);
router.post('/logout', auth_1.requireAuth, auth_controller_1.AuthController.logout);
router.post('/change-password', auth_1.requireAuth, (0, validate_1.validate)(changePasswordSchema), auth_controller_1.AuthController.changePassword);
router.get('/me', auth_1.requireAuth, auth_controller_1.AuthController.me);
// MFA management (authenticated)
router.post('/mfa/generate', auth_1.requireAuth, auth_controller_1.AuthController.mfaGenerate);
router.post('/mfa/enable', auth_1.requireAuth, (0, validate_1.validate)(mfaEnableSchema), auth_controller_1.AuthController.mfaEnable);
router.post('/mfa/disable', auth_1.requireAuth, auth_controller_1.AuthController.mfaDisable);
router.get('/mfa/status', auth_1.requireAuth, auth_controller_1.AuthController.mfaStatus);
exports.default = router;
