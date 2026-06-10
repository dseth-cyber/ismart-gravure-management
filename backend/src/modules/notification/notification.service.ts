import { prisma } from '../../config/database';
import { emitEvent } from '../realtime/realtime';

interface Notification {
  id: string;
  type: 'ink_expiry' | 'cylinder_maintenance';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  resourceId: string;
  createdAt: string;
}

export class NotificationService {
  static async checkExpiringBatches(): Promise<Notification[]> {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const batches = await prisma.inkBatch.findMany({
      where: {
        expiryDate: { lte: sevenDaysLater },
        status: { not: 'expired' },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return batches.map(b => {
      const expired = new Date(b.expiryDate) < now;
      const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: `ink-${b.id}`,
        type: 'ink_expiry' as const,
        severity: expired ? 'high' as const : daysLeft <= 2 ? 'high' as const : 'medium' as const,
        title: expired ? 'Ink Batch Expired' : 'Ink Batch Near Expiry',
        message: expired
          ? `Batch ${b.id} (${b.color}) expired on ${new Date(b.expiryDate).toLocaleDateString()}`
          : `Batch ${b.id} (${b.color}) expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
        resourceId: b.id,
        createdAt: now.toISOString(),
      };
    });
  }

  static async checkCylinderMaintenance(): Promise<Notification[]> {
    const now = new Date();
    const meterThreshold = 50000;

    const repairCylinders = await prisma.cylinder.findMany({
      where: {
        OR: [
          { status: 'repair' },
          { status: 'hold' },
          { meter: { gte: meterThreshold } },
        ],
      },
      orderBy: { meter: 'desc' },
    });

    return repairCylinders.map(c => {
      const needsRepair = c.status === 'repair' || c.status === 'hold';
      const highMeter = c.meter >= meterThreshold;
      return {
        id: `cyl-${c.id}`,
        type: 'cylinder_maintenance' as const,
        severity: (needsRepair ? 'high' : highMeter ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        title: needsRepair ? 'Cylinder Needs Repair' : 'Cylinder High Meter',
        message: needsRepair
          ? `Cylinder ${c.id} (${c.colorName}) status: ${c.status}`
          : `Cylinder ${c.id} (${c.colorName}) has ${c.meter.toLocaleString()}m (threshold: ${meterThreshold.toLocaleString()}m)`,
        resourceId: c.id,
        createdAt: now.toISOString(),
      };
    });
  }

  static async emitNotifications(): Promise<void> {
    const notifications = await this.getAllNotifications();
    if (notifications.length > 0) {
      emitEvent('notification:alerts', notifications);
    }
  }

  static async getAllNotifications(): Promise<Notification[]> {
    const [batches, cylinders] = await Promise.all([
      this.checkExpiringBatches(),
      this.checkCylinderMaintenance(),
    ]);
    return [...batches, ...cylinders].sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}
