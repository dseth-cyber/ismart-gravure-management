import { apiClient } from '@/lib/api/client';
import type { SalesOrderDto, CreateSalesOrderDto, UpdateSalesOrderStatusDto } from '@shared/dto/order/order.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listOrders(params?: Record<string, string>): Promise<SalesOrderDto[]> {
  const res = await apiClient.get<ApiResponse<SalesOrderDto[]>>('/api/v1/orders', { params });
  return res.data.data!;
}

export async function getOrder(id: string): Promise<SalesOrderDto> {
  const res = await apiClient.get<ApiResponse<SalesOrderDto>>(`/api/v1/orders/${id}`);
  return res.data.data!;
}

export async function createOrder(data: CreateSalesOrderDto): Promise<SalesOrderDto> {
  const res = await apiClient.post<ApiResponse<SalesOrderDto>>('/api/v1/orders', data);
  return res.data.data!;
}

export async function updateOrderStatus(id: string, data: UpdateSalesOrderStatusDto): Promise<void> {
  await apiClient.put(`/api/v1/orders/${id}`, data);
}

export async function deleteOrder(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/orders/${id}`);
}
