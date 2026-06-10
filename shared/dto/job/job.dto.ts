export type JobStatus = 'pending' | 'verifying' | 'active' | 'completed' | 'hold' | 'cancelled';

export interface ProductionJobDto {
  id: string;
  jobNumber: string;
  orderNumber: string;
  productCode: string;
  machineName: string;
  plannedDate: Date | string;
  status: JobStatus;
  totalPrinted: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateProductionJobDto {
  jobNumber: string;
  orderNumber: string;
  productCode: string;
  machineName: string;
  plannedDate: string;
}

export interface UpdateJobStatusDto {
  status: JobStatus;
}

export interface JobVerificationDto {
  id: string;
  jobNumber: string;
  verifiedBy: string;
  isPassed: boolean;
  scannedCylinders: string[];
  scannedInkBatches: string[];
  requiresOverride: boolean;
  overrideBy: string | null;
  createdAt: Date | string;
}

export interface VerifyJobRequestDto {
  verifiedBy: string;
  scannedCylinderIds: string[];
  scannedInkBatchIds: string[];
}

export interface OverrideVerifyRequestDto {
  overrideBy: string;
}
