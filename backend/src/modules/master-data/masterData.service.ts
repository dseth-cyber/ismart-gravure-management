import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';

const ALLOWED_CATEGORIES = [
  'status', 'cylinderType', 'defectType', 'machine',
  'rack', 'supplier', 'inkType', 'solvent'
];

export class MasterDataService {
  static validateCategory(category: string) {
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new AppError(`Invalid category: ${category}`, 400);
    }
  }

  static async list(category: string, showDeleted = false) {
    this.validateCategory(category);
    const filters: any = { category };
    filters.deletedAt = showDeleted ? { not: null } : null;
    return prisma.masterDataItem.findMany({
      where: filters,
      orderBy: { sortOrder: 'asc' },
    });
  }

  static async create(data: { category: string; name: string; nameTh?: string; active?: boolean; extra?: any; sortOrder?: number }) {
    this.validateCategory(data.category);
    const existing = await prisma.masterDataItem.findFirst({
      where: { category: data.category, name: data.name, deletedAt: null }
    });
    if (existing) throw new AppError('Item already exists in this category', 409);
    return prisma.masterDataItem.create({
      data: {
        category: data.category,
        name: data.name,
        nameTh: data.nameTh || null,
        active: data.active ?? true,
        extra: data.extra || undefined,
        sortOrder: data.sortOrder ?? 0,
      }
    });
  }

  static async update(id: string, data: { name?: string; nameTh?: string; active?: boolean; extra?: any; sortOrder?: number }) {
    const item = await prisma.masterDataItem.findUnique({ where: { id } });
    if (!item) throw new AppError('Item not found', 404);
    if (data.name && data.name !== item.name) {
      const dup = await prisma.masterDataItem.findFirst({
        where: { category: item.category, name: data.name, deletedAt: null, id: { not: id } }
      });
      if (dup) throw new AppError('Another item with this name already exists in this category', 409);
    }
    return prisma.masterDataItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameTh !== undefined && { nameTh: data.nameTh }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.extra !== undefined && { extra: data.extra }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      }
    });
  }

  static async delete(id: string) {
    const item = await prisma.masterDataItem.findUnique({ where: { id } });
    if (!item) throw new AppError('Item not found', 404);
    return prisma.masterDataItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  static async restore(id: string) {
    const item = await prisma.masterDataItem.findUnique({ where: { id } });
    if (!item) throw new AppError('Item not found', 404);
    return prisma.masterDataItem.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  static async permanentDelete(id: string) {
    const item = await prisma.masterDataItem.findUnique({ where: { id } });
    if (!item) throw new AppError('Item not found', 404);
    return prisma.masterDataItem.delete({ where: { id } });
  }

  static async emptyTrash(category: string) {
    this.validateCategory(category);
    const { count } = await prisma.masterDataItem.deleteMany({
      where: { category, deletedAt: { not: null } }
    });
    return count;
  }

  static async checkExists(category: string, field: string, value: string) {
    this.validateCategory(category);
    if (field === 'name') {
      const item = await prisma.masterDataItem.findFirst({
        where: { category, name: value, deletedAt: null }
      });
      return !!item;
    }
    return false;
  }
}
