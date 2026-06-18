import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { CreateProductionJobDto, UpdateJobStatusDto, VerifyJobRequestDto, OverrideVerifyRequestDto } from '@shared/dto/job/job.dto';
import { CreateProductionLogDto } from '@shared/dto/log/log.dto';
import { JobStatus } from '@prisma/client';

export class JobService {
  static async create(dto: CreateProductionJobDto) {
    if (!dto.jobNumber || !dto.orderNumber || !dto.productCode || !dto.machineName || !dto.plannedDate) {
      throw new AppError('Missing required production job fields', 400);
    }

    // Check duplicate jobNumber (exclude soft-deleted)
    const existing = await prisma.productionJob.findFirst({
      where: { jobNumber: dto.jobNumber, deletedAt: null }
    });
    if (existing) {
      throw new AppError(`Production job ${dto.jobNumber} already exists`, 400);
    }

    // Validate product exists (exclude soft-deleted)
    const product = await prisma.product.findFirst({
      where: { code: dto.productCode, deletedAt: null }
    });
    if (!product) {
      throw new AppError(`Product with code ${dto.productCode} not found`, 400);
    }

    return prisma.productionJob.create({
      data: {
        jobNumber: dto.jobNumber,
        orderNumber: dto.orderNumber,
        productCode: dto.productCode,
        machineName: dto.machineName,
        plannedDate: new Date(dto.plannedDate),
        status: 'pending'
      }
    });
  }

  static async list(showDeleted = false) {
    return prisma.productionJob.findMany({
      where: { deletedAt: showDeleted ? { not: null } : null },
      orderBy: { plannedDate: 'desc' }
    });
  }

  static async getByJobNumber(jobNumber: string) {
    const job = await prisma.productionJob.findUnique({
      where: { jobNumber }
    });
    if (!job) {
      throw new AppError(`Production job ${jobNumber} not found`, 404);
    }
    return job;
  }

  static async updateStatus(jobNumber: string, dto: UpdateJobStatusDto) {
    const job = await this.getByJobNumber(jobNumber);
    return prisma.productionJob.update({
      where: { id: job.id },
      data: { status: dto.status as JobStatus }
    });
  }

  static async verify(jobNumber: string, dto: VerifyJobRequestDto) {
    const job = await this.getByJobNumber(jobNumber);

    if (!dto.verifiedBy || !dto.scannedCylinderIds || !dto.scannedInkBatchIds) {
      throw new AppError('Missing verification scanner payload parameters', 400);
    }

    const cylinders = await prisma.cylinder.findMany({
      where: { id: { in: dto.scannedCylinderIds } }
    });

    if (cylinders.length !== dto.scannedCylinderIds.length) {
      throw new AppError('One or more scanned Cylinder IDs do not exist in the database', 400);
    }

    for (const cyl of cylinders) {
      if (cyl.productCode !== job.productCode) {
        throw new AppError(`Cylinder ${cyl.id} is registered for product ${cyl.productCode}, but Job requires product ${job.productCode}`, 400);
      }
    }

    const inkBatches = await prisma.inkBatch.findMany({
      where: { id: { in: dto.scannedInkBatchIds } }
    });

    if (inkBatches.length !== dto.scannedInkBatchIds.length) {
      throw new AppError('One or more scanned Ink Batch IDs do not exist in the database', 400);
    }

    let requiresOverride = false;
    for (const batch of inkBatches) {
      const now = new Date();
      if (batch.expiryDate < now) {
        throw new AppError(`Ink Batch ${batch.id} has EXPIRED on ${batch.expiryDate.toISOString().split('T')[0]} and cannot be used`, 400);
      }

      if (batch.status === 'nearExpiry') {
        requiresOverride = true;
      }
    }

    const isPassed = !requiresOverride;

    const result = await prisma.jobVerification.upsert({
      where: { jobNumber },
      update: {
        verifiedBy: dto.verifiedBy,
        isPassed,
        scannedCylinders: dto.scannedCylinderIds.join(','),
        scannedInkBatches: dto.scannedInkBatchIds.join(','),
        requiresOverride,
        overrideBy: isPassed ? null : undefined
      },
      create: {
        jobNumber,
        verifiedBy: dto.verifiedBy,
        isPassed,
        scannedCylinders: dto.scannedCylinderIds.join(','),
        scannedInkBatches: dto.scannedInkBatchIds.join(','),
        requiresOverride,
        overrideBy: null
      }
    });

    await prisma.productionJob.update({
      where: { id: job.id },
      data: { status: 'verifying' }
    });

    return result;
  }

  static async override(jobNumber: string, dto: OverrideVerifyRequestDto) {
    await this.getByJobNumber(jobNumber);

    const verification = await prisma.jobVerification.findUnique({
      where: { jobNumber }
    });
    if (!verification) {
      throw new AppError(`No verification records found for Job ${jobNumber}`, 404);
    }

    if (!verification.requiresOverride) {
      throw new AppError('This verification does not require a supervisor override', 400);
    }

    return prisma.jobVerification.update({
      where: { jobNumber },
      data: {
        isPassed: true,
        overrideBy: dto.overrideBy
      }
    });
  }

  static async logProduction(jobNumber: string, dto: CreateProductionLogDto) {
    const job = await this.getByJobNumber(jobNumber);

    if (dto.startMeter === undefined || dto.endMeter === undefined || dto.scrapQuantity === undefined || !dto.machineName || !dto.operator) {
      throw new AppError('Missing production log properties', 400);
    }

    const totalPrinted = dto.endMeter - dto.startMeter;

    const log = await prisma.productionLog.create({
      data: {
        jobNumber,
        machineName: dto.machineName,
        operator: dto.operator,
        startMeter: dto.startMeter,
        endMeter: dto.endMeter,
        totalPrinted,
        scrapQuantity: dto.scrapQuantity,
        status: 'completed'
      }
    });

    const verification = await prisma.jobVerification.findUnique({
      where: { jobNumber }
    });

    if (verification) {
      const cylinderIds = verification.scannedCylinders.split(',').filter(Boolean);
      if (cylinderIds.length > 0) {
        await prisma.cylinder.updateMany({
          where: { id: { in: cylinderIds } },
          data: {
            meter: { increment: totalPrinted },
            lastUsed: new Date(),
            status: 'available'
          }
        });
      }

      const inkBatchIds = verification.scannedInkBatches.split(',').filter(Boolean);
      for (const batchId of inkBatchIds) {
        const batch = await prisma.inkBatch.findUnique({ where: { id: batchId } });
        if (batch) {
          const usage = Math.min(batch.remaining, 2.5);
          await prisma.inkBatch.update({
            where: { id: batchId },
            data: {
              remaining: { decrement: usage }
            }
          });
        }
      }
    }

    await prisma.productionJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        totalPrinted
      }
    });

    return log;
  }

  static async delete(jobNumber: string) {
    await this.getByJobNumber(jobNumber);
    return prisma.productionJob.update({
      where: { jobNumber },
      data: { deletedAt: new Date() }
    });
  }

  static async restore(jobNumber: string) {
    await this.getByJobNumber(jobNumber);
    return prisma.productionJob.update({
      where: { jobNumber },
      data: { deletedAt: null }
    });
  }

  static async permanentDelete(jobNumber: string) {
    await this.getByJobNumber(jobNumber);
    return prisma.productionJob.delete({
      where: { jobNumber }
    });
  }

  static async emptyTrash() {
    return prisma.productionJob.deleteMany({
      where: { deletedAt: { not: null } }
    });
  }

  static async batchUpdateStatus(jobNumbers: string[], status: JobStatus) {
    return prisma.productionJob.updateMany({
      where: { jobNumber: { in: jobNumbers }, deletedAt: null },
      data: { status }
    });
  }

  static async batchDelete(jobNumbers: string[]) {
    return prisma.productionJob.updateMany({
      where: { jobNumber: { in: jobNumbers }, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  static async batchRestore(jobNumbers: string[]) {
    return prisma.productionJob.updateMany({
      where: { jobNumber: { in: jobNumbers }, deletedAt: { not: null } },
      data: { deletedAt: null }
    });
  }

  static async listLogs(jobNumber?: string) {
    return prisma.productionLog.findMany({
      where: jobNumber ? { jobNumber } : undefined,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getVerification(jobNumber: string) {
    return prisma.jobVerification.findUnique({
      where: { jobNumber }
    });
  }
}
