"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class JobService {
    static async create(dto) {
        if (!dto.jobNumber || !dto.orderNumber || !dto.productCode || !dto.machineName || !dto.plannedDate) {
            throw new error_1.AppError('Missing required production job fields', 400);
        }
        const existing = await database_1.prisma.productionJob.findUnique({
            where: { jobNumber: dto.jobNumber }
        });
        if (existing) {
            throw new error_1.AppError(`Production job ${dto.jobNumber} already exists`, 400);
        }
        const product = await database_1.prisma.product.findUnique({
            where: { code: dto.productCode }
        });
        if (!product) {
            throw new error_1.AppError(`Product with code ${dto.productCode} not found`, 400);
        }
        return database_1.prisma.productionJob.create({
            data: {
                jobNumber: dto.jobNumber,
                orderNumber: dto.orderNumber,
                productCode: dto.productCode,
                machineName: dto.machineName,
                plannedDate: new Date(dto.plannedDate),
                status: 'pending'
            }
        });
    }
    static async list() {
        return database_1.prisma.productionJob.findMany({
            orderBy: { plannedDate: 'desc' }
        });
    }
    static async getByJobNumber(jobNumber) {
        const job = await database_1.prisma.productionJob.findUnique({
            where: { jobNumber }
        });
        if (!job) {
            throw new error_1.AppError(`Production job ${jobNumber} not found`, 404);
        }
        return job;
    }
    static async updateStatus(jobNumber, dto) {
        const job = await this.getByJobNumber(jobNumber);
        return database_1.prisma.productionJob.update({
            where: { id: job.id },
            data: { status: dto.status }
        });
    }
    static async verify(jobNumber, dto) {
        const job = await this.getByJobNumber(jobNumber);
        if (!dto.verifiedBy || !dto.scannedCylinderIds || !dto.scannedInkBatchIds) {
            throw new error_1.AppError('Missing verification scanner payload parameters', 400);
        }
        const cylinders = await database_1.prisma.cylinder.findMany({
            where: { id: { in: dto.scannedCylinderIds } }
        });
        if (cylinders.length !== dto.scannedCylinderIds.length) {
            throw new error_1.AppError('One or more scanned Cylinder IDs do not exist in the database', 400);
        }
        for (const cyl of cylinders) {
            if (cyl.productCode !== job.productCode) {
                throw new error_1.AppError(`Cylinder ${cyl.id} is registered for product ${cyl.productCode}, but Job requires product ${job.productCode}`, 400);
            }
        }
        const inkBatches = await database_1.prisma.inkBatch.findMany({
            where: { id: { in: dto.scannedInkBatchIds } }
        });
        if (inkBatches.length !== dto.scannedInkBatchIds.length) {
            throw new error_1.AppError('One or more scanned Ink Batch IDs do not exist in the database', 400);
        }
        let requiresOverride = false;
        for (const batch of inkBatches) {
            const now = new Date();
            if (batch.expiryDate < now) {
                throw new error_1.AppError(`Ink Batch ${batch.id} has EXPIRED on ${batch.expiryDate.toISOString().split('T')[0]} and cannot be used`, 400);
            }
            if (batch.status === 'nearExpiry') {
                requiresOverride = true;
            }
        }
        const isPassed = !requiresOverride;
        const result = await database_1.prisma.jobVerification.upsert({
            where: { jobNumber },
            update: {
                verifiedBy: dto.verifiedBy,
                isPassed,
                scannedCylinders: dto.scannedCylinderIds.join(','),
                scannedInkBatches: dto.scannedInkBatchIds.join(','),
                requiresOverride,
                overrideBy: isPassed ? null : undefined
            },
            create: {
                jobNumber,
                verifiedBy: dto.verifiedBy,
                isPassed,
                scannedCylinders: dto.scannedCylinderIds.join(','),
                scannedInkBatches: dto.scannedInkBatchIds.join(','),
                requiresOverride,
                overrideBy: null
            }
        });
        await database_1.prisma.productionJob.update({
            where: { id: job.id },
            data: { status: 'verifying' }
        });
        return result;
    }
    static async override(jobNumber, dto) {
        await this.getByJobNumber(jobNumber);
        const verification = await database_1.prisma.jobVerification.findUnique({
            where: { jobNumber }
        });
        if (!verification) {
            throw new error_1.AppError(`No verification records found for Job ${jobNumber}`, 404);
        }
        if (!verification.requiresOverride) {
            throw new error_1.AppError('This verification does not require a supervisor override', 400);
        }
        return database_1.prisma.jobVerification.update({
            where: { jobNumber },
            data: {
                isPassed: true,
                overrideBy: dto.overrideBy
            }
        });
    }
    static async logProduction(jobNumber, dto) {
        const job = await this.getByJobNumber(jobNumber);
        if (dto.startMeter === undefined || dto.endMeter === undefined || dto.scrapQuantity === undefined || !dto.machineName || !dto.operator) {
            throw new error_1.AppError('Missing production log properties', 400);
        }
        const totalPrinted = dto.endMeter - dto.startMeter;
        const log = await database_1.prisma.productionLog.create({
            data: {
                jobNumber,
                machineName: dto.machineName,
                operator: dto.operator,
                startMeter: dto.startMeter,
                endMeter: dto.endMeter,
                totalPrinted,
                scrapQuantity: dto.scrapQuantity,
                status: 'completed'
            }
        });
        const verification = await database_1.prisma.jobVerification.findUnique({
            where: { jobNumber }
        });
        if (verification) {
            const cylinderIds = verification.scannedCylinders.split(',').filter(Boolean);
            if (cylinderIds.length > 0) {
                await database_1.prisma.cylinder.updateMany({
                    where: { id: { in: cylinderIds } },
                    data: {
                        meter: { increment: totalPrinted },
                        lastUsed: new Date(),
                        status: 'available'
                    }
                });
            }
            const inkBatchIds = verification.scannedInkBatches.split(',').filter(Boolean);
            for (const batchId of inkBatchIds) {
                const batch = await database_1.prisma.inkBatch.findUnique({ where: { id: batchId } });
                if (batch) {
                    const usage = Math.min(batch.remaining, 2.5);
                    await database_1.prisma.inkBatch.update({
                        where: { id: batchId },
                        data: {
                            remaining: { decrement: usage }
                        }
                    });
                }
            }
        }
        await database_1.prisma.productionJob.update({
            where: { id: job.id },
            data: {
                status: 'completed',
                totalPrinted
            }
        });
        return log;
    }
    static async listLogs(jobNumber) {
        return database_1.prisma.productionLog.findMany({
            where: jobNumber ? { jobNumber } : undefined,
            orderBy: { createdAt: 'desc' }
        });
    }
    static async getVerification(jobNumber) {
        return database_1.prisma.jobVerification.findUnique({
            where: { jobNumber }
        });
    }
}
exports.JobService = JobService;
