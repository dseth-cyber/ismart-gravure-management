import { Request, Response, NextFunction } from 'express';
import { LayoutService } from './layouts.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class LayoutController {
  static async getDefault(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const data = await LayoutService.getDefault();
      const response: ApiResponse = { status: 'success', statusCode: 200, data };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async saveDefault(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await LayoutService.saveDefault(req.body.data);
      const response: ApiResponse = { status: 'success', statusCode: 200, data: result };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getMyLayout(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const data = await LayoutService.getUserLayout(userId);
      const response: ApiResponse = { status: 'success', statusCode: 200, data };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async saveMyLayout(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const result = await LayoutService.saveUserLayout(userId, req.body.data);
      const response: ApiResponse = { status: 'success', statusCode: 200, data: result };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMyLayout(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      await LayoutService.deleteUserLayout(userId);
      const response: ApiResponse = { status: 'success', statusCode: 200, message: 'Layout reset' };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
