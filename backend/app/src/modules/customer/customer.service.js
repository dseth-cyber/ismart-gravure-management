"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class CustomerService {
    static async create(dto) {
        if (!dto.code || !dto.name) {
            throw new error_1.AppError('Customer code and name are required', 400);
        }
        const existing = await database_1.prisma.customer.findUnique({
            where: { code: dto.code }
        });
        if (existing) {
            throw new error_1.AppError(`Customer with code ${dto.code} already exists`, 400);
        }
        return database_1.prisma.customer.create({
            data: {
                code: dto.code,
                name: dto.name,
                contactInfo: dto.contactInfo || null
            }
        });
    }
    static async list(search) {
        return database_1.prisma.customer.findMany({
            where: search ? {
                OR: [
                    { code: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } }
                ]
            } : undefined,
            orderBy: { code: 'asc' }
        });
    }
    static async getById(id) {
        const customer = await database_1.prisma.customer.findUnique({
            where: { id }
        });
        if (!customer) {
            throw new error_1.AppError('Customer not found', 404);
        }
        return customer;
    }
    static async update(id, dto) {
        // Check existence
        await this.getById(id);
        return database_1.prisma.customer.update({
            where: { id },
            data: {
                name: dto.name,
                contactInfo: dto.contactInfo
            }
        });
    }
    static async delete(id) {
        // Check existence
        await this.getById(id);
        return database_1.prisma.customer.delete({
            where: { id }
        });
    }
}
exports.CustomerService = CustomerService;
