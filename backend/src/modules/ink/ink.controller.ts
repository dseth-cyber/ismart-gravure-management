import { Request, Response, NextFunction } from 'express';
import { InkService } from './ink.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { 
  InkFormulaDto, InkFormulaStatus,
  InkBatchDto, InkBatchStatus 
} from '@shared/dto/ink/ink.dto';

export class InkController {
  // --- Ink Formulas ---
  static async createFormula(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await InkService.createFormula(req.body);
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
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listFormulas(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const search = req.query.search as string | undefined;
      const formulas = await InkService.listFormulas(search);
      
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
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteFormula(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await InkService.deleteFormula(req.params.code as string);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Formula deleted successfully'
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // --- Ink Batches ---
  static async createBatch(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await InkService.createBatch(req.body);
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
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listBatches(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const search = req.query.search as string | undefined;
      const fefo = req.query.fefo === 'true';
      const batches = await InkService.listBatches(search, fefo);
      
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
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteBatch(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await InkService.deleteBatch(req.params.id as string);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Batch deleted successfully'
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
