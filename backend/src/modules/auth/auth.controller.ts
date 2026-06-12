import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuditService } from '../audit/audit.service';
import { prisma } from '../../config/database';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'Username and password are required' } as ApiResponse);
      }

      const result = await AuthService.login(username, password);
      await AuditService.record(req, 'auth.login', `User ${username} logged in successfully`, result.user?.id, result.user?.username);

      return res.status(200).json({ status: 'success', statusCode: 200, data: result } as ApiResponse);
    } catch (error) {
      const { username } = req.body;
      if (username) {
        await AuditService.record(req, 'auth.login.failed', `Failed login attempt for username: ${username}`);
      }
      next(error);
    }
  }

  static async verifyMfa(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { tempToken, totpCode } = req.body;
      if (!tempToken || !totpCode) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'Temp token and TOTP code are required' } as ApiResponse);
      }

      const result = await AuthService.verifyMfa(tempToken, totpCode);
      await AuditService.record(req, 'auth.mfa.verify', `User ${result.user.username} completed MFA verification`, result.user.id, result.user.username);

      return res.status(200).json({ status: 'success', statusCode: 200, data: result } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'Refresh token is required' } as ApiResponse);
      }

      const result = await AuthService.refresh(refreshToken);
      return res.status(200).json({ status: 'success', statusCode: 200, data: result } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      } else if (req.user) {
        await AuthService.logoutAll(req.user.userId);
      }
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Logged out successfully' } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' } as ApiResponse);
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'Current and new passwords are required' } as ApiResponse);
      }

      await AuthService.changePassword(req.user.userId, currentPassword, newPassword);
      await AuditService.record(req, 'auth.password.change', `User ${req.user.username} changed password`, req.user.userId, req.user.username);

      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Password changed successfully' } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' } as ApiResponse);
      }

      const profile = await AuthService.getUserProfile(req.user.userId);
      return res.status(200).json({ status: 'success', statusCode: 200, data: profile } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  // ── MFA Management ──
  static async mfaGenerate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' } as ApiResponse);
      }

      const { secret, uri } = MfaService.generateSecret();

      await prisma.user.update({
        where: { id: req.user.userId },
        data: { mfaSecret: secret },
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: { secret, uri },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async mfaEnable(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' } as ApiResponse);
      }

      const { totpCode } = req.body;
      if (!totpCode) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'TOTP code is required' } as ApiResponse);
      }

      const result = await MfaService.enable(req.user.userId, totpCode);
      await AuditService.record(req, 'auth.mfa.enable', `User ${req.user.username} enabled MFA`, req.user.userId, req.user.username);

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async mfaDisable(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' } as ApiResponse);
      }

      const { totpCode } = req.body;
      if (!totpCode) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'TOTP code or backup code is required' } as ApiResponse);
      }

      await MfaService.disable(req.user.userId, totpCode);
      await AuditService.record(req, 'auth.mfa.disable', `User ${req.user.username} disabled MFA`, req.user.userId, req.user.username);

      return res.status(200).json({ status: 'success', statusCode: 200, message: 'MFA disabled successfully' } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  // ── User Management (Admin) ──
  static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const users = await AuthService.listUsers();
      return res.status(200).json({ status: 'success', statusCode: 200, data: users } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const user = await AuthService.getUser(req.params.id);
      return res.status(200).json({ status: 'success', statusCode: 200, data: user } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { username, password, role } = req.body;
      const user = await AuthService.createUser(username, password, role);
      await AuditService.record(req, 'user.create', `Admin created user ${username}`, req.user?.userId, req.user?.username);
      return res.status(201).json({ status: 'success', statusCode: 201, data: user } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { role, locked } = req.body;
      const user = await AuthService.updateUser(req.params.id, { role, locked });
      await AuditService.record(req, 'user.update', `Admin updated user ${user.username}`, req.user?.userId, req.user?.username);
      return res.status(200).json({ status: 'success', statusCode: 200, data: user } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }

  static async mfaStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'Unauthorized' } as ApiResponse);
      }

      const user = await prisma.user.findUnique({
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
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
