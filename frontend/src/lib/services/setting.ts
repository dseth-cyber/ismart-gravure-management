import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';
import type { SystemSettingDto } from '@shared/dto/setting/setting.dto';

export async function listSettings(): Promise<SystemSettingDto[]> {
  const res = await apiClient.get<ApiResponse<SystemSettingDto[]>>('/api/v1/settings');
  return res.data.data!;
}

export async function saveSetting(key: string, value: string): Promise<SystemSettingDto> {
  const res = await apiClient.put<ApiResponse<SystemSettingDto>>('/api/v1/settings', { key, value });
  return res.data.data!;
}
