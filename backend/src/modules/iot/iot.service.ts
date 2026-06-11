import { prisma } from '../../config/database';

export class IotService {
  // ─── Device Registry ──────────────────────────────────────────────
  static async getDevices(options: { type?: string; active?: boolean; limit?: number; offset?: number }) {
    const where: any = {};
    if (options.type) where.type = options.type;
    if (options.active !== undefined) where.isActive = options.active;

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        orderBy: { lastSeen: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.device.count({ where }),
    ]);
    return { devices, total };
  }

  static async getDevice(id: string) {
    return prisma.device.findUnique({ where: { id } });
  }

  static async upsertDevice(data: { id?: string; deviceId: string; name: string; type: string; metadata?: string; location?: string; isActive?: boolean; firmwareVer?: string }) {
    if (data.id || (await prisma.device.findUnique({ where: { deviceId: data.deviceId } }))) {
      const where = data.id ? { id: data.id } : { deviceId: data.deviceId };
      return prisma.device.update({ where, data });
    }
    return prisma.device.create({ data });
  }

  static async deleteDevice(id: string) {
    return prisma.device.delete({ where: { id } });
  }

  static async updateLastSeen(deviceId: string) {
    return prisma.device.update({
      where: { deviceId },
      data: { lastSeen: new Date() },
    });
  }

  // ─── Telemetry ────────────────────────────────────────────────────
  static async ingestTelemetry(deviceId: string, readings: { key: string; value: string; unit?: string; timestamp?: string }[]) {
    const device = await prisma.device.findUnique({ where: { deviceId } });
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

    await prisma.deviceTelemetry.createMany({ data });
    return { ingested: data.length };
  }

  static async getTelemetry(options: { deviceId?: string; key?: string; from?: string; to?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (options.deviceId) {
      const device = await prisma.device.findUnique({ where: { deviceId: options.deviceId } });
      if (device) where.deviceId = device.id;
    }
    if (options.key) where.key = options.key;
    if (options.from || options.to) {
      where.timestamp = {};
      if (options.from) where.timestamp.gte = new Date(options.from);
      if (options.to) where.timestamp.lte = new Date(options.to);
    }

    const [telemetry, total] = await Promise.all([
      prisma.deviceTelemetry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: options.limit || 100,
        skip: options.offset || 0,
      }),
      prisma.deviceTelemetry.count({ where }),
    ]);
    return { telemetry, total };
  }

  static async getLatestTelemetry(deviceId: string) {
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) return [];

    // Get latest reading per key
    const keys = await prisma.deviceTelemetry.findMany({
      where: { deviceId: device.id },
      distinct: ['key'],
      select: { key: true },
    });

    const latest = await Promise.all(
      keys.map(k =>
        prisma.deviceTelemetry.findFirst({
          where: { deviceId: device.id, key: k.key },
          orderBy: { timestamp: 'desc' },
        })
      )
    );

    return latest.filter(Boolean);
  }

  // ─── MQTT Bridge ──────────────────────────────────────────────────
  static async publishToDevice(deviceId: string, topic: string, payload: any): Promise<void> {
    // In a full implementation, this would publish to MQTT broker.
    // For now, we log the action.
    console.log(`[MQTT Bridge] Publish to ${deviceId}/${topic}:`, JSON.stringify(payload));
  }
}
