"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InkService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class InkService {
    // --- Ink Formulas ---
    static async createFormula(dto) {
        if (!dto.code || !dto.productCode || !dto.color || !dto.pantone || !dto.viscosity || !dto.labTarget || !dto.solvent) {
            throw new error_1.AppError('Formula code, productCode, color, pantone, viscosity, labTarget, and solvent are required', 400);
        }
        // 1. Check duplicate code
        const existing = await database_1.prisma.inkFormula.findUnique({
            where: { code: dto.code }
        });
        if (existing) {
            throw new error_1.AppError(`Formula with code ${dto.code} already exists`, 400);
        }
        // 2. Validate productCode exists
        const product = await database_1.prisma.product.findUnique({
            where: { code: dto.productCode }
        });
        if (!product) {
            throw new error_1.AppError(`Product with code ${dto.productCode} does not exist`, 400);
        }
        return database_1.prisma.inkFormula.create({
            data: {
                code: dto.code,
                productCode: dto.productCode,
                color: dto.color,
                pantone: dto.pantone,
                viscosity: dto.viscosity,
                labTarget: dto.labTarget,
                solvent: dto.solvent,
                status: 'active'
            }
        });
    }
    static async listFormulas(search) {
        return database_1.prisma.inkFormula.findMany({
            where: search ? {
                OR: [
                    { code: { contains: search, mode: 'insensitive' } },
                    { productCode: { contains: search, mode: 'insensitive' } },
                    { color: { contains: search, mode: 'insensitive' } }
                ]
            } : undefined,
            orderBy: { code: 'asc' }
        });
    }
    static async getFormulaByCode(code) {
        const formula = await database_1.prisma.inkFormula.findUnique({
            where: { code }
        });
        if (!formula) {
            throw new error_1.AppError('Ink formula not found', 404);
        }
        return formula;
    }
    static async updateFormula(code, dto) {
        await this.getFormulaByCode(code);
        return database_1.prisma.inkFormula.update({
            where: { code },
            data: {
                pantone: dto.pantone,
                status: dto.status,
                viscosity: dto.viscosity,
                labTarget: dto.labTarget,
                solvent: dto.solvent
            }
        });
    }
    static async deleteFormula(code) {
        await this.getFormulaByCode(code);
        return database_1.prisma.inkFormula.delete({
            where: { code }
        });
    }
    // --- Ink Batches ---
    static async createBatch(dto) {
        if (!dto.id || !dto.color || !dto.expiryDate || dto.weight === undefined || !dto.operator) {
            throw new error_1.AppError('Batch id, color, expiryDate, weight, and operator are required', 400);
        }
        // 1. Check duplicate ID
        const existing = await database_1.prisma.inkBatch.findUnique({
            where: { id: dto.id }
        });
        if (existing) {
            throw new error_1.AppError(`Ink batch with ID ${dto.id} already exists`, 400);
        }
        // 2. Validate formulaCode and productCode if provided (not RAW base)
        if (dto.formulaCode) {
            const formula = await database_1.prisma.inkFormula.findUnique({
                where: { code: dto.formulaCode }
            });
            if (!formula) {
                throw new error_1.AppError(`Formula with code ${dto.formulaCode} does not exist`, 400);
            }
        }
        if (dto.productCode) {
            const product = await database_1.prisma.product.findUnique({
                where: { code: dto.productCode }
            });
            if (!product) {
                throw new error_1.AppError(`Product with code ${dto.productCode} does not exist`, 400);
            }
        }
        return database_1.prisma.inkBatch.create({
            data: {
                id: dto.id,
                formulaCode: dto.formulaCode || null,
                productCode: dto.productCode || null,
                color: dto.color,
                mixDate: dto.mixDate ? new Date(dto.mixDate) : null,
                expiryDate: new Date(dto.expiryDate),
                weight: dto.weight,
                remaining: dto.weight, // Initially remaining equals weight
                operator: dto.operator,
                status: 'active'
            }
        });
    }
    static async listBatches(search, sortByExpiry = false) {
        return database_1.prisma.inkBatch.findMany({
            where: search ? {
                OR: [
                    { id: { contains: search, mode: 'insensitive' } },
                    { color: { contains: search, mode: 'insensitive' } },
                    { operator: { contains: search, mode: 'insensitive' } }
                ]
            } : undefined,
            orderBy: sortByExpiry ? { expiryDate: 'asc' } : { id: 'desc' }
        });
    }
    static async getBatchById(id) {
        const batch = await database_1.prisma.inkBatch.findUnique({
            where: { id }
        });
        if (!batch) {
            throw new error_1.AppError('Ink batch not found', 404);
        }
        return batch;
    }
    static async updateBatch(id, dto) {
        await this.getBatchById(id);
        return database_1.prisma.inkBatch.update({
            where: { id },
            data: {
                remaining: dto.remaining,
                status: dto.status
            }
        });
    }
    static async deleteBatch(id) {
        await this.getBatchById(id);
        return database_1.prisma.inkBatch.delete({
            where: { id }
        });
    }
}
exports.InkService = InkService;
