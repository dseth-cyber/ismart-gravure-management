import { Request, Response, NextFunction } from 'express';
import { CylinderService } from './cylinder.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { CylinderDto, CylinderStatus } from '@shared/dto/cylinder/cylinder.dto';
import { emitEvent } from '../realtime/realtime';
import { AuditService } from '../audit/audit.service';

export class CylinderController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await CylinderService.create(req.body);
      await AuditService.record(req, 'cylinder.create', `Created cylinder ${result.id}`);
      const response: ApiResponse<CylinderDto> = {
        status: 'success',
        statusCode: 201,
        data: {
          id: result.id,
          productCode: result.productCode,
          color: result.color,
          colorName: result.colorName,
          status: result.status as CylinderStatus,
          location: result.location,
          meter: result.meter,
          lastUsed: result.lastUsed ? result.lastUsed.toISOString() : null,
          type: result.type,
          size: result.size,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      emitEvent('dashboard:refresh', { type: 'cylinder:created', id: result.id });
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const showDeleted = req.query.showDeleted === 'true';
      const cylinders = await CylinderService.list(search, status, showDeleted);
      
      const data: CylinderDto[] = cylinders.map((c: any) => ({
        id: c.id,
        productCode: c.productCode,
        color: c.color,
        colorName: c.colorName,
        status: c.status as CylinderStatus,
        location: c.location,
        meter: c.meter,
        lastUsed: c.lastUsed ? c.lastUsed.toISOString() : null,
        type: c.type,
        size: c.size,
        deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }));

      const response: ApiResponse<CylinderDto[]> = {
        status: 'success',
        statusCode: 200,
        data
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await CylinderService.getById(req.params.id as string);
      const response: ApiResponse<CylinderDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          productCode: result.productCode,
          color: result.color,
          colorName: result.colorName,
          status: result.status as CylinderStatus,
          location: result.location,
          meter: result.meter,
          lastUsed: result.lastUsed ? result.lastUsed.toISOString() : null,
          type: result.type,
          size: result.size,
          deletedAt: result.deletedAt ? result.deletedAt.toISOString() : null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await CylinderService.update(req.params.id as string, req.body);
      await AuditService.record(req, 'cylinder.update', `Updated cylinder ${result.id}`);
      const response: ApiResponse<CylinderDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          productCode: result.productCode,
          color: result.color,
          colorName: result.colorName,
          status: result.status as CylinderStatus,
          location: result.location,
          meter: result.meter,
          lastUsed: result.lastUsed ? result.lastUsed.toISOString() : null,
          type: result.type,
          size: result.size,
          deletedAt: result.deletedAt ? result.deletedAt.toISOString() : null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      emitEvent('dashboard:refresh', { type: 'cylinder:updated', id: result.id });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await CylinderService.delete(req.params.id as string);
      await AuditService.record(req, 'cylinder.delete', `Deleted cylinder ${req.params.id}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Moved to trash'
      };
      emitEvent('dashboard:refresh', { type: 'cylinder:deleted', id: req.params.id });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await CylinderService.restore(req.params.id as string);
      await AuditService.record(req, 'cylinder.restore', `Restored cylinder ${result.id}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Restored'
      };
      emitEvent('dashboard:refresh', { type: 'cylinder:restored', id: result.id });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async permanentDelete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await CylinderService.permanentDelete(req.params.id as string);
      await AuditService.record(req, 'cylinder.permanent_delete', `Permanently deleted cylinder ${req.params.id}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Permanently deleted'
      };
      emitEvent('dashboard:refresh', { type: 'cylinder:permanentDeleted', id: req.params.id });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async emptyTrash(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { count } = await CylinderService.emptyTrash();
      await AuditService.record(req, 'cylinder.empty_trash', `Emptied cylinder trash bin. Purged ${count} cylinder(s)`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        data: { deleted: count },
        message: 'Trash emptied successfully'
      };
      emitEvent('dashboard:refresh', { type: 'cylinder:emptyTrash' });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async batchUpdateStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { ids, status } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'ids array is required' });
      }
      const validStatuses: CylinderStatus[] = ['available', 'inProduction', 'reserved', 'repair', 'inspection', 'hold'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      const { count } = await CylinderService.batchUpdateStatus(ids, status);
      await AuditService.record(req, 'cylinder.batch_status', `Batch updated ${count} cylinder(s) to ${status}`);
      emitEvent('dashboard:refresh', { type: 'cylinder:batchStatus', ids, status });
      return res.status(200).json({ status: 'success', statusCode: 200, data: { updated: count } });
    } catch (error) {
      next(error);
    }
  }

  static async batchDelete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'ids array is required' });
      }
      const { count } = await CylinderService.batchDelete(ids);
      await AuditService.record(req, 'cylinder.batch_delete', `Batch deleted ${count} cylinder(s)`);
      emitEvent('dashboard:refresh', { type: 'cylinder:batchDeleted', ids });
      return res.status(200).json({ status: 'success', statusCode: 200, data: { deleted: count } });
    } catch (error) {
      next(error);
    }
  }

  static async batchRestore(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'ids array is required' });
      }
      const { count } = await CylinderService.batchRestore(ids);
      await AuditService.record(req, 'cylinder.batch_restore', `Batch restored ${count} cylinder(s)`);
      emitEvent('dashboard:refresh', { type: 'cylinder:batchRestored', ids });
      return res.status(200).json({ status: 'success', statusCode: 200, data: { restored: count } });
    } catch (error) {
      next(error);
    }
  }

  static async checkExists(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const field = req.query.field as string;
      const value = req.query.value as string;
      if (!field || !value) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'field and value query params required' });
      }
      const exists = await CylinderService.checkExists(field, value);
      return res.status(200).json({ status: 'success', statusCode: 200, data: { exists } });
    } catch (error) {
      next(error);
    }
  }
}
