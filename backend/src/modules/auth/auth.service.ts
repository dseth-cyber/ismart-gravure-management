import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { getRedis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error';
import { MfaService } from './mfa.service';
import { LdapService } from './ldap.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  // ── Password Policy ──
  static validatePassword(password: string): void {
    if (password.length < env.PASSWORD_MIN_LENGTH) {
      throw new AppError(`Password must be at least ${env.PASSWORD_MIN_LENGTH} characters`, 400);
    }
    if (!/[A-Z]/.test(password)) throw new AppError('Password must contain an uppercase letter', 400);
    if (!/[a-z]/.test(password)) throw new AppError('Password must contain a lowercase letter', 400);
    if (!/[0-9]/.test(password)) throw new AppError('Password must contain a number', 400);
    if (!/[^A-Za-z0-9]/.test(password)) throw new AppError('Password must contain a special character', 400);
  }

  // ── Token Generation ──
  static generateAccessToken(user: { id: string; username: string; role: string }): string {
    return jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );
  }

  static generateTempToken(userId: string): string {
    return jwt.sign(
      { userId, purpose: 'mfa' },
      env.JWT_SECRET,
      { expiresIn: '5m' }
    );
  }

  static async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  static decodeAccessToken(token: string): { userId: string; username: string; role: string } | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as any;
    } catch {
      return null;
    }
  }

  static decodeTempToken(token: string): { userId: string; purpose: string } | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as any;
    } catch {
      return null;
    }
  }

  // ── Login ──
  static async login(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || user.deletedAt) {
      throw new AppError('Invalid username or password', 400);
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${minutesLeft} minute(s)`, 423);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    // Fallback: try LDAP if local password fails
    const ldapResult = !isMatch ? await LdapService.authenticate(username, password) : null;

    if (!isMatch && (!ldapResult || !ldapResult.authenticated)) {
      const attempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: attempts };
      if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + env.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });
      throw new AppError('Invalid username or password', 400);
    }

    // Sync LDAP user info on successful LDAP auth
    if (ldapResult && ldapResult.authenticated) {
      await LdapService.syncUser(username, ldapResult);
    }

    // Reset failed attempts on success
    await prisma.user.update({
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
  static async verifyMfa(tempToken: string, totpCode: string) {
    const payload = this.decodeTempToken(tempToken);
    if (!payload || payload.purpose !== 'mfa') {
      throw new AppError('Invalid or expired MFA token', 401);
    }

    const valid = await MfaService.verify(payload.userId, totpCode);
    if (!valid) {
      throw new AppError('Invalid TOTP code', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new AppError('User not found', 404);

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
  static async refresh(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    // Blacklist in Redis for fast check
    const redis = getRedis();
    await redis.set(`blacklist:${refreshToken}`, '1', 'EX', 7 * 24 * 3600);

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new AppError('User not found', 404);

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
  static async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
    const redis = getRedis();
    await redis.set(`blacklist:${refreshToken}`, '1', 'EX', 7 * 24 * 3600);
  }

  // ── Logout All Sessions ──
  static async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  // ── Session Limit ──
  static async enforceSessionLimit(userId: string): Promise<void> {
    const activeSessions = await prisma.refreshToken.findMany({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (activeSessions.length >= env.MAX_CONCURRENT_SESSIONS) {
      const toRevoke = activeSessions.slice(env.MAX_CONCURRENT_SESSIONS - 1);
      await prisma.refreshToken.updateMany({
        where: { id: { in: toRevoke.map(s => s.id) } },
        data: { revoked: true },
      });
    }
  }

  // ── Change Password ──
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    this.validatePassword(newPassword);

    // Check password history (last 5)
    const history = user.passwordHistory || [];
    for (const hash of history) {
      if (await bcrypt.compare(newPassword, hash)) {
        throw new AppError('Cannot reuse a recent password', 400);
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const newHistory = [user.passwordHash, ...history].slice(0, 5);

    await prisma.user.update({
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
  static async ldapAuthenticate(username: string, password: string): Promise<boolean> {
    const result = await LdapService.authenticate(username, password);
    return result.authenticated;
  }

  // ── User Management (Admin) ──
  static async listUsers(showDeleted = false) {
    return prisma.user.findMany({
      where: { deletedAt: showDeleted ? { not: null } : null },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        mfaEnabled: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        lastPasswordChange: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        mfaEnabled: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
        lastPasswordChange: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static async createUser(username: string, password: string, role: string, email?: string | null, permissions?: { permissionId: string; effect: string }[]) {
    const existing = await prisma.user.findFirst({ where: { username, deletedAt: null } });
    if (existing) throw new AppError('Username already exists', 409);
    this.validatePassword(password);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email: email || null, passwordHash, role: role as any },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    if (permissions && permissions.length > 0) {
      for (const p of permissions) {
        await prisma.userPermission.upsert({
          where: { userId_permissionId: { userId: user.id, permissionId: p.permissionId } },
          update: { effect: p.effect },
          create: { userId: user.id, permissionId: p.permissionId, effect: p.effect },
        });
      }
    }
    return user;
  }

  static async updateUser(id: string, data: { role?: string; locked?: boolean; password?: string; username?: string; email?: string | null; adminPassword?: string; adminId?: string; permissions?: { permissionId: string; effect: string }[] }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    if (data.adminPassword) {
      if (!data.adminId) throw new AppError('Admin authentication required', 400);
      const admin = await prisma.user.findUnique({ where: { id: data.adminId } });
      if (!admin) throw new AppError('Admin not found', 404);
      const valid = await bcrypt.compare(data.adminPassword, admin.passwordHash);
      if (!valid) throw new AppError('Admin password is incorrect', 403);
    }
    if (data.username && data.username !== user.username) {
      const existing = await prisma.user.findFirst({ where: { username: data.username, deletedAt: null, id: { not: id } } });
      if (existing) throw new AppError('Username already taken', 409);
    }
    const updateData: any = {};
    if (data.username) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.locked === true) updateData.lockedUntil = new Date('2099-12-31');
    if (data.locked === false) updateData.lockedUntil = null;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
      updateData.passwordHistory = [user.passwordHash];
      updateData.lastPasswordChange = new Date();
    }
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, email: true, role: true, lockedUntil: true, updatedAt: true },
    });
    if (data.permissions && data.permissions.length > 0) {
      await prisma.userPermission.deleteMany({ where: { userId: id } });
      for (const p of data.permissions) {
        await prisma.userPermission.upsert({
          where: { userId_permissionId: { userId: id, permissionId: p.permissionId } },
          update: { effect: p.effect },
          create: { userId: id, permissionId: p.permissionId, effect: p.effect },
        });
      }
    }
    return updated;
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastPasswordChange: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, username: true }
    });
  }

  static async restoreUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    return prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      select: { id: true, username: true }
    });
  }

  static async permanentDeleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    await prisma.userPermission.deleteMany({ where: { userId: id } });
    await prisma.userScope.deleteMany({ where: { userId: id } });
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return { id, username: user.username };
  }

  static async checkUserExists(field: string, value: string): Promise<boolean> {
    if (field === 'username') {
      const user = await prisma.user.findFirst({ where: { username: value, deletedAt: null } });
      return !!user;
    }
    return false;
  }

  static async emptyUserTrash() {
    const deletedUsers = await prisma.user.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true }
    });
    const ids = deletedUsers.map(u => u.id);
    if (ids.length > 0) {
      await prisma.userPermission.deleteMany({ where: { userId: { in: ids } } });
      await prisma.userScope.deleteMany({ where: { userId: { in: ids } } });
      await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
      const { count } = await prisma.user.deleteMany({ where: { id: { in: ids } } });
      return count;
    }
    return 0;
  }
}
