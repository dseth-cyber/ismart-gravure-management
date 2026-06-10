import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { CreateCylinderDto, UpdateCylinderDto, CylinderStatus } from '@shared/dto/cylinder/cylinder.dto';

export class CylinderService {
  static async create(dto: CreateCylinderDto) {
    if (!dto.id || !dto.productCode || !dto.color || !dto.colorName || !dto.location || !dto.size) {
      throw new AppError('Cylinder id, productCode, color, colorName, location, and size are required', 400);
    }

    // 1. Check for duplicate id
    const existing = await prisma.cylinder.findUnique({
      where: { id: dto.id }
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

  static async list(search?: string, status?: string) {
    const filters: any = {};

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
      where: Object.keys(filters).length > 0 ? filters : undefined,
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
    return prisma.cylinder.delete({
      where: { id }
    });
  }
}
