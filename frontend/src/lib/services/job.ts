import { apiClient } from '@/lib/api/client';
import type {
  ProductionJobDto, CreateProductionJobDto, UpdateJobStatusDto,
  JobVerificationDto, VerifyJobRequestDto, OverrideVerifyRequestDto,
} from '@shared/dto/job/job.dto';
import type { ProductionLogDto, CreateProductionLogDto } from '@shared/dto/log/log.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listJobs(params?: Record<string, string>): Promise<ProductionJobDto[]> {
  const res = await apiClient.get<ApiResponse<ProductionJobDto[]>>('/api/v1/jobs', { params });
  return res.data.data!;
}

export async function getJob(jobNumber: string): Promise<ProductionJobDto> {
  const res = await apiClient.get<ApiResponse<ProductionJobDto>>(`/api/v1/jobs/${jobNumber}`);
  return res.data.data!;
}

export async function createJob(data: CreateProductionJobDto): Promise<ProductionJobDto> {
  const res = await apiClient.post<ApiResponse<ProductionJobDto>>('/api/v1/jobs', data);
  return res.data.data!;
}

export async function bulkCreateJobs(data: CreateProductionJobDto[]): Promise<number> {
  const created = await Promise.allSettled(data.map((d) => createJob(d)));
  return created.filter((r) => r.status === 'fulfilled').length;
}

export async function updateJobStatus(jobNumber: string, data: UpdateJobStatusDto): Promise<void> {
  await apiClient.put(`/api/v1/jobs/${jobNumber}/status`, data);
}

export async function verifyJob(jobNumber: string, data: VerifyJobRequestDto): Promise<JobVerificationDto> {
  const res = await apiClient.post<ApiResponse<JobVerificationDto>>(`/api/v1/jobs/${jobNumber}/verify`, data);
  return res.data.data!;
}

export async function overrideVerify(jobNumber: string, data: OverrideVerifyRequestDto): Promise<JobVerificationDto> {
  const res = await apiClient.post<ApiResponse<JobVerificationDto>>(`/api/v1/jobs/${jobNumber}/override`, data);
  return res.data.data!;
}

export async function getVerification(jobNumber: string): Promise<JobVerificationDto> {
  const res = await apiClient.get<ApiResponse<JobVerificationDto>>(`/api/v1/jobs/${jobNumber}/verification`);
  return res.data.data!;
}

export async function deleteJob(jobNumber: string): Promise<void> {
  await apiClient.delete(`/api/v1/jobs/${jobNumber}`);
}

export async function restoreJob(jobNumber: string): Promise<void> {
  await apiClient.post(`/api/v1/jobs/${jobNumber}/restore`);
}

export async function permanentDeleteJob(jobNumber: string): Promise<void> {
  await apiClient.delete(`/api/v1/jobs/${jobNumber}/permanent`);
}

export async function emptyJobTrash(): Promise<{ deleted: number }> {
  const res = await apiClient.delete<ApiResponse<{ deleted: number }>>('/api/v1/jobs/trash/empty');
  return res.data.data!;
}

export async function batchUpdateJobStatus(jobNumbers: string[], status: string): Promise<{ updated: number }> {
  const res = await apiClient.post<ApiResponse<{ updated: number }>>('/api/v1/jobs/batch/status', { jobNumbers, status });
  return res.data.data!;
}

export async function batchDeleteJobs(jobNumbers: string[]): Promise<{ deleted: number }> {
  const res = await apiClient.post<ApiResponse<{ deleted: number }>>('/api/v1/jobs/batch/delete', { jobNumbers });
  return res.data.data!;
}

export async function batchRestoreJobs(jobNumbers: string[]): Promise<{ restored: number }> {
  const res = await apiClient.post<ApiResponse<{ restored: number }>>('/api/v1/jobs/batch/restore', { jobNumbers });
  return res.data.data!;
}

export async function getJobLogs(jobNumber: string): Promise<ProductionLogDto[]> {
  const res = await apiClient.get<ApiResponse<ProductionLogDto[]>>(`/api/v1/jobs/${jobNumber}/logs`);
  return res.data.data!;
}

export async function logProduction(jobNumber: string, data: CreateProductionLogDto): Promise<ProductionLogDto> {
  const res = await apiClient.post<ApiResponse<ProductionLogDto>>(`/api/v1/jobs/${jobNumber}/logs`, data);
  return res.data.data!;
}
