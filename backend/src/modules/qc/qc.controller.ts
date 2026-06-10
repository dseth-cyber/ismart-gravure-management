import { Request, Response, NextFunction } from 'express';
import { QcService } from './qc.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { QcInspectionDto } from '@shared/dto/qc/qc.dto';
import { AuditService } from '../audit/audit.service';

export class QcController {
  static async createInspection(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await QcService.createInspection(req.params.jobNumber as string, req.body);
      
      // Record audit log
      await AuditService.record(req, 'qc_inspection.create', `Recorded QC inspection for Job ${result.jobNumber}. Result: ${result.status}`);

      const response: ApiResponse<QcInspectionDto> = {
        status: 'success',
        statusCode: 201,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          inspector: result.inspector,
          shadeResult: result.shadeResult,
          barcodePassed: result.barcodePassed,
          colorSequencePassed: result.colorSequencePassed,
          adhesionPassed: result.adhesionPassed,
          status: result.status as any,
          remarks: result.remarks,
          createdAt: result.createdAt.toISOString()
        }
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listInspections(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const inspections = await QcService.listInspections();
      const data: QcInspectionDto[] = inspections.map(i => ({
        id: i.id,
        jobNumber: i.jobNumber,
        inspector: i.inspector,
        shadeResult: i.shadeResult,
        barcodePassed: i.barcodePassed,
        colorSequencePassed: i.colorSequencePassed,
        adhesionPassed: i.adhesionPassed,
        status: i.status as any,
        remarks: i.remarks,
        createdAt: i.createdAt.toISOString()
      }));

      const response: ApiResponse<QcInspectionDto[]> = {
        status: 'success',
        statusCode: 200,
        data
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getInspectionById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await QcService.getInspectionById(req.params.id as string);
      const response: ApiResponse<QcInspectionDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          jobNumber: result.jobNumber,
          inspector: result.inspector,
          shadeResult: result.shadeResult,
          barcodePassed: result.barcodePassed,
          colorSequencePassed: result.colorSequencePassed,
          adhesionPassed: result.adhesionPassed,
          status: result.status as any,
          remarks: result.remarks,
          createdAt: result.createdAt.toISOString()
        }
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listInspectionsByJobNumber(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const inspections = await QcService.listInspectionsByJobNumber(req.params.jobNumber as string);
      const data: QcInspectionDto[] = inspections.map(i => ({
        id: i.id,
        jobNumber: i.jobNumber,
        inspector: i.inspector,
        shadeResult: i.shadeResult,
        barcodePassed: i.barcodePassed,
        colorSequencePassed: i.colorSequencePassed,
        adhesionPassed: i.adhesionPassed,
        status: i.status as any,
        remarks: i.remarks,
        createdAt: i.createdAt.toISOString()
      }));

      const response: ApiResponse<QcInspectionDto[]> = {
        status: 'success',
        statusCode: 200,
        data
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteInspection(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await QcService.deleteInspection(req.params.id as string);

      // Record audit log
      await AuditService.record(req, 'qc_inspection.delete', `Deleted QC inspection ID ${result.id} for Job ${result.jobNumber}`);

      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'QC inspection deleted successfully'
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getTraceability(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const dimension = req.query.dimension as string;
      const queryVal = req.query.query as string;
      const result = await QcService.getTraceability(dimension, queryVal);
      const response: ApiResponse<any> = {
        status: 'success',
        statusCode: 200,
        data: result
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
