import { prisma } from '../../config/database';
import { Logger } from '../../utils/logger';

export class CleanupService {
  static async purgeAuditLogs(): Promise<number> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'retention.auditLogsDays' }
    });

    const value = setting ? setting.value : '90';
    if (value === 'forever') {
      return 0;
    }

    const days = parseInt(value, 10) || 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Use raw SQL to disable the immutable trigger before cleanup, then re-enable
    await prisma.$executeRaw`ALTER TABLE audit.audit_logs DISABLE TRIGGER trg_prevent_audit_log_mutation`;
    const result = await prisma.$executeRaw`DELETE FROM audit.audit_logs WHERE created_at < ${cutoff}::timestamp`;
    await prisma.$executeRaw`ALTER TABLE audit.audit_logs ENABLE TRIGGER trg_prevent_audit_log_mutation`;

    return result || 0;
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
