"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customer_service_1 = require("./customer.service");
class CustomerController {
    static async create(req, res, next) {
        try {
            const result = await customer_service_1.CustomerService.create(req.body);
            const response = {
                status: 'success',
                statusCode: 201,
                data: {
                    id: result.id,
                    code: result.code,
                    name: result.name,
                    contactInfo: result.contactInfo,
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
            const search = req.query.search;
            const customers = await customer_service_1.CustomerService.list(search);
            const data = customers.map(c => ({
                id: c.id,
                code: c.code,
                name: c.name,
                contactInfo: c.contactInfo,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString()
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
            const result = await customer_service_1.CustomerService.getById(req.params.id);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    code: result.code,
                    name: result.name,
                    contactInfo: result.contactInfo,
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
    static async update(req, res, next) {
        try {
            const result = await customer_service_1.CustomerService.update(req.params.id, req.body);
            const response = {
                status: 'success',
                statusCode: 200,
                data: {
                    id: result.id,
                    code: result.code,
                    name: result.name,
                    contactInfo: result.contactInfo,
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
            await customer_service_1.CustomerService.delete(req.params.id);
            const response = {
                status: 'success',
                statusCode: 200,
                message: 'Customer deleted successfully'
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
