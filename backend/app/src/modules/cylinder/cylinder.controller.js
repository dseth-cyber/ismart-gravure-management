"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CylinderController = void 0;
const cylinder_service_1 = require("./cylinder.service");
const realtime_1 = require("../realtime/realtime");
class CylinderController {
    static async create(req, res, next) {
        try {
            const result = await cylinder_service_1.CylinderService.create(req.body);
            const response = {
                status: 'success',
                statusCode: 201,
                data: {
                    id: result.id,
                    productCode: result.productCode,
                    color: result.color,
                    colorName: result.colorName,
                    status: result.status,
                    location: result.location,
                    meter: result.meter,
                    lastUsed: result.lastUsed ? result.lastUsed.toISOString() : null,
                    type: result.type,
                    size: result.size,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'cylinder:created', id: result.id });
            return res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async list(req, res, next) {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const cylinders = await cylinder_service_1.CylinderService.list(search, status);
            const data = cylinders.map((c) => ({
                id: c.id,
                productCode: c.productCode,
                color: c.color,
                colorName: c.colorName,
                status: c.status,
                location: c.location,
                meter: c.meter,
                lastUsed: c.lastUsed ? c.lastUsed.toISOString() : null,
                type: c.type,
                size: c.size,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString()
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
    static async getById(req, res, next) {
        try {
            const result = await cylinder_service_1.CylinderService.getById(req.params.id);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    productCode: result.productCode,
                    color: result.color,
                    colorName: result.colorName,
                    status: result.status,
                    location: result.location,
                    meter: result.meter,
                    lastUsed: result.lastUsed ? result.lastUsed.toISOString() : null,
                    type: result.type,
                    size: result.size,
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
    static async update(req, res, next) {
        try {
            const result = await cylinder_service_1.CylinderService.update(req.params.id, req.body);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    productCode: result.productCode,
                    color: result.color,
                    colorName: result.colorName,
                    status: result.status,
                    location: result.location,
                    meter: result.meter,
                    lastUsed: result.lastUsed ? result.lastUsed.toISOString() : null,
                    type: result.type,
                    size: result.size,
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString()
                }
            };
            (0, realtime_1.emitEvent)('dashboard:refresh', { type: 'cylinder:updated', id: result.id });
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            await cylinder_service_1.CylinderService.delete(req.params.id);
            const response = {
                status: 'success',
                statusCode: 200,
                message: 'Cylinder deleted successfully'
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CylinderController = CylinderController;
