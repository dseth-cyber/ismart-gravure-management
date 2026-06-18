import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { CreateProductDto, UpdateProductDto } from '@shared/dto/product/product.dto';

export class ProductService {
  static async create(dto: CreateProductDto) {
    if (!dto.code || !dto.name || !dto.customerCode) {
      throw new AppError('Product code, name, and customerCode are required', 400);
    }

    // 1. Check for duplicate product code (exclude soft-deleted)
    const existing = await prisma.product.findFirst({
      where: { code: dto.code, deletedAt: null }
    });
    if (existing) {
      throw new AppError(`Product with code ${dto.code} already exists`, 400);
    }

    // 2. Validate customerCode exists (exclude soft-deleted)
    const customer = await prisma.customer.findFirst({
      where: { code: dto.customerCode, deletedAt: null }
    });
    if (!customer) {
      throw new AppError(`Customer with code ${dto.customerCode} does not exist`, 400);
    }

    return prisma.product.create({
      data: {
        code: dto.code,
        name: dto.name,
        customerCode: dto.customerCode
      }
    });
  }

  static async list(search?: string) {
    return prisma.product.findMany({
      where: search ? {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { customerCode: { contains: search, mode: 'insensitive' } }
        ]
      } : undefined,
      orderBy: { code: 'asc' }
    });
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  static async update(id: string, dto: UpdateProductDto) {
    await this.getById(id);

    // If customerCode is changing, validate it exists
    if (dto.customerCode) {
      const customer = await prisma.customer.findUnique({
        where: { code: dto.customerCode }
      });
      if (!customer) {
        throw new AppError(`Customer with code ${dto.customerCode} does not exist`, 400);
      }
    }

    return prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        customerCode: dto.customerCode
      }
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.product.delete({
      where: { id }
    });
  }

  static async checkExists(field: string, value: string): Promise<boolean> {
    const allowedFields = ['code'];
    if (!allowedFields.includes(field)) {
      throw new AppError(`Field '${field}' is not allowed for existence check`, 400);
    }
    const record = await prisma.product.findFirst({
      where: { [field]: value, deletedAt: null }
    });
    return !!record;
  }
}
