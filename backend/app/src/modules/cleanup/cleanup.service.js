"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupService = void 0;
const database_1 = require("../../config/database");
const AUDIT_LOG_RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10);
class CleanupService {
    static async purgeAuditLogs() {
        const cutoff = new Date(Date.now() - AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        const result = await database_1.prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });
        return result.count;
    }
    static async purgeExpiredRefreshTokens() {
        const result = await database_1.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        return result.count;
    }
    static async runAll() {
        const [auditLogs, refreshTokens] = await Promise.all([
            this.purgeAuditLogs(),
            this.purgeExpiredRefreshTokens(),
        ]);
        return { auditLogs, refreshTokens };
    }
}
exports.CleanupService = CleanupService;
