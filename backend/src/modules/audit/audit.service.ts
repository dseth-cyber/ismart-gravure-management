import { Request } from 'express';
import { prisma } from '../../config/database';
import { Logger } from '../../utils/logger';

export class AuditService {
  static async record(
    req: Request | null,
    action: string,
    details: string,
    userId?: string,
    username?: string
  ) {
    try {
      let resolvedUserId = userId || null;
      let resolvedUsername = username || null;
      let ipAddress = null;
      let userAgent = null;
      let correlationId = null;

      if (req) {
        correlationId = req.correlationId || null;
        ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || null;
        if (Array.isArray(ipAddress)) {
          ipAddress = ipAddress[0];
        }
        userAgent = req.headers['user-agent'] || null;

        const reqUser = (req as any).user;
        if (reqUser) {
          if (!resolvedUserId) resolvedUserId = reqUser.userId;
          if (!resolvedUsername) resolvedUsername = reqUser.username;
        }
      }

      const log = await prisma.auditLog.create({
        data: {
          action,
          userId: resolvedUserId,
          username: resolvedUsername,
          details,
          ipAddress,
          userAgent,
          correlationId
        }
      });

      Logger.info(`Audit log recorded: ${action} by user ${resolvedUsername || 'anonymous'}`, correlationId || undefined, {
        auditLogId: log.id,
        action,
        username: resolvedUsername
      });

      return log;
    } catch (error) {
      Logger.error(`Failed to record audit log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async list(limit: number = 100, offset: number = 0) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }
}
