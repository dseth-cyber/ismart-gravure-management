import { apiClient } from '@/lib/api/client';
import type { QcInspectionDto, CreateQcInspectionDto, TraceabilityResultDto } from '@shared/dto/qc/qc.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listInspections(params?: Record<string, string>): Promise<QcInspectionDto[]> {
  const res = await apiClient.get<ApiResponse<QcInspectionDto[]>>('/api/v1/qc/inspections', { params });
  return res.data.data!;
}

export async function getInspection(id: string): Promise<QcInspectionDto> {
  const res = await apiClient.get<ApiResponse<QcInspectionDto>>(`/api/v1/qc/inspections/${id}`);
  return res.data.data!;
}

export async function createInspection(jobNumber: string, data: CreateQcInspectionDto): Promise<QcInspectionDto> {
  const res = await apiClient.post<ApiResponse<QcInspectionDto>>(`/api/v1/qc/inspections/${jobNumber}`, data);
  return res.data.data!;
}

export async function deleteInspection(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/qc/inspections/${id}`);
}

export async function getTraceability(params?: Record<string, string>): Promise<TraceabilityResultDto> {
  const res = await apiClient.get<ApiResponse<TraceabilityResultDto>>('/api/v1/qc/traceability', { params });
  return res.data.data!;
}
