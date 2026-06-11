import { prisma } from '../../config/database';
import { WebSocketProvider, SmtpProvider, LineProvider, TelegramProvider, NotificationProvider, NotificationMessage } from './providers';
import { TemplateService } from './template.service';
import { NotificationPrefService } from './pref.service';

const providers: Record<string, NotificationProvider> = {
  websocket: new WebSocketProvider(),
  email: new SmtpProvider(),
  line: new LineProvider(),
  telegram: new TelegramProvider(),
};

export class NotificationService {
  static async send(type: string, userId: string, variables: Record<string, any>, language = 'en'): Promise<void> {
    const rendered = await TemplateService.render(type, variables, language);
    if (!rendered) return;

    const prefs = await NotificationPrefService.getUserPrefs(userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

    for (const pref of prefs) {
      if (!pref.enabled) continue;
      if (NotificationPrefService.isInQuietHours(pref)) continue;

      const provider = providers[pref.channel];
      if (!provider) continue;

      const message: NotificationMessage = {
        to: pref.address || userId,
        subject: rendered.subject,
        body: rendered.body,
        type,
        userId,
      };

      const log = await prisma.notificationLog.create({
        data: { userId, channel: pref.channel, type, subject: rendered.subject, body: rendered.body, status: 'pending', retryCount: 0, maxRetries: 3 },
      });

      await this.deliverWithRetry(log.id, provider, message);
    }

    // Always send WebSocket notification regardless of prefs
    try {
      const ws = new WebSocketProvider();
      await ws.send({ to: userId, subject: rendered.subject, body: rendered.body, type, userId });
    } catch {}
  }

  static async deliverWithRetry(logId: string, provider: NotificationProvider, message: NotificationMessage, attempt = 0): Promise<void> {
    const log = await prisma.notificationLog.findUnique({ where: { id: logId } });
    if (!log || log.status === 'sent') return;

    const result = await provider.send(message);
    if (result.success) {
      await prisma.notificationLog.update({ where: { id: logId }, data: { status: 'sent', sentAt: new Date(), error: null } });
    } else {
      const nextAttempt = attempt + 1;
      if (nextAttempt < log.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, nextAttempt), 30000); // exponential backoff
        await prisma.notificationLog.update({
          where: { id: logId },
          data: { retryCount: nextAttempt, error: result.error, nextRetryAt: new Date(Date.now() + delay) },
        });
        await new Promise(r => setTimeout(r, delay));
        await this.deliverWithRetry(logId, provider, message, nextAttempt);
      } else {
        await prisma.notificationLog.update({
          where: { id: logId },
          data: { status: 'failed', error: result.error, retryCount: nextAttempt },
        });
      }
    }
  }

  static async handleAlertWebhook(alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      const status = alert.status || 'firing';
      const labels = alert.labels || {};
      const annotations = alert.annotations || {};
      const templateType = 'alert';

      // Create template variables from alert data
      const variables = {
        alertName: labels.alertname || 'Unknown',
        severity: labels.severity || 'warning',
        summary: annotations.summary || '',
        description: annotations.description || '',
        status,
        startsAt: alert.startsAt || new Date().toISOString(),
        instance: labels.instance || 'unknown',
      };

      // Send to all admin users
      const admins = await prisma.user.findMany({ where: { OR: [{ role: 'admin' }] }, select: { id: true, username: true } });
      for (const admin of admins) {
        await this.send(templateType, admin.id, variables);
      }
    }
  }

  static async getLogs(limit = 100, offset = 0) {
    return prisma.notificationLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip: offset });
  }

  static async checkAndEmit(): Promise<void> {
    try {
      const { prisma } = await import('../../config/database');
      const { emitEvent } = await import('../realtime/realtime');

      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [batches, cylinders] = await Promise.all([
        prisma.inkBatch.findMany({ where: { expiryDate: { lte: sevenDaysLater }, status: { not: 'expired' } }, orderBy: { expiryDate: 'asc' } }),
        prisma.cylinder.findMany({ where: { OR: [{ status: 'repair' }, { status: 'hold' }, { meter: { gte: 50000 } }] }, orderBy: { meter: 'desc' } }),
      ]);

      const notifications: any[] = [];

      for (const b of batches) {
        const expired = new Date(b.expiryDate) < now;
        const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: `ink-${b.id}`, type: 'ink_expiry', severity: expired ? 'high' : daysLeft <= 2 ? 'high' : 'medium',
          title: expired ? 'Ink Batch Expired' : 'Ink Batch Near Expiry',
          message: expired ? `Batch ${b.id} (${b.color}) expired on ${new Date(b.expiryDate).toLocaleDateString()}` : `Batch ${b.id} (${b.color}) expires in ${daysLeft} day(s)`,
          resourceId: b.id, createdAt: now.toISOString(),
        });
      }

      for (const c of cylinders) {
        const needsRepair = c.status === 'repair' || c.status === 'hold';
        notifications.push({
          id: `cyl-${c.id}`, type: 'cylinder_maintenance', severity: needsRepair ? 'high' : 'medium',
          title: needsRepair ? 'Cylinder Needs Repair' : 'Cylinder High Meter',
          message: needsRepair ? `Cylinder ${c.id} (${c.colorName}) status: ${c.status}` : `Cylinder ${c.id} (${c.colorName}) has ${c.meter.toLocaleString()}m`,
          resourceId: c.id, createdAt: now.toISOString(),
        });
      }

      if (notifications.length > 0) {
        emitEvent('notification:alerts', notifications);
      }
    } catch {}
  }

  static async retryFailed(logId: string): Promise<void> {
    const log = await prisma.notificationLog.findUnique({ where: { id: logId } });
    if (!log || log.status !== 'failed') return;

    const provider = providers[log.channel];
    if (!provider) return;

    await prisma.notificationLog.update({ where: { id: logId }, data: { status: 'pending', retryCount: 0, error: null, nextRetryAt: null } });
    await this.deliverWithRetry(logId, provider, { to: log.userId || '', subject: log.subject, body: log.body, type: log.type, userId: log.userId || undefined });
  }
}
