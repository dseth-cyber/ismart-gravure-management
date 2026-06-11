import { prisma } from '../../config/database';
import { createStorageProvider, StorageProvider } from './provider';
import sharp from 'sharp';
import path from 'path';

const provider: StorageProvider = createStorageProvider();

export class StorageService {
  static async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options?: { entityType?: string; entityId?: string; userId?: string; generateThumbnail?: boolean }
  ): Promise<any> {
    const ext = path.extname(originalName) || '';
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `${options?.entityType || 'general'}/${id}${ext}`;

    // Upload original
    const result = await provider.upload(buffer, storagePath, mimeType);

    // Generate thumbnail for images
    let thumbnailPath: string | null = null;
    if (options?.generateThumbnail !== false && mimeType.startsWith('image/') && !mimeType.includes('svg')) {
      try {
        const thumbBuffer = await sharp(buffer).resize(200, 200, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer();
        const thumbStoragePath = `thumbnails/${id}.jpg`;
        await provider.upload(thumbBuffer, thumbStoragePath, 'image/jpeg');
        thumbnailPath = thumbStoragePath;
      } catch {}
    }

    // Save metadata
    const file = await prisma.fileMetadata.create({
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

  static async downloadFile(id: string): Promise<{ buffer: Buffer; mimeType: string; originalName: string } | null> {
    const file = await prisma.fileMetadata.findUnique({ where: { id } });
    if (!file) return null;
    const buffer = await provider.download(file.storagePath, file.bucket);
    return { buffer, mimeType: file.mimeType, originalName: file.originalName };
  }

  static async deleteFile(id: string): Promise<boolean> {
    const file = await prisma.fileMetadata.findUnique({ where: { id } });
    if (!file) return false;

    try {
      await provider.delete(file.storagePath, file.bucket);
      if (file.thumbnailPath) {
        await provider.delete(file.thumbnailPath, file.bucket).catch(() => {});
      }
    } catch {}

    await prisma.fileMetadata.delete({ where: { id } });
    return true;
  }

  static async listFiles(options: { entityType?: string; entityId?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (options.entityType) where.entityType = options.entityType;
    if (options.entityId) where.entityId = options.entityId;

    const [files, total] = await Promise.all([
      prisma.fileMetadata.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.fileMetadata.count({ where }),
    ]);
    return { files, total };
  }

  static async getSignedUrl(id: string, expiresIn = 3600): Promise<string | null> {
    const file = await prisma.fileMetadata.findUnique({ where: { id } });
    if (!file) return null;
    return provider.getSignedUrl(file.storagePath, expiresIn);
  }
}
