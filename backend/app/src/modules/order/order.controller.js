"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = require("./order.service");
const audit_service_1 = require("../audit/audit.service");
class OrderController {
    static async create(req, res, next) {
        try {
            const result = await order_service_1.OrderService.create(req.body);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'sales_order.create', `Created Sales Order ${result.orderNumber} for product ${result.productCode}`);
            const response = {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async list(req, res, next) {
        try {
            const orders = await order_service_1.OrderService.list();
            const data = orders.map(o => ({
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
            const response = {
                status: 'success',
                statusCode: 200,
                data
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const result = await order_service_1.OrderService.getById(req.params.id);
            const response = {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const result = await order_service_1.OrderService.updateStatus(req.params.id, req.body);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'sales_order.update_status', `Updated Sales Order ${result.orderNumber} status to ${result.status}`);
            const response = {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const result = await order_service_1.OrderService.delete(req.params.id);
            // Record audit log
            await audit_service_1.AuditService.record(req, 'sales_order.delete', `Deleted Sales Order ${result.orderNumber}`);
            const response = {
                status: 'success',
                statusCode: 200,
                message: 'Sales order deleted successfully'
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OrderController = OrderController;
