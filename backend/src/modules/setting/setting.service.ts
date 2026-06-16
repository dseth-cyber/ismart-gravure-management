import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';

export class SettingService {
  static async getSetting(key: string) {
    return prisma.systemSetting.findUnique({
      where: { key }
    });
  }

  static async getSettings() {
    return prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });
  }

  static async saveSetting(key: string, value: string) {
    if (!key) {
      throw new AppError('Key is required', 400);
    }
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }
}
