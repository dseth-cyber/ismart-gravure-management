export type QcStatus = 'pass' | 'fail' | 'hold';

export interface QcInspectionDto {
  id: string;
  jobNumber: string;
  inspector: string;
  shadeResult: string;
  barcodePassed: boolean;
  colorSequencePassed: boolean;
  adhesionPassed: boolean;
  status: QcStatus;
  remarks: string | null;
  createdAt: Date | string;
}

export interface CreateQcInspectionDto {
  inspector: string;
  shadeResult: string;
  barcodePassed: boolean;
  colorSequencePassed: boolean;
  adhesionPassed: boolean;
  remarks?: string;
}

export interface TraceabilityResultDto {
  productCode: string;
  customerName: string;
  jobs: Array<{
    jobNumber: string;
    plannedDate: Date | string;
    machineName: string;
    operator: string;
    totalPrinted: number;
    status: string;
  }>;
  cylinders: Array<{
    cylinderId: string;
    color: string;
    colorName: string;
    meter: number;
    location: string;
  }>;
  inks: Array<{
    batchId: string;
    color: string;
    formulaCode: string;
    expiryDate: Date | string;
    remaining: number;
  }>;
}
