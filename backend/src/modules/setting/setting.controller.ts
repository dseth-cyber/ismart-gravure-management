import { Request, Response, NextFunction } from 'express';
import { SettingService } from './setting.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { AuditService } from '../audit/audit.service';

export class SettingController {
  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const settings = await SettingService.getSettings();
      const response: ApiResponse<any[]> = {
        status: 'success',
        statusCode: 200,
        data: settings
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async saveSetting(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { key, value } = req.body;
      const result = await SettingService.saveSetting(key, value);
      
      // Log setting update in Audit logs
      await AuditService.record(req, 'settings.update', `Updated setting ${key}`);

      const response: ApiResponse<any> = {
        status: 'success',
        statusCode: 200,
        data: result,
        message: 'Setting saved successfully'
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
