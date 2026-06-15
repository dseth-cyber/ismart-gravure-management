import { apiClient } from '@/lib/api/client';

export interface LayoutData {
  layouts: any;
  extraCards: any[];
  cardTitles: Record<string, string>;
  cardConfigs: Record<string, { chartType: string; dataSource: string }>;
  hiddenCards: string[];
}

export async function fetchDefaultLayout(): Promise<LayoutData | null> {
  try {
    const res = await apiClient.get('/api/v1/layouts/default');
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function saveDefaultLayout(data: LayoutData): Promise<void> {
  await apiClient.put('/api/v1/layouts/default', { data });
}

export async function fetchMyLayout(): Promise<LayoutData | null> {
  try {
    const res = await apiClient.get('/api/v1/layouts/me');
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function saveMyLayout(data: LayoutData): Promise<void> {
  await apiClient.put('/api/v1/layouts/me', { data });
}

export async function resetMyLayout(): Promise<void> {
  await apiClient.delete('/api/v1/layouts/me');
}
