import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';
import { SalesOrderDto } from '@shared/dto/order/order.dto';
import { AuditService } from '../audit/audit.service';

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await OrderService.create(req.body);
      
      // Record audit log
      await AuditService.record(req, 'sales_order.create', `Created Sales Order ${result.orderNumber} for product ${result.productCode}`);

      const response: ApiResponse<SalesOrderDto> = {
        status: 'success',
        statusCode: 201,
        data: {
          id: result.id,
          orderNumber: result.orderNumber,
          customerCode: result.customerCode,
          productCode: result.productCode,
          quantity: result.quantity,
          unit: result.unit,
          dueDate: result.dueDate.toISOString(),
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

  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const orders = await OrderService.list();
      const data: SalesOrderDto[] = orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerCode: o.customerCode,
        productCode: o.productCode,
        quantity: o.quantity,
        unit: o.unit,
        dueDate: o.dueDate.toISOString(),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString()
      }));

      const response: ApiResponse<SalesOrderDto[]> = {
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
      const result = await OrderService.getById(req.params.id as string);
      const response: ApiResponse<SalesOrderDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          orderNumber: result.orderNumber,
          customerCode: result.customerCode,
          productCode: result.productCode,
          quantity: result.quantity,
          unit: result.unit,
          dueDate: result.dueDate.toISOString(),
          status: result.status,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await OrderService.updateStatus(req.params.id as string, req.body);

      // Record audit log
      await AuditService.record(req, 'sales_order.update_status', `Updated Sales Order ${result.orderNumber} status to ${result.status}`);

      const response: ApiResponse<SalesOrderDto> = {
        status: 'success',
        statusCode: 200,
        data: {
          id: result.id,
          orderNumber: result.orderNumber,
          customerCode: result.customerCode,
          productCode: result.productCode,
          quantity: result.quantity,
          unit: result.unit,
          dueDate: result.dueDate.toISOString(),
          status: result.status,
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
      const result = await OrderService.delete(req.params.id as string);

      // Record audit log
      await AuditService.record(req, 'sales_order.delete', `Deleted Sales Order ${result.orderNumber}`);

      const response: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Sales order deleted successfully'
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
