"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IotController = void 0;
const iot_service_1 = require("./iot.service");
class IotController {
    // ─── Device CRUD ──────────────────────────────────────────────────
    static async listDevices(req, res, next) {
        try {
            const { devices, total } = await iot_service_1.IotService.getDevices({
                type: String(req.query.type || ''),
                active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
                limit: parseInt(String(req.query.limit || '50'), 10),
                offset: parseInt(String(req.query.offset || '0'), 10),
            });
            return res.status(200).json({ status: 'success', statusCode: 200, data: { devices, total } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getDevice(req, res, next) {
        try {
            const device = await iot_service_1.IotService.getDevice(String(req.params.id));
            if (!device) {
                return res.status(404).json({ status: 'error', statusCode: 404, message: 'Device not found' });
            }
            return res.status(200).json({ status: 'success', statusCode: 200, data: device });
        }
        catch (error) {
            next(error);
        }
    }
    static async upsertDevice(req, res, next) {
        try {
            const device = await iot_service_1.IotService.upsertDevice(req.body);
            return res.status(200).json({ status: 'success', statusCode: 200, data: device });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteDevice(req, res, next) {
        try {
            await iot_service_1.IotService.deleteDevice(String(req.params.id));
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Device deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    // ─── Telemetry ────────────────────────────────────────────────────
    static async ingestTelemetry(req, res, next) {
        try {
            const { deviceId, readings } = req.body;
            if (!deviceId || !readings?.length) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'deviceId and readings[] required' });
            }
            const result = await iot_service_1.IotService.ingestTelemetry(deviceId, readings);
            return res.status(201).json({ status: 'success', statusCode: 201, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTelemetry(req, res, next) {
        try {
            const { telemetry, total } = await iot_service_1.IotService.getTelemetry({
                deviceId: String(req.query.deviceId || ''),
                key: String(req.query.key || ''),
                from: String(req.query.from || ''),
                to: String(req.query.to || ''),
                limit: parseInt(String(req.query.limit || '100'), 10),
                offset: parseInt(String(req.query.offset || '0'), 10),
            });
            return res.status(200).json({ status: 'success', statusCode: 200, data: { telemetry, total } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getLatestTelemetry(req, res, next) {
        try {
            const data = await iot_service_1.IotService.getLatestTelemetry(String(req.params.deviceId));
            return res.status(200).json({ status: 'success', statusCode: 200, data });
        }
        catch (error) {
            next(error);
        }
    }
    // ─── MQTT Publish ─────────────────────────────────────────────────
    static async publishToDevice(req, res, next) {
        try {
            const { deviceId, topic, payload } = req.body;
            if (!deviceId || !topic) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'deviceId and topic required' });
            }
            await iot_service_1.IotService.publishToDevice(deviceId, topic, payload);
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Published' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.IotController = IotController;
