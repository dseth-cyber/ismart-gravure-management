import { apiClient } from '@/lib/api/client';
import type { CylinderDto, CreateCylinderDto, UpdateCylinderDto } from '@shared/dto/cylinder/cylinder.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listCylinders(params?: Record<string, string>): Promise<CylinderDto[]> {
  const res = await apiClient.get<ApiResponse<CylinderDto[]>>('/api/v1/cylinders', { params });
  return res.data.data!;
}

export async function getCylinder(id: string): Promise<CylinderDto> {
  const res = await apiClient.get<ApiResponse<CylinderDto>>(`/api/v1/cylinders/${id}`);
  return res.data.data!;
}

export async function createCylinder(data: CreateCylinderDto): Promise<CylinderDto> {
  const res = await apiClient.post<ApiResponse<CylinderDto>>('/api/v1/cylinders', data);
  return res.data.data!;
}

export async function updateCylinder(id: string, data: UpdateCylinderDto): Promise<CylinderDto> {
  const res = await apiClient.put<ApiResponse<CylinderDto>>(`/api/v1/cylinders/${id}`, data);
  return res.data.data!;
}

export async function deleteCylinder(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/cylinders/${id}`);
}
