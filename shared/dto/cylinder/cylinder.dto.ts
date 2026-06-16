export type CylinderStatus = 'available' | 'inProduction' | 'reserved' | 'repair' | 'inspection' | 'hold';

export interface CylinderDto {
  id: string;
  productCode: string;
  color: string;
  colorName: string;
  status: CylinderStatus;
  location: string;
  meter: number;
  lastUsed?: string | null;
  type: string;
  size: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCylinderDto {
  id: string;
  productCode: string;
  color: string;
  colorName: string;
  location: string;
  type?: string;
  size: string;
}

export interface UpdateCylinderDto {
  status?: CylinderStatus;
  location?: string;
  meter?: number;
  lastUsed?: string | null;
  type?: string;
  size?: string;
}
