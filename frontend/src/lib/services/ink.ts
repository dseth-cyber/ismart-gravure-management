import { apiClient } from '@/lib/api/client';
import type {
  InkFormulaDto, CreateInkFormulaDto, UpdateInkFormulaDto,
  InkBatchDto, CreateInkBatchDto, UpdateInkBatchDto,
} from '@shared/dto/ink/ink.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listFormulas(params?: Record<string, string>): Promise<InkFormulaDto[]> {
  const res = await apiClient.get<ApiResponse<InkFormulaDto[]>>('/api/v1/inks/formulas', { params });
  return res.data.data!;
}

export async function getFormula(code: string): Promise<InkFormulaDto> {
  const res = await apiClient.get<ApiResponse<InkFormulaDto>>(`/api/v1/inks/formulas/${code}`);
  return res.data.data!;
}

export async function createFormula(data: CreateInkFormulaDto): Promise<InkFormulaDto> {
  const res = await apiClient.post<ApiResponse<InkFormulaDto>>('/api/v1/inks/formulas', data);
  return res.data.data!;
}

export async function updateFormula(code: string, data: UpdateInkFormulaDto): Promise<InkFormulaDto> {
  const res = await apiClient.put<ApiResponse<InkFormulaDto>>(`/api/v1/inks/formulas/${code}`, data);
  return res.data.data!;
}

export async function deleteFormula(code: string): Promise<void> {
  await apiClient.delete(`/api/v1/inks/formulas/${code}`);
}

export async function listBatches(params?: Record<string, string>): Promise<InkBatchDto[]> {
  const res = await apiClient.get<ApiResponse<InkBatchDto[]>>('/api/v1/inks/batches', { params });
  return res.data.data!;
}

export async function getBatch(id: string): Promise<InkBatchDto> {
  const res = await apiClient.get<ApiResponse<InkBatchDto>>(`/api/v1/inks/batches/${id}`);
  return res.data.data!;
}

export async function createBatch(data: CreateInkBatchDto): Promise<InkBatchDto> {
  const res = await apiClient.post<ApiResponse<InkBatchDto>>('/api/v1/inks/batches', data);
  return res.data.data!;
}

export async function updateBatch(id: string, data: UpdateInkBatchDto): Promise<InkBatchDto> {
  const res = await apiClient.put<ApiResponse<InkBatchDto>>(`/api/v1/inks/batches/${id}`, data);
  return res.data.data!;
}

export async function deleteBatch(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/inks/batches/${id}`);
}
