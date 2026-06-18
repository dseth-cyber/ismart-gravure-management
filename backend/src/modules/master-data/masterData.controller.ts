import { Response, NextFunction } from 'express';
import { MasterDataService } from './masterData.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuditService } from '../audit/audit.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class MasterDataController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const category = String(req.query.category || '');
      const showDeleted = req.query.showDeleted === 'true';
      if (!category) return res.status(400).json({ status: 'error', statusCode: 400, message: 'category query param required' });
      const items = await MasterDataService.list(category, showDeleted);
      return res.json({ status: 'success', statusCode: 200, data: items } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { category, name, nameTh, active, extra, sortOrder } = req.body;
      if (!category || !name) return res.status(400).json({ status: 'error', statusCode: 400, message: 'category and name are required' });
      const item = await MasterDataService.create({ category, name, nameTh, active, extra, sortOrder });
      await AuditService.record(req, `master_data.${category}.create`, `Created ${category}: ${name}`);
      return res.status(201).json({ status: 'success', statusCode: 201, data: item } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const { name, nameTh, active, extra, sortOrder } = req.body;
      const item = await MasterDataService.update(id, { name, nameTh, active, extra, sortOrder });
      await AuditService.record(req, `master_data.update`, `Updated master data item ${id}`);
      return res.json({ status: 'success', statusCode: 200, data: item } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const item = await MasterDataService.delete(id);
      await AuditService.record(req, `master_data.${item.category}.delete`, `Deleted ${item.category}: ${item.name}`);
      return res.json({ status: 'success', statusCode: 200, data: item } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async restore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const item = await MasterDataService.restore(id);
      await AuditService.record(req, `master_data.${item.category}.restore`, `Restored ${item.category}: ${item.name}`);
      return res.json({ status: 'success', statusCode: 200, data: item } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async permanentDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const item = await MasterDataService.permanentDelete(id);
      await AuditService.record(req, `master_data.${item.category}.permanent_delete`, `Permanently deleted ${item.category}: ${item.name}`);
      return res.json({ status: 'success', statusCode: 200, data: item } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async emptyTrash(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const category = String(req.query.category || '');
      if (!category) return res.status(400).json({ status: 'error', statusCode: 400, message: 'category query param required' });
      const count = await MasterDataService.emptyTrash(category);
      await AuditService.record(req, `master_data.${category}.empty_trash`, `Emptied trash for ${category}: ${count} item(s)`);
      return res.json({ status: 'success', statusCode: 200, data: { deleted: count } } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async checkExists(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { category, field, value } = req.query;
      if (!category || !field || !value) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'category, field, and value query params required' });
      }
      const exists = await MasterDataService.checkExists(category as string, field as string, value as string);
      return res.json({ status: 'success', statusCode: 200, data: { exists } } as ApiResponse);
    } catch (error) { next(error); }
  }
}
