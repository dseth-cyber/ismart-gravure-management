import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { getRedis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error';

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

  // ── Login ──
  static async login(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new AppError('Invalid username or password', 400);
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${minutesLeft} minute(s)`, 423);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: attempts };
      if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + env.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });
      throw new AppError('Invalid username or password', 400);
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

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
    if (!env.LDAP_URL) return false;
    try {
      const ldapjs = require('ldapjs');
      const client = ldapjs.createClient({ url: env.LDAP_URL });
      return new Promise((resolve) => {
        client.bind(`${env.LDAP_BIND_DN}`, env.LDAP_BIND_CREDENTIALS, (bindErr: any) => {
          if (bindErr) { client.destroy(); resolve(false); return; }
          const searchDn = env.LDAP_BASE_DN;
          client.search(searchDn, { scope: 'sub', filter: `(uid=${username})` }, (searchErr: any, res: any) => {
            if (searchErr) { client.destroy(); resolve(false); return; }
            let found = false;
            res.on('searchEntry', () => { found = true; });
            res.on('end', () => {
              client.destroy();
              resolve(found);
            });
          });
        });
      });
    } catch {
      return false;
    }
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
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
}
