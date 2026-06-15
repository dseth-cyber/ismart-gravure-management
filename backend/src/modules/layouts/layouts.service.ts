import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';

export class LayoutService {
  static async getDefault() {
    const row = await prisma.dashboardLayout.findUnique({ where: { key: 'default' } });
    return row?.data || null;
  }

  static async saveDefault(data: any) {
    return prisma.dashboardLayout.upsert({
      where: { key: 'default' },
      create: { key: 'default', data },
      update: { data },
    });
  }

  static async getUserLayout(userId: string) {
    const row = await prisma.dashboardLayout.findUnique({ where: { key: `user:${userId}` } });
    return row?.data || null;
  }

  static async saveUserLayout(userId: string, data: any) {
    return prisma.dashboardLayout.upsert({
      where: { key: `user:${userId}` },
      create: { key: `user:${userId}`, data },
      update: { data },
    });
  }

  static async deleteUserLayout(userId: string) {
    try {
      await prisma.dashboardLayout.delete({ where: { key: `user:${userId}` } });
    } catch { /* ignore */ }
  }
}
