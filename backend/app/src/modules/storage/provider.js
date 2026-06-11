"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageProvider = exports.MinioProvider = void 0;
exports.createStorageProvider = createStorageProvider;
const env_1 = require("../../config/env");
class MinioProvider {
    client = null;
    _bucketReady = false;
    async getClient() {
        if (this.client)
            return this.client;
        const Minio = await Promise.resolve().then(() => __importStar(require('minio')));
        this.client = new Minio.Client({
            endPoint: env_1.env.MINIO_ENDPOINT,
            port: env_1.env.MINIO_PORT,
            useSSL: env_1.env.MINIO_USE_SSL,
            accessKey: env_1.env.MINIO_ACCESS_KEY,
            secretKey: env_1.env.MINIO_SECRET_KEY,
        });
        return this.client;
    }
    async ensureBucket() {
        if (this._bucketReady)
            return;
        const client = await this.getClient();
        const exists = await client.bucketExists(env_1.env.MINIO_BUCKET);
        if (!exists) {
            await client.makeBucket(env_1.env.MINIO_BUCKET);
        }
        this._bucketReady = true;
    }
    async upload(buffer, path, mimeType) {
        await this.ensureBucket();
        const client = await this.getClient();
        await client.putObject(env_1.env.MINIO_BUCKET, path, buffer, buffer.length, { 'Content-Type': mimeType });
        const url = await this.getSignedUrl(path);
        return { storagePath: path, url };
    }
    async download(path, bucket) {
        const client = await this.getClient();
        return new Promise((resolve, reject) => {
            const chunks = [];
            client.getObject(bucket || env_1.env.MINIO_BUCKET, path, (err, stream) => {
                if (err)
                    return reject(err);
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        });
    }
    async delete(path, bucket) {
        const client = await this.getClient();
        await client.removeObject(bucket || env_1.env.MINIO_BUCKET, path);
    }
    async getSignedUrl(path, expiresIn = 3600) {
        const client = await this.getClient();
        return client.presignedGetObject(env_1.env.MINIO_BUCKET, path, expiresIn);
    }
}
exports.MinioProvider = MinioProvider;
class LocalStorageProvider {
    basePath;
    constructor(basePath = './uploads') {
        this.basePath = basePath;
    }
    ensureDir(dir) {
        const fs = require('fs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    getFullPath(storagePath) {
        return require('path').join(this.basePath, storagePath);
    }
    async upload(buffer, path, mimeType) {
        const fs = require('fs');
        const fullPath = this.getFullPath(path);
        this.ensureDir(require('path').dirname(fullPath));
        fs.writeFileSync(fullPath, buffer);
        return { storagePath: path, url: `/api/v1/storage/files/${path}` };
    }
    async download(path) {
        const fs = require('fs');
        return fs.readFileSync(this.getFullPath(path));
    }
    async delete(path) {
        const fs = require('fs');
        const fullPath = this.getFullPath(path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
    async getSignedUrl(path, expiresIn = 3600) {
        return `/api/v1/storage/files/${path}`;
    }
}
exports.LocalStorageProvider = LocalStorageProvider;
function createStorageProvider() {
    if (env_1.env.STORAGE_PROVIDER === 'local') {
        return new LocalStorageProvider();
    }
    return new MinioProvider();
}
