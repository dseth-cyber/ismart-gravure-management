export interface ProductionLogDto {
  id: string;
  jobNumber: string;
  machineName: string;
  operator: string;
  startMeter: number;
  endMeter: number;
  totalPrinted: number;
  scrapQuantity: number;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateProductionLogDto {
  machineName: string;
  operator: string;
  startMeter: number;
  endMeter: number;
  scrapQuantity: number;
}
