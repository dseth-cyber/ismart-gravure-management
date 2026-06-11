"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobController = void 0;
const job_service_1 = require("./job.service");
const audit_service_1 = require("../audit/audit.service");
const realtime_1 = require("../realtime/realtime");
class JobController {
    static async create(req, res, next) {
        try {
            const result = await job_service_1.JobService.create(req.body);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'production_job.create', `Created Production Job ${result.jobNumber} for product ${result.productCode}`);
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'job:created', jobNumber: result.jobNumber });
            const response = {
                status: 'success',
                statusCode: 201,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    orderNumber: result.orderNumber,
                    productCode: result.productCode,
                    machineName: result.machineName,
                    plannedDate: result.plannedDate.toISOString(),
                    status: result.status,
                    totalPrinted: result.totalPrinted,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            return res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async list(req, res, next) {
        try {
            const jobs = await job_service_1.JobService.list();
            const data = jobs.map(j => ({
                id: j.id,
                jobNumber: j.jobNumber,
                orderNumber: j.orderNumber,
                productCode: j.productCode,
                machineName: j.machineName,
                plannedDate: j.plannedDate.toISOString(),
                status: j.status,
                totalPrinted: j.totalPrinted,
                createdAt: j.createdAt.toISOString(),
                updatedAt: j.updatedAt.toISOString()
            }));
            const response = {
                status: 'success',
                statusCode: 200,
                data
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getByJobNumber(req, res, next) {
        try {
            const result = await job_service_1.JobService.getByJobNumber(req.params.jobNumber);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    orderNumber: result.orderNumber,
                    productCode: result.productCode,
                    machineName: result.machineName,
                    plannedDate: result.plannedDate.toISOString(),
                    status: result.status,
                    totalPrinted: result.totalPrinted,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const result = await job_service_1.JobService.updateStatus(req.params.jobNumber, req.body);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'production_job.update_status', `Updated Production Job ${result.jobNumber} status to ${result.status}`);
            (0, realtime_1.emitEvent)('job:status', { jobNumber: result.jobNumber, status: result.status });
            (0, realtime_1.emitToJob)(result.jobNumber, 'job:status', { jobNumber: result.jobNumber, status: result.status });
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    orderNumber: result.orderNumber,
                    productCode: result.productCode,
                    machineName: result.machineName,
                    plannedDate: result.plannedDate.toISOString(),
                    status: result.status,
                    totalPrinted: result.totalPrinted,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async verify(req, res, next) {
        try {
            const result = await job_service_1.JobService.verify(req.params.jobNumber, req.body);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'production_job.verify', `Verified items for Job ${result.jobNumber}. Passed: ${result.isPassed}, Requires Override: ${result.requiresOverride}`);
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'job:verified', jobNumber: result.jobNumber });
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    verifiedBy: result.verifiedBy,
                    isPassed: result.isPassed,
                    scannedCylinders: result.scannedCylinders ? result.scannedCylinders.split(',') : [],
                    scannedInkBatches: result.scannedInkBatches ? result.scannedInkBatches.split(',') : [],
                    requiresOverride: result.requiresOverride,
                    overrideBy: result.overrideBy,
                    createdAt: result.createdAt.toISOString()
                }
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async override(req, res, next) {
        try {
            const result = await job_service_1.JobService.override(req.params.jobNumber, req.body);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'production_job.override', `Supervisor override applied for Job ${result.jobNumber} by ${result.overrideBy}`);
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'job:override', jobNumber: result.jobNumber });
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    verifiedBy: result.verifiedBy,
                    isPassed: result.isPassed,
                    scannedCylinders: result.scannedCylinders ? result.scannedCylinders.split(',') : [],
                    scannedInkBatches: result.scannedInkBatches ? result.scannedInkBatches.split(',') : [],
                    requiresOverride: result.requiresOverride,
                    overrideBy: result.overrideBy,
                    createdAt: result.createdAt.toISOString()
                }
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getVerification(req, res, next) {
        try {
            const result = await job_service_1.JobService.getVerification(req.params.jobNumber);
            if (!result) {
                return res.status(200).json({
                    status: 'success',
                    statusCode: 200,
                    data: null
                });
            }
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    verifiedBy: result.verifiedBy,
                    isPassed: result.isPassed,
                    scannedCylinders: result.scannedCylinders ? result.scannedCylinders.split(',') : [],
                    scannedInkBatches: result.scannedInkBatches ? result.scannedInkBatches.split(',') : [],
                    requiresOverride: result.requiresOverride,
                    overrideBy: result.overrideBy,
                    createdAt: result.createdAt.toISOString()
                }
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async logProduction(req, res, next) {
        try {
            const result = await job_service_1.JobService.logProduction(req.params.jobNumber, req.body);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'production_job.log_run', `Logged run for Job ${result.jobNumber}. Start: ${result.startMeter}, End: ${result.endMeter}, Total: ${result.totalPrinted}, Scrap: ${result.scrapQuantity}`);
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'job:log', jobNumber: result.jobNumber });
            const response = {
                status: 'success',
                statusCode: 201,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    machineName: result.machineName,
                    operator: result.operator,
                    startMeter: result.startMeter,
                    endMeter: result.endMeter,
                    totalPrinted: result.totalPrinted,
                    scrapQuantity: result.scrapQuantity,
                    status: result.status,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            return res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async listLogs(req, res, next) {
        try {
            const poolJob = req.params.jobNumber || req.query.jobNumber;
            const logs = await job_service_1.JobService.listLogs(poolJob);
            const data = logs.map(l => ({
                id: l.id,
                jobNumber: l.jobNumber,
                machineName: l.machineName,
                operator: l.operator,
                startMeter: l.startMeter,
                endMeter: l.endMeter,
                totalPrinted: l.totalPrinted,
                scrapQuantity: l.scrapQuantity,
                status: l.status,
                createdAt: l.createdAt.toISOString(),
                updatedAt: l.updatedAt.toISOString()
            }));
            const response = {
                status: 'success',
                statusCode: 200,
                data
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.JobController = JobController;
