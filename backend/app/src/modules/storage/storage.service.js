"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const database_1 = require("../../config/database");
const provider_1 = require("./provider");
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const provider = (0, provider_1.createStorageProvider)();
class StorageService {
    static async uploadFile(buffer, originalName, mimeType, options) {
        const ext = path_1.default.extname(originalName) || '';
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const storagePath = `${options?.entityType || 'general'}/${id}${ext}`;
        // Upload original
        const result = await provider.upload(buffer, storagePath, mimeType);
        // Generate thumbnail for images
        let thumbnailPath = null;
        if (options?.generateThumbnail !== false && mimeType.startsWith('image/') && !mimeType.includes('svg')) {
            try {
                const thumbBuffer = await (0, sharp_1.default)(buffer).resize(200, 200, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer();
                const thumbStoragePath = `thumbnails/${id}.jpg`;
                await provider.upload(thumbBuffer, thumbStoragePath, 'image/jpeg');
                thumbnailPath = thumbStoragePath;
            }
            catch { }
        }
        // Save metadata
        const file = await database_1.prisma.fileMetadata.create({
            data: {
                originalName,
                storagePath,
                mimeType,
                size: buffer.length,
                thumbnailPath,
                uploadedBy: options?.userId || null,
                entityType: options?.entityType || null,
                entityId: options?.entityId || null,
            },
        });
        return {
            ...file,
            url: result.url,
        };
    }
    static async downloadFile(id) {
        const file = await database_1.prisma.fileMetadata.findUnique({ where: { id } });
        if (!file)
            return null;
        const buffer = await provider.download(file.storagePath, file.bucket);
        return { buffer, mimeType: file.mimeType, originalName: file.originalName };
    }
    static async deleteFile(id) {
        const file = await database_1.prisma.fileMetadata.findUnique({ where: { id } });
        if (!file)
            return false;
        try {
            await provider.delete(file.storagePath, file.bucket);
            if (file.thumbnailPath) {
                await provider.delete(file.thumbnailPath, file.bucket).catch(() => { });
            }
        }
        catch { }
        await database_1.prisma.fileMetadata.delete({ where: { id } });
        return true;
    }
    static async listFiles(options) {
        const where = {};
        if (options.entityType)
            where.entityType = options.entityType;
        if (options.entityId)
            where.entityId = options.entityId;
        const [files, total] = await Promise.all([
            database_1.prisma.fileMetadata.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: options.limit || 50,
                skip: options.offset || 0,
            }),
            database_1.prisma.fileMetadata.count({ where }),
        ]);
        return { files, total };
    }
    static async getSignedUrl(id, expiresIn = 3600) {
        const file = await database_1.prisma.fileMetadata.findUnique({ where: { id } });
        if (!file)
            return null;
        return provider.getSignedUrl(file.storagePath, expiresIn);
    }
}
exports.StorageService = StorageService;
