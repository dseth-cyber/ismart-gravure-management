import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { AuditLogDto } from '@shared/dto/audit/audit.dto';

export class AuditController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const logs = await AuditService.list(limit, offset);
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

      const response: ApiResponse<AuditLogDto[]> = {
        status: 'success',
        statusCode: 200,
        data
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
