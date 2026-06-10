import { apiClient } from '@/lib/api/client';
import type { AuditLogDto } from '@shared/dto/audit/audit.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listAuditLogs(params?: Record<string, string>): Promise<AuditLogDto[]> {
  const res = await apiClient.get<ApiResponse<AuditLogDto[]>>('/api/v1/audit/logs', { params });
  return res.data.data!;
}
