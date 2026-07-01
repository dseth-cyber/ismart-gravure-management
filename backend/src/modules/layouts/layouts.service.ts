import { prisma } from '../../config/database';

export class LayoutService {
  private static key(name?: string) {
    return name ? `default:${name}` : 'default';
  }

  private static userKey(userId: string, name?: string) {
    return name ? `user:${userId}:${name}` : `user:${userId}`;
  }

  // --- Single default (backward compat) ---
  static async getDefault() {
    const row = await prisma.dashboardLayout.findUnique({ where: { key: this.key() } });
    return row?.data || null;
  }

  static async saveDefault(data: any) {
    return prisma.dashboardLayout.upsert({
      where: { key: this.key() },
      create: { key: this.key(), data },
      update: { data },
    });
  }

  // --- Single user layout (backward compat) ---
  static async getUserLayout(userId: string) {
    const row = await prisma.dashboardLayout.findUnique({ where: { key: this.userKey(userId) } });
    return row?.data || null;
  }

  static async saveUserLayout(userId: string, data: any) {
    return prisma.dashboardLayout.upsert({
      where: { key: this.userKey(userId) },
      create: { key: this.userKey(userId), data },
      update: { data },
    });
  }

  static async deleteUserLayout(userId: string) {
    try {
      await prisma.dashboardLayout.delete({ where: { key: this.userKey(userId) } });
    } catch { /* ignore */ }
  }

  // --- Named user layouts ---
  static async listUserLayouts(userId: string) {
    const rows = await prisma.dashboardLayout.findMany({
      where: { key: { startsWith: `user:${userId}:` } },
      select: { key: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => ({ name: r.key.split(':')[2], updatedAt: r.updatedAt }));
  }

  static async getUserLayoutByName(userId: string, name: string) {
    const row = await prisma.dashboardLayout.findUnique({ where: { key: this.userKey(userId, name) } });
    return row?.data || null;
  }

  static async saveUserLayoutByName(userId: string, name: string, data: any) {
    return prisma.dashboardLayout.upsert({
      where: { key: this.userKey(userId, name) },
      create: { key: this.userKey(userId, name), data },
      update: { data },
    });
  }

  static async deleteUserLayoutByName(userId: string, name: string) {
    try {
      await prisma.dashboardLayout.delete({ where: { key: this.userKey(userId, name) } });
    } catch { /* ignore */ }
  }

  // --- Named default layouts (admin) ---
  static async listDefaultLayouts() {
    const rows = await prisma.dashboardLayout.findMany({
      where: { key: { startsWith: 'default:' } },
      select: { key: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => ({ name: r.key.split(':')[1], updatedAt: r.updatedAt }));
  }

  static async getDefaultLayoutByName(name: string) {
    const row = await prisma.dashboardLayout.findUnique({ where: { key: this.key(name) } });
    return row?.data || null;
  }

  static async saveDefaultLayoutByName(name: string, data: any) {
    return prisma.dashboardLayout.upsert({
      where: { key: this.key(name) },
      create: { key: this.key(name), data },
      update: { data },
    });
  }
}
