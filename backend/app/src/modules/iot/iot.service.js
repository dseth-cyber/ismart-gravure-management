"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IotService = void 0;
const database_1 = require("../../config/database");
class IotService {
    // ─── Device Registry ──────────────────────────────────────────────
    static async getDevices(options) {
        const where = {};
        if (options.type)
            where.type = options.type;
        if (options.active !== undefined)
            where.isActive = options.active;
        const [devices, total] = await Promise.all([
            database_1.prisma.device.findMany({
                where,
                orderBy: { lastSeen: 'desc' },
                take: options.limit || 50,
                skip: options.offset || 0,
            }),
            database_1.prisma.device.count({ where }),
        ]);
        return { devices, total };
    }
    static async getDevice(id) {
        return database_1.prisma.device.findUnique({ where: { id } });
    }
    static async upsertDevice(data) {
        if (data.id || (await database_1.prisma.device.findUnique({ where: { deviceId: data.deviceId } }))) {
            const where = data.id ? { id: data.id } : { deviceId: data.deviceId };
            return database_1.prisma.device.update({ where, data });
        }
        return database_1.prisma.device.create({ data });
    }
    static async deleteDevice(id) {
        return database_1.prisma.device.delete({ where: { id } });
    }
    static async updateLastSeen(deviceId) {
        return database_1.prisma.device.update({
            where: { deviceId },
            data: { lastSeen: new Date() },
        });
    }
    // ─── Telemetry ────────────────────────────────────────────────────
    static async ingestTelemetry(deviceId, readings) {
        const device = await database_1.prisma.device.findUnique({ where: { deviceId } });
        if (!device) {
            throw new Error(`Device not found: ${deviceId}`);
        }
        await this.updateLastSeen(deviceId);
        const data = readings.map(r => ({
            deviceId: device.id,
            key: r.key,
            value: r.value,
            unit: r.unit || null,
            timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
        }));
        await database_1.prisma.deviceTelemetry.createMany({ data });
        return { ingested: data.length };
    }
    static async getTelemetry(options) {
        const where = {};
        if (options.deviceId) {
            const device = await database_1.prisma.device.findUnique({ where: { deviceId: options.deviceId } });
            if (device)
                where.deviceId = device.id;
        }
        if (options.key)
            where.key = options.key;
        if (options.from || options.to) {
            where.timestamp = {};
            if (options.from)
                where.timestamp.gte = new Date(options.from);
            if (options.to)
                where.timestamp.lte = new Date(options.to);
        }
        const [telemetry, total] = await Promise.all([
            database_1.prisma.deviceTelemetry.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: options.limit || 100,
                skip: options.offset || 0,
            }),
            database_1.prisma.deviceTelemetry.count({ where }),
        ]);
        return { telemetry, total };
    }
    static async getLatestTelemetry(deviceId) {
        const device = await database_1.prisma.device.findUnique({ where: { deviceId } });
        if (!device)
            return [];
        // Get latest reading per key
        const keys = await database_1.prisma.deviceTelemetry.findMany({
            where: { deviceId: device.id },
            distinct: ['key'],
            select: { key: true },
        });
        const latest = await Promise.all(keys.map(k => database_1.prisma.deviceTelemetry.findFirst({
            where: { deviceId: device.id, key: k.key },
            orderBy: { timestamp: 'desc' },
        })));
        return latest.filter(Boolean);
    }
    // ─── MQTT Bridge ──────────────────────────────────────────────────
    static async publishToDevice(deviceId, topic, payload) {
        // In a full implementation, this would publish to MQTT broker.
        // For now, we log the action.
        console.log(`[MQTT Bridge] Publish to ${deviceId}/${topic}:`, JSON.stringify(payload));
    }
}
exports.IotService = IotService;
