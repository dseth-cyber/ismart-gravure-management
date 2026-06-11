"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("./product.service");
class ProductController {
    static async create(req, res, next) {
        try {
            const result = await product_service_1.ProductService.create(req.body);
            const response = {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async list(req, res, next) {
        try {
            const search = req.query.search;
            const products = await product_service_1.ProductService.list(search);
            const data = products.map(p => ({
                id: p.id,
                code: p.code,
                name: p.name,
                customerCode: p.customerCode,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString()
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
            const result = await product_service_1.ProductService.getById(req.params.id);
            const response = {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const result = await product_service_1.ProductService.update(req.params.id, req.body);
            const response = {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            await product_service_1.ProductService.delete(req.params.id);
            const response = {
                status: 'success',
                statusCode: 200,
                message: 'Product deleted successfully'
            };
            return res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
