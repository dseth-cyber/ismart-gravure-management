"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const audit_service_1 = require("./audit.service");
class AuditController {
    static async list(req, res, next) {
        try {
            const limit = parseInt(req.query.limit, 10) || 100;
            const offset = parseInt(req.query.offset, 10) || 0;
            const logs = await audit_service_1.AuditService.list(limit, offset);
            const data = logs.map(l => ({
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
            const response = {
                status: 'success',
                statusCode: 200,
                data
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditController = AuditController;
