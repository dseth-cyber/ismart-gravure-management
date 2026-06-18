import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { CreateSalesOrderDto, UpdateSalesOrderStatusDto } from '@shared/dto/order/order.dto';

export class OrderService {
  static async create(dto: CreateSalesOrderDto) {
    if (!dto.orderNumber || !dto.customerCode || !dto.productCode || dto.quantity === undefined || !dto.unit || !dto.dueDate) {
      throw new AppError('Missing required sales order fields', 400);
    }

    // Check duplicate orderNumber (exclude soft-deleted)
    const existing = await prisma.salesOrder.findFirst({
      where: { orderNumber: dto.orderNumber, deletedAt: null }
    });
    if (existing) {
      throw new AppError(`Sales order with number ${dto.orderNumber} already exists`, 400);
    }

    // Validate customer exists (exclude soft-deleted)
    const customer = await prisma.customer.findFirst({
      where: { code: dto.customerCode, deletedAt: null }
    });
    if (!customer) {
      throw new AppError(`Customer with code ${dto.customerCode} not found`, 400);
    }

    // Validate product exists (exclude soft-deleted)
    const product = await prisma.product.findFirst({
      where: { code: dto.productCode, deletedAt: null }
    });
    if (!product) {
      throw new AppError(`Product with code ${dto.productCode} not found`, 400);
    }

    return prisma.salesOrder.create({
      data: {
        orderNumber: dto.orderNumber,
        customerCode: dto.customerCode,
        productCode: dto.productCode,
        quantity: dto.quantity,
        unit: dto.unit,
        dueDate: new Date(dto.dueDate),
        status: 'pending'
      }
    });
  }

  static async list() {
    return prisma.salesOrder.findMany({
      orderBy: { orderNumber: 'asc' }
    });
  }

  static async getById(id: string) {
    const order = await prisma.salesOrder.findUnique({
      where: { id }
    });
    if (!order) {
      throw new AppError('Sales order not found', 404);
    }
    return order;
  }

  static async updateStatus(id: string, dto: UpdateSalesOrderStatusDto) {
    await this.getById(id);
    return prisma.salesOrder.update({
      where: { id },
      data: { status: dto.status }
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.salesOrder.delete({
      where: { id }
    });
  }
}
