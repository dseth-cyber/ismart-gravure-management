import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { ProductDto } from '@shared/dto/product/product.dto';

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await ProductService.create(req.body);
      const response: ApiResponse<ProductDto> = {
        status: 'success',
        statusCode: 201,
        data: {
          id: result.id,
          code: result.code,
          name: result.name,
          customerCode: result.customerCode,
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
      const search = req.query.search as string;
      const products = await ProductService.list(search);
      
      const data: ProductDto[] = products.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        customerCode: p.customerCode,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }));

      const response: ApiResponse<ProductDto[]> = {
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
      const result = await ProductService.getById(req.params.id as string);
      const response: ApiResponse<ProductDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          code: result.code,
          name: result.name,
          customerCode: result.customerCode,
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
      const result = await ProductService.update(req.params.id as string, req.body);
      const response: ApiResponse<ProductDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          code: result.code,
          name: result.name,
          customerCode: result.customerCode,
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
      await ProductService.delete(req.params.id as string);
      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Product deleted successfully'
      };
      return res.status(200).json(response);
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
      const exists = await ProductService.checkExists(field, value);
      return res.status(200).json({ status: 'success', statusCode: 200, data: { exists } });
    } catch (error) {
      next(error);
    }
  }
}
