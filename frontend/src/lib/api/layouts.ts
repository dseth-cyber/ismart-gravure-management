import { apiClient } from '@/lib/api/client';

export interface LayoutData {
  layouts: any;
  extraCards: any[];
  cardTitles: Record<string, string>;
  cardConfigs: Record<string, { chartType: string; dataSource: string }>;
  hiddenCards: string[];
}

export interface LayoutSummary {
  name: string;
  updatedAt: string;
}

// --- Single default (backward compat) ---
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

// --- Single user layout (backward compat) ---
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

// --- Named user layouts ---
export async function listMyLayouts(): Promise<LayoutSummary[]> {
  try {
    const res = await apiClient.get('/api/v1/layouts/me/list');
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function fetchMyLayoutByName(name: string): Promise<LayoutData | null> {
  try {
    const res = await apiClient.get(`/api/v1/layouts/me/${encodeURIComponent(name)}`);
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function saveMyLayoutByName(name: string, data: LayoutData): Promise<void> {
  await apiClient.put(`/api/v1/layouts/me/${encodeURIComponent(name)}`, { data });
}

export async function deleteMyLayoutByName(name: string): Promise<void> {
  await apiClient.delete(`/api/v1/layouts/me/${encodeURIComponent(name)}`);
}

// --- Named default layouts (admin) ---
export async function listDefaultLayouts(): Promise<LayoutSummary[]> {
  try {
    const res = await apiClient.get('/api/v1/layouts/defaults');
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function fetchDefaultLayoutByName(name: string): Promise<LayoutData | null> {
  try {
    const res = await apiClient.get(`/api/v1/layouts/defaults/${encodeURIComponent(name)}`);
    return res.data?.data || null;
  } catch {
    return null;
  }
}

export async function saveDefaultLayoutByName(name: string, data: LayoutData): Promise<void> {
  await apiClient.put(`/api/v1/layouts/defaults/${encodeURIComponent(name)}`, { data });
}