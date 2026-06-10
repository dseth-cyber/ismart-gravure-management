import { Request, Response, NextFunction } from 'express';
import { CylinderService } from './cylinder.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { CylinderDto, CylinderStatus } from '@shared/dto/cylinder/cylinder.dto';

export class CylinderController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await CylinderService.create(req.body);
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
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const cylinders = await CylinderService.list(search, status);
      
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
      await CylinderService.delete(req.params.id as string);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Cylinder deleted successfully'
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
