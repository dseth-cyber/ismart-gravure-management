export type InkFormulaStatus = 'active' | 'superseded';
export type InkBatchStatus = 'active' | 'nearExpiry' | 'expired';

export interface InkFormulaDto {
  code: string;
  productCode: string;
  color: string;
  pantone: string;
  revision: string;
  status: InkFormulaStatus;
  viscosity: string;
  labTarget: string;
  solvent: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInkFormulaDto {
  code: string;
  productCode: string;
  color: string;
  pantone: string;
  viscosity: string;
  labTarget: string;
  solvent: string;
}

export interface UpdateInkFormulaDto {
  pantone?: string;
  status?: InkFormulaStatus;
  viscosity?: string;
  labTarget?: string;
  solvent?: string;
}

export interface InkBatchDto {
  id: string;
  formulaCode?: string | null;
  productCode?: string | null;
  color: string;
  mixDate?: string | null;
  expiryDate: string;
  weight: number;
  remaining: number;
  operator: string;
  status: InkBatchStatus;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInkBatchDto {
  id: string;
  formulaCode?: string | null;
  productCode?: string | null;
  color: string;
  mixDate?: string | null;
  expiryDate: string;
  weight: number;
  operator: string;
}

export interface UpdateInkBatchDto {
  remaining?: number;
  status?: InkBatchStatus;
}
