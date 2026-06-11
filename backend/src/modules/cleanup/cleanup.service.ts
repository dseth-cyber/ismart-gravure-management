import { prisma } from '../../config/database';
import { env } from '../../config/env';

const AUDIT_LOG_RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10);

export class CleanupService {
  static async purgeAuditLogs(): Promise<number> {
    const cutoff = new Date(Date.now() - AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }

  static async purgeExpiredRefreshTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  static async runAll(): Promise<{ auditLogs: number; refreshTokens: number }> {
    const [auditLogs, refreshTokens] = await Promise.all([
      this.purgeAuditLogs(),
      this.purgeExpiredRefreshTokens(),
    ]);
    return { auditLogs, refreshTokens };
  }
}
