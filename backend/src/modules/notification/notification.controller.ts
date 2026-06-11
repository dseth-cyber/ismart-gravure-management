import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { TemplateService } from './template.service';
import { NotificationPrefService } from './pref.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await NotificationService.getLogs();
      return res.status(200).json({ status: 'success', statusCode: 200, data: result } as ApiResponse);
    } catch (error) { next(error); }
  }

  // Templates
  static async listTemplates(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const templates = await TemplateService.list();
      return res.status(200).json({ status: 'success', statusCode: 200, data: templates } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async upsertTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const template = await TemplateService.upsert(req.body);
      return res.status(200).json({ status: 'success', statusCode: 200, data: template } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      await TemplateService.remove(String(req.params.type));
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Template deleted' } as ApiResponse);
    } catch (error) { next(error); }
  }

  // Preferences
  static async getMyPrefs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const prefs = await NotificationPrefService.getUserPrefs(req.user!.userId);
      return res.status(200).json({ status: 'success', statusCode: 200, data: prefs } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async upsertMyPref(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const pref = await NotificationPrefService.upsert({ userId: req.user!.userId, ...req.body });
      return res.status(200).json({ status: 'success', statusCode: 200, data: pref } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async bulkUpsertPrefs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const prefs = await NotificationPrefService.bulkUpsert(req.user!.userId, req.body.prefs || []);
      return res.status(200).json({ status: 'success', statusCode: 200, data: prefs } as ApiResponse);
    } catch (error) { next(error); }
  }

  // Alert webhook (no auth - called by AlertManager)
  static async alertWebhook(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const body = req.body;
      const alerts = body.alerts || [];
      await NotificationService.handleAlertWebhook(alerts);
      return res.status(200).json({ status: 'success', statusCode: 200, message: `Processed ${alerts.length} alerts` } as ApiResponse);
    } catch (error) { next(error); }
  }

  // Logs
  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const limit = parseInt(String(req.query.limit || '100'), 10);
      const offset = parseInt(String(req.query.offset || '0'), 10);
      const logs = await NotificationService.getLogs(limit, offset);
      return res.status(200).json({ status: 'success', statusCode: 200, data: logs } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async retryLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      await NotificationService.retryFailed(String(req.params.id));
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Retry initiated' } as ApiResponse);
    } catch (error) { next(error); }
  }

  // Send test notification (manual trigger)
  static async sendTest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { type, variables } = req.body;
      await NotificationService.send(type || 'test', req.user!.userId, variables || { test: true, username: req.user!.username });
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Notification sent' } as ApiResponse);
    } catch (error) { next(error); }
  }
}
