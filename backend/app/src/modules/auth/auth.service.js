"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../../config/database");
const redis_1 = require("../../config/redis");
const env_1 = require("../../config/env");
const error_1 = require("../../middleware/error");
const mfa_service_1 = require("./mfa.service");
const ldap_service_1 = require("./ldap.service");
class AuthService {
    // ── Password Policy ──
    static validatePassword(password) {
        if (password.length < env_1.env.PASSWORD_MIN_LENGTH) {
            throw new error_1.AppError(`Password must be at least ${env_1.env.PASSWORD_MIN_LENGTH} characters`, 400);
        }
        if (!/[A-Z]/.test(password))
            throw new error_1.AppError('Password must contain an uppercase letter', 400);
        if (!/[a-z]/.test(password))
            throw new error_1.AppError('Password must contain a lowercase letter', 400);
        if (!/[0-9]/.test(password))
            throw new error_1.AppError('Password must contain a number', 400);
        if (!/[^A-Za-z0-9]/.test(password))
            throw new error_1.AppError('Password must contain a special character', 400);
    }
    // ── Token Generation ──
    static generateAccessToken(user) {
        return jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
    }
    static generateTempToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, purpose: 'mfa' }, env_1.env.JWT_SECRET, { expiresIn: '5m' });
    }
    static async generateRefreshToken(userId) {
        const token = crypto_1.default.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await database_1.prisma.refreshToken.create({
            data: { token, userId, expiresAt },
        });
        return token;
    }
    static decodeAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch {
            return null;
        }
    }
    static decodeTempToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch {
            return null;
        }
    }
    // ── Login ──
    static async login(username, password) {
        const user = await database_1.prisma.user.findUnique({ where: { username } });
        if (!user) {
            throw new error_1.AppError('Invalid username or password', 400);
        }
        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new error_1.AppError(`Account locked. Try again in ${minutesLeft} minute(s)`, 423);
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        // Fallback: try LDAP if local password fails
        const ldapResult = !isMatch ? await ldap_service_1.LdapService.authenticate(username, password) : null;
        if (!isMatch && (!ldapResult || !ldapResult.authenticated)) {
            const attempts = user.failedLoginAttempts + 1;
            const updates = { failedLoginAttempts: attempts };
            if (attempts >= env_1.env.MAX_LOGIN_ATTEMPTS) {
                updates.lockedUntil = new Date(Date.now() + env_1.env.LOCKOUT_DURATION_MINUTES * 60 * 1000);
            }
            await database_1.prisma.user.update({ where: { id: user.id }, data: updates });
            throw new error_1.AppError('Invalid username or password', 400);
        }
        // Sync LDAP user info on successful LDAP auth
        if (ldapResult && ldapResult.authenticated) {
            await ldap_service_1.LdapService.syncUser(username, ldapResult);
        }
        // Reset failed attempts on success
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
        });
        // Check MFA requirement
        if (user.mfaEnabled) {
            const tempToken = this.generateTempToken(user.id);
            return {
                mfaRequired: true,
                tempToken,
                user: { id: user.id, username: user.username, role: user.role },
            };
        }
        // Enforce max concurrent sessions
        await this.enforceSessionLimit(user.id);
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60,
            user: { id: user.id, username: user.username, role: user.role },
        };
    }
    // ── MFA Login (second factor) ──
    static async verifyMfa(tempToken, totpCode) {
        const payload = this.decodeTempToken(tempToken);
        if (!payload || payload.purpose !== 'mfa') {
            throw new error_1.AppError('Invalid or expired MFA token', 401);
        }
        const valid = await mfa_service_1.MfaService.verify(payload.userId, totpCode);
        if (!valid) {
            throw new error_1.AppError('Invalid TOTP code', 400);
        }
        const user = await database_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            throw new error_1.AppError('User not found', 404);
        await this.enforceSessionLimit(user.id);
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60,
            user: { id: user.id, username: user.username, role: user.role },
        };
    }
    // ── Token Refresh ──
    static async refresh(refreshToken) {
        const stored = await database_1.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            throw new error_1.AppError('Invalid or expired refresh token', 401);
        }
        // Revoke old token (rotation)
        await database_1.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
        // Blacklist in Redis for fast check
        const redis = (0, redis_1.getRedis)();
        await redis.set(`blacklist:${refreshToken}`, '1', 'EX', 7 * 24 * 3600);
        const user = await database_1.prisma.user.findUnique({ where: { id: stored.userId } });
        if (!user)
            throw new error_1.AppError('User not found', 404);
        // Enforce session limit
        await this.enforceSessionLimit(user.id);
        const accessToken = this.generateAccessToken(user);
        const newRefreshToken = await this.generateRefreshToken(user.id);
        return {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 15 * 60,
        };
    }
    // ── Logout ──
    static async logout(refreshToken) {
        await database_1.prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: { revoked: true },
        });
        const redis = (0, redis_1.getRedis)();
        await redis.set(`blacklist:${refreshToken}`, '1', 'EX', 7 * 24 * 3600);
    }
    // ── Logout All Sessions ──
    static async logoutAll(userId) {
        await database_1.prisma.refreshToken.updateMany({
            where: { userId, revoked: false },
            data: { revoked: true },
        });
    }
    // ── Session Limit ──
    static async enforceSessionLimit(userId) {
        const activeSessions = await database_1.prisma.refreshToken.findMany({
            where: { userId, revoked: false, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });
        if (activeSessions.length >= env_1.env.MAX_CONCURRENT_SESSIONS) {
            const toRevoke = activeSessions.slice(env_1.env.MAX_CONCURRENT_SESSIONS - 1);
            await database_1.prisma.refreshToken.updateMany({
                where: { id: { in: toRevoke.map(s => s.id) } },
                data: { revoked: true },
            });
        }
    }
    // ── Change Password ──
    static async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new error_1.AppError('User not found', 404);
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch)
            throw new error_1.AppError('Current password is incorrect', 400);
        this.validatePassword(newPassword);
        // Check password history (last 5)
        const history = user.passwordHistory || [];
        for (const hash of history) {
            if (await bcryptjs_1.default.compare(newPassword, hash)) {
                throw new error_1.AppError('Cannot reuse a recent password', 400);
            }
        }
        const newHash = await bcryptjs_1.default.hash(newPassword, 12);
        const newHistory = [user.passwordHash, ...history].slice(0, 5);
        await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newHash,
                passwordHistory: newHistory,
                lastPasswordChange: new Date(),
            },
        });
        // Revoke all sessions on password change
        await this.logoutAll(userId);
    }
    // ── LDAP Authentication ──
    static async ldapAuthenticate(username, password) {
        const result = await ldap_service_1.LdapService.authenticate(username, password);
        return result.authenticated;
    }
    static async getUserProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                role: true,
                mfaEnabled: true,
                createdAt: true,
                updatedAt: true,
                lastPasswordChange: true,
                failedLoginAttempts: true,
                lockedUntil: true,
            },
        });
        if (!user)
            throw new error_1.AppError('User not found', 404);
        return user;
    }
}
exports.AuthService = AuthService;
