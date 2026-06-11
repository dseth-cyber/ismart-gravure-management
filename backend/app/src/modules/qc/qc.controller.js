"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QcController = void 0;
const qc_service_1 = require("./qc.service");
const audit_service_1 = require("../audit/audit.service");
class QcController {
    static async createInspection(req, res, next) {
        try {
            const result = await qc_service_1.QcService.createInspection(req.params.jobNumber, req.body);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'qc_inspection.create', `Recorded QC inspection for Job ${result.jobNumber}. Result: ${result.status}`);
            const response = {
                status: 'success',
                statusCode: 201,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    inspector: result.inspector,
                    shadeResult: result.shadeResult,
                    barcodePassed: result.barcodePassed,
                    colorSequencePassed: result.colorSequencePassed,
                    adhesionPassed: result.adhesionPassed,
                    status: result.status,
                    remarks: result.remarks,
                    createdAt: result.createdAt.toISOString()
                }
            };
            return res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async listInspections(req, res, next) {
        try {
            const inspections = await qc_service_1.QcService.listInspections();
            const data = inspections.map(i => ({
                id: i.id,
                jobNumber: i.jobNumber,
                inspector: i.inspector,
                shadeResult: i.shadeResult,
                barcodePassed: i.barcodePassed,
                colorSequencePassed: i.colorSequencePassed,
                adhesionPassed: i.adhesionPassed,
                status: i.status,
                remarks: i.remarks,
                createdAt: i.createdAt.toISOString()
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
    static async getInspectionById(req, res, next) {
        try {
            const result = await qc_service_1.QcService.getInspectionById(req.params.id);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    jobNumber: result.jobNumber,
                    inspector: result.inspector,
                    shadeResult: result.shadeResult,
                    barcodePassed: result.barcodePassed,
                    colorSequencePassed: result.colorSequencePassed,
                    adhesionPassed: result.adhesionPassed,
                    status: result.status,
                    remarks: result.remarks,
                    createdAt: result.createdAt.toISOString()
                }
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async listInspectionsByJobNumber(req, res, next) {
        try {
            const inspections = await qc_service_1.QcService.listInspectionsByJobNumber(req.params.jobNumber);
            const data = inspections.map(i => ({
                id: i.id,
                jobNumber: i.jobNumber,
                inspector: i.inspector,
                shadeResult: i.shadeResult,
                barcodePassed: i.barcodePassed,
                colorSequencePassed: i.colorSequencePassed,
                adhesionPassed: i.adhesionPassed,
                status: i.status,
                remarks: i.remarks,
                createdAt: i.createdAt.toISOString()
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
    static async deleteInspection(req, res, next) {
        try {
            const result = await qc_service_1.QcService.deleteInspection(req.params.id);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'qc_inspection.delete', `Deleted QC inspection ID ${result.id} for Job ${result.jobNumber}`);
            const response = {
                status: 'success',
                statusCode: 200,
                message: 'QC inspection deleted successfully'
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getTraceability(req, res, next) {
        try {
            const dimension = req.query.dimension;
            const queryVal = req.query.query;
            const result = await qc_service_1.QcService.getTraceability(dimension, queryVal);
            const response = {
                status: 'success',
                statusCode: 200,
                data: result
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.QcController = QcController;
