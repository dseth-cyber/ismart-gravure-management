import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const notifications = await NotificationService.getAllNotifications();
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        data: notifications,
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
