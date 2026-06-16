import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { AuditLogDto } from '@shared/dto/audit/audit.dto';

export class AuditController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const offset = parseInt(req.query.offset as string, 10) || 0;
      const search = req.query.search as string | undefined;
      const action = req.query.action as string | undefined;
      const module = req.query.module as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const { logs, total } = await AuditService.list(limit, offset, search, action, module, startDate, endDate);
      const data: AuditLogDto[] = logs.map(l => ({
        id: l.id,
        action: l.action,
        userId: l.userId,
        username: l.username,
        details: l.details,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        correlationId: l.correlationId,
        createdAt: l.createdAt.toISOString()
      }));

      const response: ApiResponse<AuditLogDto[]> & { total: number } = {
        status: 'success',
        statusCode: 200,
        data,
        total
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { action, details } = req.body;
      const log = await AuditService.record(req, action, details);
      
      const response: ApiResponse<any> = {
        status: 'success',
        statusCode: 201,
        data: log
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}
