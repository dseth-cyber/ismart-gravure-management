import { prisma } from '../../config/database';

export class NotificationPrefService {
  static async getUserPrefs(userId: string) {
    return prisma.userNotificationPref.findMany({ where: { userId } });
  }

  static async upsert(data: { userId: string; channel: string; enabled?: boolean; address?: string; quietStart?: string; quietEnd?: string; digest?: boolean }) {
    return prisma.userNotificationPref.upsert({
      where: { userId_channel: { userId: data.userId, channel: data.channel } },
      update: { enabled: data.enabled, address: data.address, quietStart: data.quietStart, quietEnd: data.quietEnd, digest: data.digest },
      create: { userId: data.userId, channel: data.channel, enabled: data.enabled ?? true, address: data.address, quietStart: data.quietStart, quietEnd: data.quietEnd, digest: data.digest ?? false },
    });
  }

  static async bulkUpsert(userId: string, prefs: Array<{ channel: string; enabled: boolean; address?: string }>) {
    const results = [];
    for (const p of prefs) {
      results.push(await this.upsert({ userId, ...p }));
    }
    return results;
  }

  static async remove(userId: string, channel: string) {
    return prisma.userNotificationPref.delete({ where: { userId_channel: { userId, channel } } });
  }

  static isInQuietHours(pref: { quietStart?: string | null; quietEnd?: string | null }): boolean {
    if (!pref.quietStart || !pref.quietEnd) return false;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = pref.quietStart.split(':').map(Number);
    const [eh, em] = pref.quietEnd.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (start <= end) return current >= start && current <= end;
    return current >= start || current <= end;
  }
}
