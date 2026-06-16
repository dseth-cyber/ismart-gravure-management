import { Request, Response, NextFunction } from 'express';
import { JobService } from './job.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { ProductionJobDto, JobVerificationDto } from '@shared/dto/job/job.dto';
import { ProductionLogDto } from '@shared/dto/log/log.dto';
import { AuditService } from '../audit/audit.service';
import { emitEvent, emitToJob } from '../realtime/realtime';

export class JobController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await JobService.create(req.body);
      
      // Record audit log
      await AuditService.record(req, 'production_job.create', `Created Production Job ${result.jobNumber} for product ${result.productCode}`);

      emitEvent('dashboard:refresh', { type: 'job:created', jobNumber: result.jobNumber });

      const response: ApiResponse<ProductionJobDto> = {
        status: 'success',
        statusCode: 201,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          orderNumber: result.orderNumber,
          productCode: result.productCode,
          machineName: result.machineName,
          plannedDate: result.plannedDate.toISOString(),
          status: result.status as any,
          totalPrinted: result.totalPrinted,
          deletedAt: result.deletedAt ? result.deletedAt.toISOString() : null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const showDeleted = req.query.showDeleted === 'true';
      const jobs = await JobService.list(showDeleted);
      const data: ProductionJobDto[] = jobs.map(j => ({
        id: j.id,
        jobNumber: j.jobNumber,
        orderNumber: j.orderNumber,
        productCode: j.productCode,
        machineName: j.machineName,
        plannedDate: j.plannedDate.toISOString(),
        status: j.status as any,
        totalPrinted: j.totalPrinted,
        deletedAt: j.deletedAt ? j.deletedAt.toISOString() : null,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString()
      }));

      const response: ApiResponse<ProductionJobDto[]> = {
        status: 'success',
        statusCode: 200,
        data
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getByJobNumber(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await JobService.getByJobNumber(req.params.jobNumber as string);
      const response: ApiResponse<ProductionJobDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          orderNumber: result.orderNumber,
          productCode: result.productCode,
          machineName: result.machineName,
          plannedDate: result.plannedDate.toISOString(),
          status: result.status as any,
          totalPrinted: result.totalPrinted,
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

  static async delete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await JobService.delete(req.params.jobNumber as string);
      await AuditService.record(req, 'production_job.delete', `Deleted production job ${req.params.jobNumber}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Moved to trash'
      };
      emitEvent('dashboard:refresh', { type: 'job:deleted', jobNumber: req.params.jobNumber });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await JobService.restore(req.params.jobNumber as string);
      await AuditService.record(req, 'production_job.restore', `Restored production job ${result.jobNumber}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Restored'
      };
      emitEvent('dashboard:refresh', { type: 'job:restored', jobNumber: result.jobNumber });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async permanentDelete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await JobService.permanentDelete(req.params.jobNumber as string);
      await AuditService.record(req, 'production_job.permanent_delete', `Permanently deleted production job ${req.params.jobNumber}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Permanently deleted'
      };
      emitEvent('dashboard:refresh', { type: 'job:permanentDeleted', jobNumber: req.params.jobNumber });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async emptyTrash(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { count } = await JobService.emptyTrash();
      await AuditService.record(req, 'production_job.empty_trash', `Emptied production job trash bin. Purged ${count} job(s)`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        data: { deleted: count },
        message: 'Trash emptied successfully'
      };
      emitEvent('dashboard:refresh', { type: 'job:emptyTrash' });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await JobService.updateStatus(req.params.jobNumber as string, req.body);

      // Record audit log
      await AuditService.record(req, 'production_job.update_status', `Updated Production Job ${result.jobNumber} status to ${result.status}`);

      emitEvent('job:status', { jobNumber:         result.jobNumber, status: result.status });
      emitToJob(result.jobNumber, 'job:status', { jobNumber: result.jobNumber, status: result.status });

      const response: ApiResponse<ProductionJobDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          orderNumber: result.orderNumber,
          productCode: result.productCode,
          machineName: result.machineName,
          plannedDate: result.plannedDate.toISOString(),
          status: result.status as any,
          totalPrinted: result.totalPrinted,
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

  static async verify(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await JobService.verify(req.params.jobNumber as string, req.body);

      // Record audit log
      await AuditService.record(
        req, 
        'production_job.verify', 
        `Verified items for Job ${result.jobNumber}. Passed: ${result.isPassed}, Requires Override: ${result.requiresOverride}`
      );

      emitEvent('dashboard:refresh', { type: 'job:verified', jobNumber: result.jobNumber });

      const response: ApiResponse<JobVerificationDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          verifiedBy: result.verifiedBy,
          isPassed: result.isPassed,
          scannedCylinders: result.scannedCylinders ? result.scannedCylinders.split(',') : [],
          scannedInkBatches: result.scannedInkBatches ? result.scannedInkBatches.split(',') : [],
          requiresOverride: result.requiresOverride,
          overrideBy: result.overrideBy,
          createdAt: result.createdAt.toISOString()
        }
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async override(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await JobService.override(req.params.jobNumber as string, req.body);

      // Record audit log
      await AuditService.record(
        req, 
        'production_job.override', 
        `Supervisor override applied for Job ${result.jobNumber} by ${result.overrideBy}`
      );

      emitEvent('dashboard:refresh', { type: 'job:override', jobNumber: result.jobNumber });

      const response: ApiResponse<JobVerificationDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          verifiedBy: result.verifiedBy,
          isPassed: result.isPassed,
          scannedCylinders: result.scannedCylinders ? result.scannedCylinders.split(',') : [],
          scannedInkBatches: result.scannedInkBatches ? result.scannedInkBatches.split(',') : [],
          requiresOverride: result.requiresOverride,
          overrideBy: result.overrideBy,
          createdAt: result.createdAt.toISOString()
        }
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getVerification(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await JobService.getVerification(req.params.jobNumber as string);
      if (!result) {
        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          data: null
        });
      }
      const response: ApiResponse<JobVerificationDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          verifiedBy: result.verifiedBy,
          isPassed: result.isPassed,
          scannedCylinders: result.scannedCylinders ? result.scannedCylinders.split(',') : [],
          scannedInkBatches: result.scannedInkBatches ? result.scannedInkBatches.split(',') : [],
          requiresOverride: result.requiresOverride,
          overrideBy: result.overrideBy,
          createdAt: result.createdAt.toISOString()
        }
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async logProduction(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await JobService.logProduction(req.params.jobNumber as string, req.body);

      // Record audit log
      await AuditService.record(
        req, 
        'production_job.log_run', 
        `Logged run for Job ${result.jobNumber}. Start: ${result.startMeter}, End: ${result.endMeter}, Total: ${result.totalPrinted}, Scrap: ${result.scrapQuantity}`
      );

      emitEvent('dashboard:refresh', { type: 'job:log', jobNumber: result.jobNumber });

      const response: ApiResponse<ProductionLogDto> = {
        status: 'success',
        statusCode: 201,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          machineName: result.machineName,
          operator: result.operator,
          startMeter: result.startMeter,
          endMeter: result.endMeter,
          totalPrinted: result.totalPrinted,
          scrapQuantity: result.scrapQuantity,
          status: result.status,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listLogs(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const poolJob = (req.params.jobNumber as string) || (req.query.jobNumber as string);
      const logs = await JobService.listLogs(poolJob);
      const data: ProductionLogDto[] = logs.map(l => ({
        id: l.id,
        jobNumber: l.jobNumber,
        machineName: l.machineName,
        operator: l.operator,
        startMeter: l.startMeter,
        endMeter: l.endMeter,
        totalPrinted: l.totalPrinted,
        scrapQuantity: l.scrapQuantity,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString()
      }));

      const response: ApiResponse<ProductionLogDto[]> = {
        status: 'success',
        statusCode: 200,
        data
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
