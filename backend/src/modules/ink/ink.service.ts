import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { 
  CreateInkFormulaDto, UpdateInkFormulaDto, InkFormulaStatus,
  CreateInkBatchDto, UpdateInkBatchDto, InkBatchStatus 
} from '@shared/dto/ink/ink.dto';

export class InkService {
  // --- Ink Formulas ---
  static async createFormula(dto: CreateInkFormulaDto) {
    if (!dto.code || !dto.productCode || !dto.color || !dto.pantone || !dto.viscosity || !dto.labTarget || !dto.solvent) {
      throw new AppError('Formula code, productCode, color, pantone, viscosity, labTarget, and solvent are required', 400);
    }

    // 1. Check duplicate code (exclude soft-deleted)
    const existing = await prisma.inkFormula.findFirst({
      where: { code: dto.code, deletedAt: null }
    });
    if (existing) {
      throw new AppError(`Formula with code ${dto.code} already exists`, 400);
    }

    // 2. Validate productCode exists (exclude soft-deleted)
    const product = await prisma.product.findFirst({
      where: { code: dto.productCode, deletedAt: null }
    });
    if (!product) {
      console.warn(`Product with code ${dto.productCode} does not exist — creating formula without product reference`);
    }

    return prisma.inkFormula.create({
      data: {
        code: dto.code,
        productCode: dto.productCode,
        color: dto.color,
        pantone: dto.pantone,
        viscosity: dto.viscosity,
        labTarget: dto.labTarget,
        solvent: dto.solvent,
        status: 'active'
      }
    });
  }

  static async listFormulas(search?: string, showDeleted = false) {
    const filters: any = {};
    filters.deletedAt = showDeleted ? { not: null } : null;
    if (search) {
      filters.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } }
      ];
    }
    return prisma.inkFormula.findMany({
      where: filters,
      orderBy: { code: 'asc' }
    });
  }

  static async getFormulaByCode(code: string) {
    const formula = await prisma.inkFormula.findUnique({
      where: { code }
    });
    if (!formula) {
      throw new AppError('Ink formula not found', 404);
    }
    return formula;
  }

  static async updateFormula(code: string, dto: UpdateInkFormulaDto) {
    await this.getFormulaByCode(code);

    return prisma.inkFormula.update({
      where: { code },
      data: {
        pantone: dto.pantone,
        status: dto.status,
        viscosity: dto.viscosity,
        labTarget: dto.labTarget,
        solvent: dto.solvent
      }
    });
  }

  static async deleteFormula(code: string) {
    await this.getFormulaByCode(code);
    return prisma.inkFormula.update({
      where: { code },
      data: { deletedAt: new Date() }
    });
  }

  static async restoreFormula(code: string) {
    await this.getFormulaByCode(code);
    return prisma.inkFormula.update({
      where: { code },
      data: { deletedAt: null }
    });
  }

  static async permanentDeleteFormula(code: string) {
    await this.getFormulaByCode(code);
    return prisma.inkFormula.delete({
      where: { code }
    });
  }

  static async emptyFormulaTrash() {
    return prisma.inkFormula.deleteMany({
      where: { deletedAt: { not: null } }
    });
  }

  // --- Ink Batches ---
  static async createBatch(dto: CreateInkBatchDto) {
    if (!dto.id || !dto.color || !dto.expiryDate || dto.weight === undefined || !dto.operator) {
      throw new AppError('Batch id, color, expiryDate, weight, and operator are required', 400);
    }

    // 1. Check duplicate ID (exclude soft-deleted)
    const existing = await prisma.inkBatch.findFirst({
      where: { id: dto.id, deletedAt: null }
    });
    if (existing) {
      throw new AppError(`Ink batch with ID ${dto.id} already exists`, 400);
    }

    // 2. Validate formulaCode if provided (exclude soft-deleted)
    if (dto.formulaCode) {
      const formula = await prisma.inkFormula.findFirst({
        where: { code: dto.formulaCode, deletedAt: null }
      });
      if (!formula) {
        console.warn(`Formula with code ${dto.formulaCode} does not exist — creating batch without formula reference`);
        dto.formulaCode = null;
      }
    }

    if (dto.productCode) {
      const product = await prisma.product.findUnique({
        where: { code: dto.productCode }
      });
      if (!product) {
        console.warn(`Product with code ${dto.productCode} does not exist — creating batch without product reference`);
        dto.productCode = null;
      }
    }

    return prisma.inkBatch.create({
      data: {
        id: dto.id,
        formulaCode: dto.formulaCode || null,
        productCode: dto.productCode || null,
        color: dto.color,
        mixDate: dto.mixDate ? new Date(dto.mixDate) : null,
        expiryDate: new Date(dto.expiryDate),
        weight: dto.weight,
        remaining: dto.weight, // Initially remaining equals weight
        operator: dto.operator,
        status: 'active'
      }
    });
  }

  static async listBatches(search?: string, sortByExpiry = false, showDeleted = false) {
    const filters: any = {};
    filters.deletedAt = showDeleted ? { not: null } : null;
    if (search) {
      filters.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { operator: { contains: search, mode: 'insensitive' } }
      ];
    }
    return prisma.inkBatch.findMany({
      where: filters,
      orderBy: sortByExpiry ? { expiryDate: 'asc' } : { id: 'desc' }
    });
  }

  static async getBatchById(id: string) {
    const batch = await prisma.inkBatch.findUnique({
      where: { id }
    });
    if (!batch) {
      throw new AppError('Ink batch not found', 404);
    }
    return batch;
  }

  static async updateBatch(id: string, dto: UpdateInkBatchDto) {
    await this.getBatchById(id);

    return prisma.inkBatch.update({
      where: { id },
      data: {
        remaining: dto.remaining,
        status: dto.status
      }
    });
  }

  static async deleteBatch(id: string) {
    await this.getBatchById(id);
    return prisma.inkBatch.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  static async restoreBatch(id: string) {
    await this.getBatchById(id);
    return prisma.inkBatch.update({
      where: { id },
      data: { deletedAt: null }
    });
  }

  static async permanentDeleteBatch(id: string) {
    await this.getBatchById(id);
    return prisma.inkBatch.delete({
      where: { id }
    });
  }

  static async emptyBatchTrash() {
    return prisma.inkBatch.deleteMany({
      where: { deletedAt: { not: null } }
    });
  }

  static async batchUpdateFormulaStatus(codes: string[], status: InkFormulaStatus) {
    return prisma.inkFormula.updateMany({
      where: { code: { in: codes }, deletedAt: null },
      data: { status }
    });
  }

  static async batchDeleteFormulas(codes: string[]) {
    return prisma.inkFormula.updateMany({
      where: { code: { in: codes }, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  static async batchRestoreFormulas(codes: string[]) {
    return prisma.inkFormula.updateMany({
      where: { code: { in: codes }, deletedAt: { not: null } },
      data: { deletedAt: null }
    });
  }

  static async batchDeleteBatches(ids: string[]) {
    return prisma.inkBatch.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  static async batchRestoreBatches(ids: string[]) {
    return prisma.inkBatch.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null }
    });
  }

  static async checkFormulaExists(field: string, value: string): Promise<boolean> {
    const allowedFields = ['code'];
    if (!allowedFields.includes(field)) {
      throw new AppError(`Field '${field}' is not allowed for formula existence check`, 400);
    }
    const record = await prisma.inkFormula.findFirst({
      where: { [field]: value, deletedAt: null }
    });
    return !!record;
  }

  static async checkBatchExists(field: string, value: string): Promise<boolean> {
    const allowedFields = ['id'];
    if (!allowedFields.includes(field)) {
      throw new AppError(`Field '${field}' is not allowed for batch existence check`, 400);
    }
    const record = await prisma.inkBatch.findFirst({
      where: { [field]: value, deletedAt: null }
    });
    return !!record;
  }
}
