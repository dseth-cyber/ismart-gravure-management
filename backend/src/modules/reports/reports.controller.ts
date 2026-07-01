import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ReportsService } from './reports.service';

export const ReportsController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reports = await ReportsService.list();
      res.json({ success: true, data: reports });
    } catch (err) { next(err); }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await ReportsService.getById(req.params.id as string);
      res.json({ success: true, data: report });
    } catch (err) { next(err); }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await ReportsService.create({
        ...req.body,
        createdBy: req.user?.username,
      });
      res.status(201).json({ success: true, data: report });
    } catch (err) { next(err); }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await ReportsService.update(req.params.id as string, req.body);
      res.json({ success: true, data: report });
    } catch (err) { next(err); }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await ReportsService.delete(req.params.id as string);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async runNow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await ReportsService.runNow(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
