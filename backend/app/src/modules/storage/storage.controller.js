"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageController = void 0;
const storage_service_1 = require("./storage.service");
class StorageController {
    static async upload(req, res, next) {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'No file uploaded' });
            }
            const result = await storage_service_1.StorageService.uploadFile(file.buffer, file.originalname, file.mimetype, {
                userId: req.user?.userId,
                entityType: String(req.body.entityType || ''),
                entityId: String(req.body.entityId || ''),
            });
            return res.status(201).json({ status: 'success', statusCode: 201, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async download(req, res, next) {
        try {
            const result = await storage_service_1.StorageService.downloadFile(String(req.params.id));
            if (!result) {
                return res.status(404).json({ status: 'error', statusCode: 404, message: 'File not found' });
            }
            res.setHeader('Content-Type', result.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${result.originalName}"`);
            return res.send(result.buffer);
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const deleted = await storage_service_1.StorageService.deleteFile(String(req.params.id));
            if (!deleted) {
                return res.status(404).json({ status: 'error', statusCode: 404, message: 'File not found' });
            }
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'File deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    static async list(req, res, next) {
        try {
            const { files, total } = await storage_service_1.StorageService.listFiles({
                entityType: String(req.query.entityType || ''),
                entityId: String(req.query.entityId || ''),
                limit: parseInt(String(req.query.limit || '50'), 10),
                offset: parseInt(String(req.query.offset || '0'), 10),
            });
            return res.status(200).json({ status: 'success', statusCode: 200, data: { files, total } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getSignedUrl(req, res, next) {
        try {
            const url = await storage_service_1.StorageService.getSignedUrl(String(req.params.id), parseInt(String(req.query.expires || '3600'), 10));
            if (!url) {
                return res.status(404).json({ status: 'error', statusCode: 404, message: 'File not found' });
            }
            return res.status(200).json({ status: 'success', statusCode: 200, data: { url } });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StorageController = StorageController;
