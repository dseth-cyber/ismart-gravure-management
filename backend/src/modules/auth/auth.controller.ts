import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuditService } from '../audit/audit.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'Username and password are required' } as ApiResponse);
      }

      const result = await AuthService.login(username, password);
      await AuditService.record(req, 'auth.login', `User ${username} logged in successfully`, result.user.id, result.user.username);

      return res.status(200).json({ status: 'success', statusCode: 200, data: result } as ApiResponse);
    } catch (error) {
      const { username } = req.body;
      if (username) {
        await AuditService.record(req, 'auth.login.failed', `Failed login attempt for username: ${username}`);
      }
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
}
