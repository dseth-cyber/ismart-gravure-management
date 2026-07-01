import { apiClient } from '@/lib/api/client';

export interface MasterDataItem {
  id: string;
  category: string;
  name: string;
  nameTh?: string | null;
  active: boolean;
  extra?: Record<string, any> | null;
  sortOrder: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listMasterData(category: string, showDeleted = false) {
  const res = await apiClient.get(`/api/v1/master-data?category=${category}&showDeleted=${showDeleted}`);
  return res.data.data as MasterDataItem[];
}

export async function bulkCreateMasterData(data: { category: string; name: string; nameTh?: string; active?: boolean; extra?: any; sortOrder?: number }[]): Promise<number> {
  const created = await Promise.allSettled(data.map((d) => createMasterData(d)));
  return created.filter((r) => r.status === 'fulfilled').length;
}

export async function createMasterData(data: { category: string; name: string; nameTh?: string; active?: boolean; extra?: any; sortOrder?: number }) {
  const res = await apiClient.post('/api/v1/master-data', data);
  return res.data.data as MasterDataItem;
}

export async function updateMasterData(id: string, data: { name?: string; nameTh?: string; active?: boolean; extra?: any; sortOrder?: number }) {
  const res = await apiClient.put(`/api/v1/master-data/${id}`, data);
  return res.data.data as MasterDataItem;
}

export async function deleteMasterData(id: string) {
  const res = await apiClient.delete(`/api/v1/master-data/${id}`);
  return res.data.data as MasterDataItem;
}

export async function restoreMasterData(id: string) {
  const res = await apiClient.post(`/api/v1/master-data/${id}/restore`);
  return res.data.data as MasterDataItem;
}

export async function permanentDeleteMasterData(id: string) {
  const res = await apiClient.delete(`/api/v1/master-data/${id}/permanent`);
  return res.data.data as MasterDataItem;
}

export async function emptyMasterTrash(category: string) {
  const res = await apiClient.delete(`/api/v1/master-data/trash/empty?category=${category}`);
  return res.data.data as { deleted: number };
}
