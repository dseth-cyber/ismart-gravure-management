import { Request, Response, NextFunction } from 'express';
import { LayoutService } from './layouts.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class LayoutController {
  // --- Single default (backward compat) ---
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

  // --- Single user layout (backward compat) ---
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

  // --- Named user layouts ---
  static async listMyLayouts(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const layouts = await LayoutService.listUserLayouts(userId);
      const response: ApiResponse = { status: 'success', statusCode: 200, data: layouts };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getMyLayoutByName(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const data = await LayoutService.getUserLayoutByName(userId, req.params.name as string);
      const response: ApiResponse = { status: 'success', statusCode: 200, data };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async saveMyLayoutByName(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const result = await LayoutService.saveUserLayoutByName(userId, req.params.name as string, req.body.data);
      const response: ApiResponse = { status: 'success', statusCode: 200, data: result };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMyLayoutByName(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      await LayoutService.deleteUserLayoutByName(userId, req.params.name as string);
      const response: ApiResponse = { status: 'success', statusCode: 200, message: 'Layout deleted' };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // --- Named default layouts (admin) ---
  static async listDefaults(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const layouts = await LayoutService.listDefaultLayouts();
      const response: ApiResponse = { status: 'success', statusCode: 200, data: layouts };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getDefaultByName(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const data = await LayoutService.getDefaultLayoutByName(req.params.name as string);
      const response: ApiResponse = { status: 'success', statusCode: 200, data };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async saveDefaultByName(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await LayoutService.saveDefaultLayoutByName(req.params.name as string, req.body.data);
      const response: ApiResponse = { status: 'success', statusCode: 200, data: result };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}