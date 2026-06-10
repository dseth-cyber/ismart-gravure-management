import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { LoginRequestDto, LoginResponseDto, UserProfileDto, ApiResponse } from '@shared/dto/auth/auth.dto';
import { AuditService } from '../audit/audit.service';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { username, password } = req.body as LoginRequestDto;
      if (!username || !password) {
        const errResponse: ApiResponse = { status: 'error', statusCode: 400, message: 'Username and password are required' };
        return res.status(400).json(errResponse);
      }

      const result = await AuthService.login(username, password) as LoginResponseDto;
      
      // Record successful login audit
      await AuditService.record(req, 'auth.login', `User ${username} logged in successfully`, result.user.id, result.user.username);

      const successResponse: ApiResponse<LoginResponseDto> = {
        status: 'success',
        statusCode: 200,
        data: result
      };
      return res.status(200).json(successResponse);
    } catch (error) {
      // Record failed login audit
      const { username } = req.body as LoginRequestDto;
      if (username) {
        await AuditService.record(req, 'auth.login.failed', `Failed login attempt for username: ${username}`);
      }
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) {
        const errResponse: ApiResponse = { status: 'error', statusCode: 401, message: 'Unauthorized' };
        return res.status(401).json(errResponse);
      }

      const profile = await AuthService.getUserProfile(req.user.userId);
      const successResponse: ApiResponse<UserProfileDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: profile.id,
          username: profile.username,
          role: profile.role,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        }
      };
      return res.status(200).json(successResponse);
    } catch (error) {
      next(error);
    }
  }
}
