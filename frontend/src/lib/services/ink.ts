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

export async function batchUpdateFormulaStatus(codes: string[], status: string): Promise<{ updated: number }> {
  const res = await apiClient.post<ApiResponse<{ updated: number }>>('/api/v1/inks/formulas/batch/status', { codes, status });
  return res.data.data!;
}

export async function batchDeleteFormulas(codes: string[]): Promise<{ deleted: number }> {
  const res = await apiClient.post<ApiResponse<{ deleted: number }>>('/api/v1/inks/formulas/batch/delete', { codes });
  return res.data.data!;
}

export async function batchRestoreFormulas(codes: string[]): Promise<{ restored: number }> {
  const res = await apiClient.post<ApiResponse<{ restored: number }>>('/api/v1/inks/formulas/batch/restore', { codes });
  return res.data.data!;
}

export async function batchDeleteBatches(ids: string[]): Promise<{ deleted: number }> {
  const res = await apiClient.post<ApiResponse<{ deleted: number }>>('/api/v1/inks/batches/batch/delete', { ids });
  return res.data.data!;
}

export async function batchRestoreBatches(ids: string[]): Promise<{ restored: number }> {
  const res = await apiClient.post<ApiResponse<{ restored: number }>>('/api/v1/inks/batches/batch/restore', { ids });
  return res.data.data!;
}

export async function bulkCreateFormulas(data: CreateInkFormulaDto[]): Promise<number> {
  const created = await Promise.allSettled(data.map((d) => createFormula(d)));
  return created.filter((r) => r.status === 'fulfilled').length;
}

export async function bulkCreateBatches(data: CreateInkBatchDto[]): Promise<number> {
  const created = await Promise.allSettled(data.map((d) => createBatch(d)));
  return created.filter((r) => r.status === 'fulfilled').length;
}

export async function restoreFormula(code: string): Promise<void> {
  await apiClient.post(`/api/v1/inks/formulas/${code}/restore`);
}

export async function permanentDeleteFormula(code: string): Promise<void> {
  await apiClient.delete(`/api/v1/inks/formulas/${code}/permanent`);
}

export async function emptyFormulaTrash(): Promise<{ deleted: number }> {
  const res = await apiClient.delete<ApiResponse<{ deleted: number }>>('/api/v1/inks/formulas/trash/empty');
  return res.data.data!;
}

export async function restoreBatch(id: string): Promise<void> {
  await apiClient.post(`/api/v1/inks/batches/${id}/restore`);
}

export async function permanentDeleteBatch(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/inks/batches/${id}/permanent`);
}

export async function emptyBatchTrash(): Promise<{ deleted: number }> {
  const res = await apiClient.delete<ApiResponse<{ deleted: number }>>('/api/v1/inks/batches/trash/empty');
  return res.data.data!;
}

