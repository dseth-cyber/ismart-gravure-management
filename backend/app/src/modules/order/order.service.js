"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class OrderService {
    static async create(dto) {
        if (!dto.orderNumber || !dto.customerCode || !dto.productCode || dto.quantity === undefined || !dto.unit || !dto.dueDate) {
            throw new error_1.AppError('Missing required sales order fields', 400);
        }
        const existing = await database_1.prisma.salesOrder.findUnique({
            where: { orderNumber: dto.orderNumber }
        });
        if (existing) {
            throw new error_1.AppError(`Sales order with number ${dto.orderNumber} already exists`, 400);
        }
        const customer = await database_1.prisma.customer.findUnique({
            where: { code: dto.customerCode }
        });
        if (!customer) {
            throw new error_1.AppError(`Customer with code ${dto.customerCode} not found`, 400);
        }
        const product = await database_1.prisma.product.findUnique({
            where: { code: dto.productCode }
        });
        if (!product) {
            throw new error_1.AppError(`Product with code ${dto.productCode} not found`, 400);
        }
        return database_1.prisma.salesOrder.create({
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
        return database_1.prisma.salesOrder.findMany({
            orderBy: { orderNumber: 'asc' }
        });
    }
    static async getById(id) {
        const order = await database_1.prisma.salesOrder.findUnique({
            where: { id }
        });
        if (!order) {
            throw new error_1.AppError('Sales order not found', 404);
        }
        return order;
    }
    static async updateStatus(id, dto) {
        await this.getById(id);
        return database_1.prisma.salesOrder.update({
            where: { id },
            data: { status: dto.status }
        });
    }
    static async delete(id) {
        await this.getById(id);
        return database_1.prisma.salesOrder.delete({
            where: { id }
        });
    }
}
exports.OrderService = OrderService;
