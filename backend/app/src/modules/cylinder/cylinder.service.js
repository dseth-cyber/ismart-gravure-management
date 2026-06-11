"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CylinderService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class CylinderService {
    static async create(dto) {
        if (!dto.id || !dto.productCode || !dto.color || !dto.colorName || !dto.location || !dto.size) {
            throw new error_1.AppError('Cylinder id, productCode, color, colorName, location, and size are required', 400);
        }
        // 1. Check for duplicate id
        const existing = await database_1.prisma.cylinder.findUnique({
            where: { id: dto.id }
        });
        if (existing) {
            throw new error_1.AppError(`Cylinder with ID ${dto.id} already exists`, 400);
        }
        // 2. Validate productCode exists
        const product = await database_1.prisma.product.findUnique({
            where: { code: dto.productCode }
        });
        if (!product) {
            throw new error_1.AppError(`Product with code ${dto.productCode} does not exist`, 400);
        }
        return database_1.prisma.cylinder.create({
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
    static async list(search, status) {
        const filters = {};
        if (status && status !== 'all') {
            filters.status = status;
        }
        if (search) {
            filters.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { productCode: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } }
            ];
        }
        return database_1.prisma.cylinder.findMany({
            where: Object.keys(filters).length > 0 ? filters : undefined,
            orderBy: { id: 'asc' }
        });
    }
    static async getById(id) {
        const cylinder = await database_1.prisma.cylinder.findUnique({
            where: { id }
        });
        if (!cylinder) {
            throw new error_1.AppError('Cylinder not found', 404);
        }
        return cylinder;
    }
    static async update(id, dto) {
        await this.getById(id);
        return database_1.prisma.cylinder.update({
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
    static async delete(id) {
        await this.getById(id);
        return database_1.prisma.cylinder.delete({
            where: { id }
        });
    }
}
exports.CylinderService = CylinderService;
