import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { CreateCustomerDto, UpdateCustomerDto } from '@shared/dto/customer/customer.dto';

export class CustomerService {
  static async create(dto: CreateCustomerDto) {
    if (!dto.code || !dto.name) {
      throw new AppError('Customer code and name are required', 400);
    }

    const existing = await prisma.customer.findFirst({
      where: { code: dto.code, deletedAt: null }
    });

    if (existing) {
      throw new AppError(`Customer with code ${dto.code} already exists`, 400);
    }

    return prisma.customer.create({
      data: {
        code: dto.code,
        name: dto.name,
        contactInfo: dto.contactInfo || null
      }
    });
  }

  static async list(search?: string) {
    return prisma.customer.findMany({
      where: search ? {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      } : undefined,
      orderBy: { code: 'asc' }
    });
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }

  static async update(id: string, dto: UpdateCustomerDto) {
    // Check existence
    await this.getById(id);

    return prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        contactInfo: dto.contactInfo
      }
    });
  }

  static async delete(id: string) {
    // Check existence
    await this.getById(id);

    return prisma.customer.delete({
      where: { id }
    });
  }

  static async checkExists(field: string, value: string): Promise<boolean> {
    const allowedFields = ['code'];
    if (!allowedFields.includes(field)) {
      throw new AppError(`Field '${field}' is not allowed for existence check`, 400);
    }
    const record = await prisma.customer.findFirst({
      where: { [field]: value, deletedAt: null }
    });
    return !!record;
  }
}
