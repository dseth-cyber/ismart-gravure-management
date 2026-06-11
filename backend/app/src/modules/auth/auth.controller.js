"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const mfa_service_1 = require("./mfa.service");
const audit_service_1 = require("../audit/audit.service");
const database_1 = require("../../config/database");
class AuthController {
    static async login(req, res, next) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'Username and password are required' });
            }
            const result = await auth_service_1.AuthService.login(username, password);
            await audit_service_1.AuditService.record(req, 'auth.login', `User ${username} logged in successfully`, result.user?.id, result.user?.username);
            return res.status(200).json({ status: 'success', statusCode: 200, data: result });
        }
        catch (error) {
            const { username } = req.body;
            if (username) {
                await audit_service_1.AuditService.record(req, 'auth.login.failed', `Failed login attempt for username: ${username}`);
            }
            next(error);
        }
    }
    static async verifyMfa(req, res, next) {
        try {
            const { tempToken, totpCode } = req.body;
            if (!tempToken || !totpCode) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'Temp token and TOTP code are required' });
            }
            const result = await auth_service_1.AuthService.verifyMfa(tempToken, totpCode);
            await audit_service_1.AuditService.record(req, 'auth.mfa.verify', `User ${result.user.username} completed MFA verification`, result.user.id, result.user.username);
            return res.status(200).json({ status: 'success', statusCode: 200, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'Refresh token is required' });
            }
            const result = await auth_service_1.AuthService.refresh(refreshToken);
            return res.status(200).json({ status: 'success', statusCode: 200, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await auth_service_1.AuthService.logout(refreshToken);
            }
            else if (req.user) {
                await auth_service_1.AuthService.logoutAll(req.user.userId);
            }
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Logged out successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    static async changePassword(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' });
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'Current and new passwords are required' });
            }
            await auth_service_1.AuthService.changePassword(req.user.userId, currentPassword, newPassword);
            await audit_service_1.AuditService.record(req, 'auth.password.change', `User ${req.user.username} changed password`, req.user.userId, req.user.username);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Password changed successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' });
            }
            const profile = await auth_service_1.AuthService.getUserProfile(req.user.userId);
            return res.status(200).json({ status: 'success', statusCode: 200, data: profile });
        }
        catch (error) {
            next(error);
        }
    }
    // ── MFA Management ──
    static async mfaGenerate(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' });
            }
            const { secret, uri } = mfa_service_1.MfaService.generateSecret();
            await database_1.prisma.user.update({
                where: { id: req.user.userId },
                data: { mfaSecret: secret },
            });
            return res.status(200).json({
                status: 'success',
                statusCode: 200,
                data: { secret, uri },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async mfaEnable(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' });
            }
            const { totpCode } = req.body;
            if (!totpCode) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'TOTP code is required' });
            }
            const result = await mfa_service_1.MfaService.enable(req.user.userId, totpCode);
            await audit_service_1.AuditService.record(req, 'auth.mfa.enable', `User ${req.user.username} enabled MFA`, req.user.userId, req.user.username);
            return res.status(200).json({
                status: 'success',
                statusCode: 200,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async mfaDisable(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' });
            }
            const { totpCode } = req.body;
            if (!totpCode) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'TOTP code or backup code is required' });
            }
            await mfa_service_1.MfaService.disable(req.user.userId, totpCode);
            await audit_service_1.AuditService.record(req, 'auth.mfa.disable', `User ${req.user.username} disabled MFA`, req.user.userId, req.user.username);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'MFA disabled successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    static async mfaStatus(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' });
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { mfaEnabled: true, mfaSecret: true },
            });
            return res.status(200).json({
                status: 'success',
                statusCode: 200,
                data: {
                    mfaEnabled: user?.mfaEnabled || false,
                    hasSecret: !!user?.mfaSecret,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
