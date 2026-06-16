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

  static async list(
    limit: number = 100,
    offset: number = 0,
    search?: string,
    action?: string,
    module?: string,
    startDate?: string,
    endDate?: string
  ) {
    const filters: any = {};

    if (search) {
      filters.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (action) {
      if (action === 'create') {
        filters.action = {
          OR: [
            { endsWith: '.create' },
            { endsWith: '.start' }
          ]
        };
      } else if (action === 'update') {
        filters.action = {
          OR: [
            { endsWith: '.update' },
            { endsWith: '.update_status' },
            { endsWith: '.password.change' },
            { endsWith: '.mfa.enable' },
            { endsWith: '.mfa.disable' },
            { endsWith: '.restore' },
            { endsWith: '.approve' },
            { endsWith: '.reject' },
            { endsWith: '.cancel' }
          ]
        };
      } else if (action === 'delete') {
        filters.action = {
          OR: [
            { contains: 'delete' },
            { contains: 'empty_trash' },
            { contains: 'purge' }
          ]
        };
      } else if (action === 'login') {
        filters.action = { contains: 'login' };
      } else if (action === 'print') {
        filters.action = { contains: 'print' };
      } else {
        filters.action = { contains: action };
      }
    }

    if (module) {
      if (module === 'cylinder') {
        filters.action = { startsWith: 'cylinder.' };
      } else if (module === 'ink') {
        filters.action = {
          OR: [
            { startsWith: 'formula.' },
            { startsWith: 'batch.' },
            { startsWith: 'ink.' }
          ]
        };
      } else if (module === 'auth') {
        filters.action = {
          OR: [
            { startsWith: 'auth.' },
            { startsWith: 'user.' }
          ]
        };
      } else if (module === 'job') {
        filters.action = {
          OR: [
            { startsWith: 'production_job.' },
            { startsWith: 'qc_inspection.' }
          ]
        };
      } else if (module === 'order') {
        filters.action = { startsWith: 'sales_order.' };
      }
    }

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) {
        filters.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        filters.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.auditLog.count({ where: filters })
    ]);

    return { logs, total };
  }
}
