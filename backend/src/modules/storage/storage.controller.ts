import { Request, Response, NextFunction } from 'express';
import { StorageService } from './storage.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { env } from '../../config/env';

export class StorageController {
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'No file uploaded' } as ApiResponse);
      }
      const result = await StorageService.uploadFile(file.buffer, file.originalname, file.mimetype, {
        userId: req.user?.userId,
        entityType: String(req.body.entityType || ''),
        entityId: String(req.body.entityId || ''),
      });
      return res.status(201).json({ status: 'success', statusCode: 201, data: result } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async download(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await StorageService.downloadFile(String(req.params.id));
      if (!result) {
        return res.status(404).json({ status: 'error', statusCode: 404, message: 'File not found' } as ApiResponse);
      }
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${result.originalName}"`);
      return res.send(result.buffer);
    } catch (error) { next(error); }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const deleted = await StorageService.deleteFile(String(req.params.id));
      if (!deleted) {
        return res.status(404).json({ status: 'error', statusCode: 404, message: 'File not found' } as ApiResponse);
      }
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'File deleted' } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { files, total } = await StorageService.listFiles({
        entityType: String(req.query.entityType || ''),
        entityId: String(req.query.entityId || ''),
        limit: parseInt(String(req.query.limit || '50'), 10),
        offset: parseInt(String(req.query.offset || '0'), 10),
      });
      return res.status(200).json({ status: 'success', statusCode: 200, data: { files, total } } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getSignedUrl(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const url = await StorageService.getSignedUrl(String(req.params.id), parseInt(String(req.query.expires || '3600'), 10));
      if (!url) {
        return res.status(404).json({ status: 'error', statusCode: 404, message: 'File not found' } as ApiResponse);
      }
      return res.status(200).json({ status: 'success', statusCode: 200, data: { url } } as ApiResponse);
    } catch (error) { next(error); }
  }
}
