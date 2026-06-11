import { env } from '../../config/env';

export interface FileUploadResult {
  storagePath: string;
  url?: string;
  thumbnailPath?: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, path: string, mimeType: string): Promise<FileUploadResult>;
  download(path: string, bucket?: string): Promise<Buffer>;
  delete(path: string, bucket?: string): Promise<void>;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
}

export class MinioProvider implements StorageProvider {
  private client: any = null;
  private _bucketReady = false;

  private async getClient() {
    if (this.client) return this.client;
    const Minio = await import('minio');
    this.client = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
    return this.client;
  }

  private async ensureBucket() {
    if (this._bucketReady) return;
    const client = await this.getClient();
    const exists = await client.bucketExists(env.MINIO_BUCKET);
    if (!exists) {
      await client.makeBucket(env.MINIO_BUCKET);
    }
    this._bucketReady = true;
  }

  async upload(buffer: Buffer, path: string, mimeType: string): Promise<FileUploadResult> {
    await this.ensureBucket();
    const client = await this.getClient();
    await client.putObject(env.MINIO_BUCKET, path, buffer, buffer.length, { 'Content-Type': mimeType });
    const url = await this.getSignedUrl(path);
    return { storagePath: path, url };
  }

  async download(path: string, bucket?: string): Promise<Buffer> {
    const client = await this.getClient();
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      client.getObject(bucket || env.MINIO_BUCKET, path, (err: any, stream: any) => {
        if (err) return reject(err);
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    });
  }

  async delete(path: string, bucket?: string): Promise<void> {
    const client = await this.getClient();
    await client.removeObject(bucket || env.MINIO_BUCKET, path);
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const client = await this.getClient();
    return client.presignedGetObject(env.MINIO_BUCKET, path, expiresIn);
  }
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor(basePath = './uploads') {
    this.basePath = basePath;
  }

  private ensureDir(dir: string) {
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getFullPath(storagePath: string): string {
    return require('path').join(this.basePath, storagePath);
  }

  async upload(buffer: Buffer, path: string, mimeType: string): Promise<FileUploadResult> {
    const fs = require('fs');
    const fullPath = this.getFullPath(path);
    this.ensureDir(require('path').dirname(fullPath));
    fs.writeFileSync(fullPath, buffer);
    return { storagePath: path, url: `/api/v1/storage/files/${path}` };
  }

  async download(path: string): Promise<Buffer> {
    const fs = require('fs');
    return fs.readFileSync(this.getFullPath(path));
  }

  async delete(path: string): Promise<void> {
    const fs = require('fs');
    const fullPath = this.getFullPath(path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    return `/api/v1/storage/files/${path}`;
  }
}

export function createStorageProvider(): StorageProvider {
  if (env.STORAGE_PROVIDER === 'local') {
    return new LocalStorageProvider();
  }
  return new MinioProvider();
}
