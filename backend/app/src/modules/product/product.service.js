"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class ProductService {
    static async create(dto) {
        if (!dto.code || !dto.name || !dto.customerCode) {
            throw new error_1.AppError('Product code, name, and customerCode are required', 400);
        }
        // 1. Check for duplicate product code
        const existing = await database_1.prisma.product.findUnique({
            where: { code: dto.code }
        });
        if (existing) {
            throw new error_1.AppError(`Product with code ${dto.code} already exists`, 400);
        }
        // 2. Validate customerCode exists (Service-level link)
        const customer = await database_1.prisma.customer.findUnique({
            where: { code: dto.customerCode }
        });
        if (!customer) {
            throw new error_1.AppError(`Customer with code ${dto.customerCode} does not exist`, 400);
        }
        return database_1.prisma.product.create({
            data: {
                code: dto.code,
                name: dto.name,
                customerCode: dto.customerCode
            }
        });
    }
    static async list(search) {
        return database_1.prisma.product.findMany({
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
    static async getById(id) {
        const product = await database_1.prisma.product.findUnique({
            where: { id }
        });
        if (!product) {
            throw new error_1.AppError('Product not found', 404);
        }
        return product;
    }
    static async update(id, dto) {
        await this.getById(id);
        // If customerCode is changing, validate it exists
        if (dto.customerCode) {
            const customer = await database_1.prisma.customer.findUnique({
                where: { code: dto.customerCode }
            });
            if (!customer) {
                throw new error_1.AppError(`Customer with code ${dto.customerCode} does not exist`, 400);
            }
        }
        return database_1.prisma.product.update({
            where: { id },
            data: {
                name: dto.name,
                customerCode: dto.customerCode
            }
        });
    }
    static async delete(id) {
        await this.getById(id);
        return database_1.prisma.product.delete({
            where: { id }
        });
    }
}
exports.ProductService = ProductService;
