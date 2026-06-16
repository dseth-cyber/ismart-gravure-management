import { apiClient } from '@/lib/api/client';
import type { AuditLogDto } from '@shared/dto/audit/audit.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listAuditLogs(params?: Record<string, any>): Promise<{ data: AuditLogDto[]; total: number }> {
  const res = await apiClient.get<ApiResponse<AuditLogDto[]> & { total: number }>('/api/v1/audit/logs', { params });
  return {
    data: res.data.data!,
    total: res.data.total ?? res.data.data!.length
  };
}

export async function createAuditLog(action: string, details: string): Promise<any> {
  const res = await apiClient.post<ApiResponse<any>>('/api/v1/audit/logs', { action, details });
  return res.data;
}

