import { Request, Response, NextFunction } from 'express';
import { InkService } from './ink.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { 
  InkFormulaDto, InkFormulaStatus,
  InkBatchDto, InkBatchStatus 
} from '@shared/dto/ink/ink.dto';
import { emitEvent } from '../realtime/realtime';
import { AuditService } from '../audit/audit.service';

export class InkController {
  // --- Ink Formulas ---
  static async createFormula(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await InkService.createFormula(req.body);
      await AuditService.record(req, 'formula.create', `Created ink formula ${result.code}`);
      const response: ApiResponse<InkFormulaDto> = {
        status: 'success',
        statusCode: 201,
        data: {
          code: result.code,
          productCode: result.productCode,
          color: result.color,
          pantone: result.pantone,
          revision: result.revision,
          status: result.status as InkFormulaStatus,
          viscosity: result.viscosity,
          labTarget: result.labTarget,
          solvent: result.solvent,
          deletedAt: result.deletedAt ? result.deletedAt.toISOString() : null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      emitEvent('dashboard:refresh', { type: 'formula:created', code: result.code });
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listFormulas(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const search = req.query.search as string | undefined;
      const showDeleted = req.query.showDeleted === 'true';
      const formulas = await InkService.listFormulas(search, showDeleted);
      
      const data: InkFormulaDto[] = formulas.map((f: any) => ({
        code: f.code,
        productCode: f.productCode,
        color: f.color,
        pantone: f.pantone,
        revision: f.revision,
        status: f.status as InkFormulaStatus,
        viscosity: f.viscosity,
        labTarget: f.labTarget,
        solvent: f.solvent,
        deletedAt: f.deletedAt ? f.deletedAt.toISOString() : null,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString()
      }));

      const response: ApiResponse<InkFormulaDto[]> = {
        status: 'success',
        statusCode: 200,
        data
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getFormulaByCode(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await InkService.getFormulaByCode(req.params.code as string);
      const response: ApiResponse<InkFormulaDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          code: result.code,
          productCode: result.productCode,
          color: result.color,
          pantone: result.pantone,
          revision: result.revision,
          status: result.status as InkFormulaStatus,
          viscosity: result.viscosity,
          labTarget: result.labTarget,
          solvent: result.solvent,
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

  static async updateFormula(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await InkService.updateFormula(req.params.code as string, req.body);
      await AuditService.record(req, 'formula.update', `Updated ink formula ${result.code}`);
      const response: ApiResponse<InkFormulaDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          code: result.code,
          productCode: result.productCode,
          color: result.color,
          pantone: result.pantone,
          revision: result.revision,
          status: result.status as InkFormulaStatus,
          viscosity: result.viscosity,
          labTarget: result.labTarget,
          solvent: result.solvent,
          deletedAt: result.deletedAt ? result.deletedAt.toISOString() : null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      emitEvent('dashboard:refresh', { type: 'formula:updated', code: result.code });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteFormula(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await InkService.deleteFormula(req.params.code as string);
      await AuditService.record(req, 'formula.delete', `Deleted ink formula ${req.params.code}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Moved to trash'
      };
      emitEvent('dashboard:refresh', { type: 'formula:deleted', code: req.params.code });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async restoreFormula(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await InkService.restoreFormula(req.params.code as string);
      await AuditService.record(req, 'formula.restore', `Restored ink formula ${req.params.code}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Formula restored successfully'
      };
      emitEvent('dashboard:refresh', { type: 'formula:restored', code: req.params.code });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async permanentDeleteFormula(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await InkService.permanentDeleteFormula(req.params.code as string);
      await AuditService.record(req, 'formula.permanent_delete', `Permanently deleted ink formula ${req.params.code}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Formula permanently deleted'
      };
      emitEvent('dashboard:refresh', { type: 'formula:permanentDeleted', code: req.params.code });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async emptyFormulaTrash(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { count } = await InkService.emptyFormulaTrash();
      await AuditService.record(req, 'formula.empty_trash', `Emptied formula trash bin. Purged ${count} formula(s)`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        data: { deleted: count },
        message: 'Formula trash emptied'
      };
      emitEvent('dashboard:refresh', { type: 'formula:trashEmptied' });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // --- Ink Batches ---
  static async createBatch(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await InkService.createBatch(req.body);
      await AuditService.record(req, 'batch.create', `Created ink batch ${result.id}`);
      const response: ApiResponse<InkBatchDto> = {
        status: 'success',
        statusCode: 201,
        data: {
          id: result.id,
          formulaCode: result.formulaCode,
          productCode: result.productCode,
          color: result.color,
          mixDate: result.mixDate ? result.mixDate.toISOString() : null,
          expiryDate: result.expiryDate.toISOString(),
          weight: result.weight,
          remaining: result.remaining,
          operator: result.operator,
          status: result.status as InkBatchStatus,
          deletedAt: result.deletedAt ? result.deletedAt.toISOString() : null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      emitEvent('dashboard:refresh', { type: 'batch:created', id: result.id });
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listBatches(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const search = req.query.search as string | undefined;
      const fefo = req.query.fefo === 'true';
      const showDeleted = req.query.showDeleted === 'true';
      const batches = await InkService.listBatches(search, fefo, showDeleted);
      
      const data: InkBatchDto[] = batches.map((b: any) => ({
        id: b.id,
        formulaCode: b.formulaCode,
        productCode: b.productCode,
        color: b.color,
        mixDate: b.mixDate ? b.mixDate.toISOString() : null,
        expiryDate: b.expiryDate.toISOString(),
        weight: b.weight,
        remaining: b.remaining,
        operator: b.operator,
        status: b.status as InkBatchStatus,
        deletedAt: b.deletedAt ? b.deletedAt.toISOString() : null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString()
      }));

      const response: ApiResponse<InkBatchDto[]> = {
        status: 'success',
        statusCode: 200,
        data
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getBatchById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await InkService.getBatchById(req.params.id as string);
      const response: ApiResponse<InkBatchDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          formulaCode: result.formulaCode,
          productCode: result.productCode,
          color: result.color,
          mixDate: result.mixDate ? result.mixDate.toISOString() : null,
          expiryDate: result.expiryDate.toISOString(),
          weight: result.weight,
          remaining: result.remaining,
          operator: result.operator,
          status: result.status as InkBatchStatus,
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

  static async updateBatch(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await InkService.updateBatch(req.params.id as string, req.body);
      await AuditService.record(req, 'batch.update', `Updated ink batch ${result.id}`);
      const response: ApiResponse<InkBatchDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          formulaCode: result.formulaCode,
          productCode: result.productCode,
          color: result.color,
          mixDate: result.mixDate ? result.mixDate.toISOString() : null,
          expiryDate: result.expiryDate.toISOString(),
          weight: result.weight,
          remaining: result.remaining,
          operator: result.operator,
          status: result.status as InkBatchStatus,
          deletedAt: result.deletedAt ? result.deletedAt.toISOString() : null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      emitEvent('dashboard:refresh', { type: 'batch:updated', id: result.id });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteBatch(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await InkService.deleteBatch(req.params.id as string);
      await AuditService.record(req, 'batch.delete', `Deleted ink batch ${req.params.id}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Moved to trash'
      };
      emitEvent('dashboard:refresh', { type: 'batch:deleted', id: req.params.id });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async restoreBatch(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await InkService.restoreBatch(req.params.id as string);
      await AuditService.record(req, 'batch.restore', `Restored ink batch ${req.params.id}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Batch restored successfully'
      };
      emitEvent('dashboard:refresh', { type: 'batch:restored', id: req.params.id });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async permanentDeleteBatch(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await InkService.permanentDeleteBatch(req.params.id as string);
      await AuditService.record(req, 'batch.permanent_delete', `Permanently deleted ink batch ${req.params.id}`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Batch permanently deleted'
      };
      emitEvent('dashboard:refresh', { type: 'batch:permanentDeleted', id: req.params.id });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async emptyBatchTrash(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { count } = await InkService.emptyBatchTrash();
      await AuditService.record(req, 'batch.empty_trash', `Emptied batch trash bin. Purged ${count} batch(es)`);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        data: { deleted: count },
        message: 'Batch trash emptied'
      };
      emitEvent('dashboard:refresh', { type: 'batch:trashEmptied' });
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
