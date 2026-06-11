"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const database_1 = require("../../config/database");
const logger_1 = require("../../utils/logger");
class AuditService {
    static async record(req, action, details, userId, username) {
        try {
            let resolvedUserId = userId || null;
            let resolvedUsername = username || null;
            let ipAddress = null;
            let userAgent = null;
            let correlationId = null;
            if (req) {
                correlationId = req.correlationId || null;
                ipAddress = req.headers['x-forwarded-for'] || req.ip || null;
                if (Array.isArray(ipAddress)) {
                    ipAddress = ipAddress[0];
                }
                userAgent = req.headers['user-agent'] || null;
                const reqUser = req.user;
                if (reqUser) {
                    if (!resolvedUserId)
                        resolvedUserId = reqUser.userId;
                    if (!resolvedUsername)
                        resolvedUsername = reqUser.username;
                }
            }
            const log = await database_1.prisma.auditLog.create({
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
            logger_1.Logger.info(`Audit log recorded: ${action} by user ${resolvedUsername || 'anonymous'}`, correlationId || undefined, {
                auditLogId: log.id,
                action,
                username: resolvedUsername
            });
            return log;
        }
        catch (error) {
            logger_1.Logger.error(`Failed to record audit log: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async list(limit = 100, offset = 0) {
        return database_1.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });
    }
}
exports.AuditService = AuditService;
