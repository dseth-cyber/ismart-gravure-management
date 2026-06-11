import { Request, Response, NextFunction } from 'express';
import { IotService } from './iot.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class IotController {
  // ─── Device CRUD ──────────────────────────────────────────────────
  static async listDevices(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { devices, total } = await IotService.getDevices({
        type: String(req.query.type || ''),
        active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
        limit: parseInt(String(req.query.limit || '50'), 10),
        offset: parseInt(String(req.query.offset || '0'), 10),
      });
      return res.status(200).json({ status: 'success', statusCode: 200, data: { devices, total } } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getDevice(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const device = await IotService.getDevice(String(req.params.id));
      if (!device) {
        return res.status(404).json({ status: 'error', statusCode: 404, message: 'Device not found' } as ApiResponse);
      }
      return res.status(200).json({ status: 'success', statusCode: 200, data: device } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async upsertDevice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const device = await IotService.upsertDevice(req.body);
      return res.status(200).json({ status: 'success', statusCode: 200, data: device } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async deleteDevice(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await IotService.deleteDevice(String(req.params.id));
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Device deleted' } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ─── Telemetry ────────────────────────────────────────────────────
  static async ingestTelemetry(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { deviceId, readings } = req.body;
      if (!deviceId || !readings?.length) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'deviceId and readings[] required' } as ApiResponse);
      }
      const result = await IotService.ingestTelemetry(deviceId, readings);
      return res.status(201).json({ status: 'success', statusCode: 201, data: result } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getTelemetry(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { telemetry, total } = await IotService.getTelemetry({
        deviceId: String(req.query.deviceId || ''),
        key: String(req.query.key || ''),
        from: String(req.query.from || ''),
        to: String(req.query.to || ''),
        limit: parseInt(String(req.query.limit || '100'), 10),
        offset: parseInt(String(req.query.offset || '0'), 10),
      });
      return res.status(200).json({ status: 'success', statusCode: 200, data: { telemetry, total } } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getLatestTelemetry(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const data = await IotService.getLatestTelemetry(String(req.params.deviceId));
      return res.status(200).json({ status: 'success', statusCode: 200, data } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ─── MQTT Publish ─────────────────────────────────────────────────
  static async publishToDevice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { deviceId, topic, payload } = req.body;
      if (!deviceId || !topic) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'deviceId and topic required' } as ApiResponse);
      }
      await IotService.publishToDevice(deviceId, topic, payload);
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Published' } as ApiResponse);
    } catch (error) { next(error); }
  }
}
