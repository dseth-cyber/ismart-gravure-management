import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { CreateCylinderDto, UpdateCylinderDto, CylinderStatus } from '@shared/dto/cylinder/cylinder.dto';

export class CylinderService {
  static async create(dto: CreateCylinderDto) {
    if (!dto.id || !dto.productCode || !dto.color || !dto.colorName || !dto.location || !dto.size) {
      throw new AppError('Cylinder id, productCode, color, colorName, location, and size are required', 400);
    }

    // 1. Check for duplicate id (exclude soft-deleted)
    const existing = await prisma.cylinder.findFirst({
      where: { id: dto.id, deletedAt: null }
    });
    if (existing) {
      throw new AppError(`Cylinder with ID ${dto.id} already exists`, 400);
    }

    // 2. Validate productCode exists
    const product = await prisma.product.findUnique({
      where: { code: dto.productCode }
    });
    if (!product) {
      throw new AppError(`Product with code ${dto.productCode} does not exist`, 400);
    }

    return prisma.cylinder.create({
      data: {
        id: dto.id,
        productCode: dto.productCode,
        color: dto.color,
        colorName: dto.colorName,
        location: dto.location,
        type: dto.type || 'Dedicated',
        size: dto.size,
        status: 'available'
      }
    });
  }

  static async list(search?: string, status?: string, showDeleted = false) {
    const filters: any = {};

    filters.deletedAt = showDeleted ? { not: null } : null;

    if (status && status !== 'all') {
      filters.status = status as CylinderStatus;
    }

    if (search) {
      filters.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.cylinder.findMany({
      where: filters,
      orderBy: { id: 'asc' }
    });
  }

  static async getById(id: string) {
    const cylinder = await prisma.cylinder.findUnique({
      where: { id }
    });
    if (!cylinder) {
      throw new AppError('Cylinder not found', 404);
    }
    return cylinder;
  }

  static async update(id: string, dto: UpdateCylinderDto) {
    await this.getById(id);

    return prisma.cylinder.update({
      where: { id },
      data: {
        status: dto.status,
        location: dto.location,
        meter: dto.meter,
        lastUsed: dto.lastUsed ? new Date(dto.lastUsed) : undefined,
        type: dto.type,
        size: dto.size
      }
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.cylinder.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  static async restore(id: string) {
    await this.getById(id);
    return prisma.cylinder.update({
      where: { id },
      data: { deletedAt: null }
    });
  }

  static async permanentDelete(id: string) {
    await this.getById(id);
    return prisma.cylinder.delete({
      where: { id }
    });
  }

  static async emptyTrash() {
    return prisma.cylinder.deleteMany({
      where: { deletedAt: { not: null } }
    });
  }

  static async batchUpdateStatus(ids: string[], status: CylinderStatus) {
    return prisma.cylinder.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status }
    });
  }

  static async batchDelete(ids: string[]) {
    return prisma.cylinder.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  static async batchRestore(ids: string[]) {
    return prisma.cylinder.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null }
    });
  }

  static async checkExists(field: string, value: string): Promise<boolean> {
    const allowedFields = ['id'];
    if (!allowedFields.includes(field)) {
      throw new AppError(`Field '${field}' is not allowed for existence check`, 400);
    }
    const record = await prisma.cylinder.findFirst({
      where: { [field]: value, deletedAt: null }
    });
    return !!record;
  }
}
