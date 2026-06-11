"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InkController = void 0;
const ink_service_1 = require("./ink.service");
const realtime_1 = require("../realtime/realtime");
class InkController {
    // --- Ink Formulas ---
    static async createFormula(req, res, next) {
        try {
            const result = await ink_service_1.InkService.createFormula(req.body);
            const response = {
                status: 'success',
                statusCode: 201,
                data: {
                    code: result.code,
                    productCode: result.productCode,
                    color: result.color,
                    pantone: result.pantone,
                    revision: result.revision,
                    status: result.status,
                    viscosity: result.viscosity,
                    labTarget: result.labTarget,
                    solvent: result.solvent,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'formula:created', code: result.code });
            return res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async listFormulas(req, res, next) {
        try {
            const search = req.query.search;
            const formulas = await ink_service_1.InkService.listFormulas(search);
            const data = formulas.map((f) => ({
                code: f.code,
                productCode: f.productCode,
                color: f.color,
                pantone: f.pantone,
                revision: f.revision,
                status: f.status,
                viscosity: f.viscosity,
                labTarget: f.labTarget,
                solvent: f.solvent,
                createdAt: f.createdAt.toISOString(),
                updatedAt: f.updatedAt.toISOString()
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
    static async getFormulaByCode(req, res, next) {
        try {
            const result = await ink_service_1.InkService.getFormulaByCode(req.params.code);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    code: result.code,
                    productCode: result.productCode,
                    color: result.color,
                    pantone: result.pantone,
                    revision: result.revision,
                    status: result.status,
                    viscosity: result.viscosity,
                    labTarget: result.labTarget,
                    solvent: result.solvent,
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
    static async updateFormula(req, res, next) {
        try {
            const result = await ink_service_1.InkService.updateFormula(req.params.code, req.body);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    code: result.code,
                    productCode: result.productCode,
                    color: result.color,
                    pantone: result.pantone,
                    revision: result.revision,
                    status: result.status,
                    viscosity: result.viscosity,
                    labTarget: result.labTarget,
                    solvent: result.solvent,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'formula:updated', code: result.code });
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteFormula(req, res, next) {
        try {
            await ink_service_1.InkService.deleteFormula(req.params.code);
            const response = {
                status: 'success',
                statusCode: 200,
                message: 'Formula deleted successfully'
            };
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'formula:deleted', code: req.params.code });
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    // --- Ink Batches ---
    static async createBatch(req, res, next) {
        try {
            const result = await ink_service_1.InkService.createBatch(req.body);
            const response = {
                status: 'success',
                statusCode: 201,
                data: {
                    id: result.id,
                    formulaCode: result.formulaCode,
                    productCode: result.productCode,
                    color: result.color,
                    mixDate: result.mixDate ? result.mixDate.toISOString() : null,
                    expiryDate: result.expiryDate.toISOString(),
                    weight: result.weight,
                    remaining: result.remaining,
                    operator: result.operator,
                    status: result.status,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'batch:created', id: result.id });
            return res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async listBatches(req, res, next) {
        try {
            const search = req.query.search;
            const fefo = req.query.fefo === 'true';
            const batches = await ink_service_1.InkService.listBatches(search, fefo);
            const data = batches.map((b) => ({
                id: b.id,
                formulaCode: b.formulaCode,
                productCode: b.productCode,
                color: b.color,
                mixDate: b.mixDate ? b.mixDate.toISOString() : null,
                expiryDate: b.expiryDate.toISOString(),
                weight: b.weight,
                remaining: b.remaining,
                operator: b.operator,
                status: b.status,
                createdAt: b.createdAt.toISOString(),
                updatedAt: b.updatedAt.toISOString()
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
    static async getBatchById(req, res, next) {
        try {
            const result = await ink_service_1.InkService.getBatchById(req.params.id);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    formulaCode: result.formulaCode,
                    productCode: result.productCode,
                    color: result.color,
                    mixDate: result.mixDate ? result.mixDate.toISOString() : null,
                    expiryDate: result.expiryDate.toISOString(),
                    weight: result.weight,
                    remaining: result.remaining,
                    operator: result.operator,
                    status: result.status,
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
    static async updateBatch(req, res, next) {
        try {
            const result = await ink_service_1.InkService.updateBatch(req.params.id, req.body);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    formulaCode: result.formulaCode,
                    productCode: result.productCode,
                    color: result.color,
                    mixDate: result.mixDate ? result.mixDate.toISOString() : null,
                    expiryDate: result.expiryDate.toISOString(),
                    weight: result.weight,
                    remaining: result.remaining,
                    operator: result.operator,
                    status: result.status,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'batch:updated', id: result.id });
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteBatch(req, res, next) {
        try {
            await ink_service_1.InkService.deleteBatch(req.params.id);
            const response = {
                status: 'success',
                statusCode: 200,
                message: 'Batch deleted successfully'
            };
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'batch:deleted', id: req.params.id });
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.InkController = InkController;
