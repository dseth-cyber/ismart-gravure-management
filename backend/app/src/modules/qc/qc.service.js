"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QcService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class QcService {
    static async createInspection(jobNumber, dto) {
        if (!jobNumber) {
            throw new error_1.AppError('Job number is required', 400);
        }
        if (!dto.inspector || !dto.shadeResult) {
            throw new error_1.AppError('Inspector and shade result are required', 400);
        }
        // Check if the production job exists
        const job = await database_1.prisma.productionJob.findUnique({
            where: { jobNumber }
        });
        if (!job) {
            throw new error_1.AppError(`Production job ${jobNumber} not found`, 404);
        }
        // Determine status based on check results
        const isPassed = dto.barcodePassed &&
            dto.colorSequencePassed &&
            dto.adhesionPassed &&
            ['pass', 'match', 'ok', 'good'].includes(dto.shadeResult.toLowerCase());
        const status = isPassed ? 'pass' : 'fail';
        const inspection = await database_1.prisma.qcInspection.create({
            data: {
                jobNumber,
                inspector: dto.inspector,
                shadeResult: dto.shadeResult,
                barcodePassed: dto.barcodePassed,
                colorSequencePassed: dto.colorSequencePassed,
                adhesionPassed: dto.adhesionPassed,
                status,
                remarks: dto.remarks || null
            }
        });
        // If the QC inspection fails, we might want to put the job on hold
        if (status === 'fail') {
            await database_1.prisma.productionJob.update({
                where: { id: job.id },
                data: { status: 'hold' }
            });
        }
        return inspection;
    }
    static async listInspections() {
        return database_1.prisma.qcInspection.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
    static async getInspectionById(id) {
        const inspection = await database_1.prisma.qcInspection.findUnique({
            where: { id }
        });
        if (!inspection) {
            throw new error_1.AppError(`QC Inspection with ID ${id} not found`, 404);
        }
        return inspection;
    }
    static async listInspectionsByJobNumber(jobNumber) {
        return database_1.prisma.qcInspection.findMany({
            where: { jobNumber },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async deleteInspection(id) {
        const inspection = await this.getInspectionById(id);
        await database_1.prisma.qcInspection.delete({
            where: { id: inspection.id }
        });
        return inspection;
    }
    static async getTraceability(dimension, queryVal) {
        if (!dimension || !queryVal) {
            throw new error_1.AppError('Dimension and query parameters are required for traceability', 400);
        }
        let jobNumbers = [];
        let initialProductCode = '';
        const normalizedDim = dimension.toLowerCase();
        if (normalizedDim === 'job') {
            const job = await database_1.prisma.productionJob.findUnique({
                where: { jobNumber: queryVal }
            });
            if (job) {
                jobNumbers.push(job.jobNumber);
                initialProductCode = job.productCode;
            }
        }
        else if (normalizedDim === 'product' || normalizedDim === 'sku') {
            initialProductCode = queryVal;
            const jobs = await database_1.prisma.productionJob.findMany({
                where: { productCode: queryVal }
            });
            jobNumbers = jobs.map(j => j.jobNumber);
        }
        else if (normalizedDim === 'cylinder') {
            // Find verifications that scanned this cylinder
            const verifications = await database_1.prisma.jobVerification.findMany({
                where: {
                    scannedCylinders: {
                        contains: queryVal
                    }
                }
            });
            jobNumbers = verifications.map(v => v.jobNumber);
        }
        else if (normalizedDim === 'ink') {
            // Find verifications that scanned this ink batch
            const verifications = await database_1.prisma.jobVerification.findMany({
                where: {
                    scannedInkBatches: {
                        contains: queryVal
                    }
                }
            });
            jobNumbers = verifications.map(v => v.jobNumber);
        }
        else if (normalizedDim === 'operator') {
            const logs = await database_1.prisma.productionLog.findMany({
                where: { operator: queryVal }
            });
            jobNumbers = Array.from(new Set(logs.map(l => l.jobNumber)));
        }
        else if (normalizedDim === 'machine') {
            const jobs = await database_1.prisma.productionJob.findMany({
                where: { machineName: queryVal }
            });
            jobNumbers = jobs.map(j => j.jobNumber);
        }
        else {
            throw new error_1.AppError(`Unsupported traceability dimension: ${dimension}`, 400);
        }
        // If no jobs were found, return empty results
        if (jobNumbers.length === 0) {
            return {
                productCode: initialProductCode || 'N/A',
                customerName: 'N/A',
                jobs: [],
                cylinders: [],
                inks: []
            };
        }
        // Get all jobs details
        const jobs = await database_1.prisma.productionJob.findMany({
            where: { jobNumber: { in: jobNumbers } }
        });
        // Determine the product code (use the first one found if not set)
        if (!initialProductCode && jobs.length > 0) {
            initialProductCode = jobs[0].productCode;
        }
        // Get Customer and Product information
        let customerName = 'N/A';
        if (initialProductCode) {
            const product = await database_1.prisma.product.findUnique({
                where: { code: initialProductCode }
            });
            if (product) {
                const customer = await database_1.prisma.customer.findUnique({
                    where: { code: product.customerCode }
                });
                if (customer) {
                    customerName = customer.name;
                }
            }
        }
        // Get all verifications for these jobs to collect cylinders & inks used
        const verifications = await database_1.prisma.jobVerification.findMany({
            where: { jobNumber: { in: jobNumbers } }
        });
        const cylinderIdsSet = new Set();
        const inkBatchIdsSet = new Set();
        verifications.forEach(v => {
            if (v.scannedCylinders) {
                v.scannedCylinders.split(',').filter(Boolean).forEach(id => cylinderIdsSet.add(id));
            }
            if (v.scannedInkBatches) {
                v.scannedInkBatches.split(',').filter(Boolean).forEach(id => inkBatchIdsSet.add(id));
            }
        });
        // Fetch details for cylinders
        const cylinders = await database_1.prisma.cylinder.findMany({
            where: { id: { in: Array.from(cylinderIdsSet) } }
        });
        // Fetch details for inks
        const inks = await database_1.prisma.inkBatch.findMany({
            where: { id: { in: Array.from(inkBatchIdsSet) } }
        });
        // Fetch logs to retrieve correct operator info for each job
        const logs = await database_1.prisma.productionLog.findMany({
            where: { jobNumber: { in: jobNumbers } }
        });
        return {
            productCode: initialProductCode || 'N/A',
            customerName,
            jobs: jobs.map(j => {
                const jobLogs = logs.filter(l => l.jobNumber === j.jobNumber);
                const operator = jobLogs.map(l => l.operator).join(', ') || 'N/A';
                return {
                    jobNumber: j.jobNumber,
                    plannedDate: j.plannedDate,
                    machineName: j.machineName,
                    operator,
                    totalPrinted: j.totalPrinted,
                    status: j.status
                };
            }),
            cylinders: cylinders.map(c => ({
                cylinderId: c.id,
                color: c.color,
                colorName: c.colorName,
                meter: c.meter,
                location: c.location
            })),
            inks: inks.map(i => ({
                batchId: i.id,
                color: i.color,
                formulaCode: i.formulaCode || 'N/A',
                expiryDate: i.expiryDate,
                remaining: i.remaining
            }))
        };
    }
}
exports.QcService = QcService;
