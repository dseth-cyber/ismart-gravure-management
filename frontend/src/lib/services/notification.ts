import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export interface AlertNotification {
  id: string;
  type: 'ink_expiry' | 'cylinder_maintenance';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  resourceId: string;
  createdAt: string;
}

export async function listNotifications(): Promise<AlertNotification[]> {
  const res = await apiClient.get<ApiResponse<AlertNotification[]>>('/api/v1/notifications');
  return res.data.data || [];
}
