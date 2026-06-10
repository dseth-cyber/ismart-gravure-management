import { apiClient } from '@/lib/api/client';
import type { CustomerDto, CreateCustomerDto, UpdateCustomerDto } from '@shared/dto/customer/customer.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listCustomers(params?: Record<string, string>): Promise<CustomerDto[]> {
  const res = await apiClient.get<ApiResponse<CustomerDto[]>>('/api/v1/customers', { params });
  return res.data.data!;
}

export async function getCustomer(id: string): Promise<CustomerDto> {
  const res = await apiClient.get<ApiResponse<CustomerDto>>(`/api/v1/customers/${id}`);
  return res.data.data!;
}

export async function createCustomer(data: CreateCustomerDto): Promise<CustomerDto> {
  const res = await apiClient.post<ApiResponse<CustomerDto>>('/api/v1/customers', data);
  return res.data.data!;
}

export async function updateCustomer(id: string, data: UpdateCustomerDto): Promise<CustomerDto> {
  const res = await apiClient.put<ApiResponse<CustomerDto>>(`/api/v1/customers/${id}`, data);
  return res.data.data!;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/customers/${id}`);
}
