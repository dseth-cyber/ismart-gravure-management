import { apiClient } from '@/lib/api/client';
import type { ProductDto, CreateProductDto, UpdateProductDto } from '@shared/dto/product/product.dto';
import type { ApiResponse } from '@shared/dto/auth/auth.dto';

export async function listProducts(params?: Record<string, string>): Promise<ProductDto[]> {
  const res = await apiClient.get<ApiResponse<ProductDto[]>>('/api/v1/products', { params });
  return res.data.data!;
}

export async function getProduct(id: string): Promise<ProductDto> {
  const res = await apiClient.get<ApiResponse<ProductDto>>(`/api/v1/products/${id}`);
  return res.data.data!;
}

export async function createProduct(data: CreateProductDto): Promise<ProductDto> {
  const res = await apiClient.post<ApiResponse<ProductDto>>('/api/v1/products', data);
  return res.data.data!;
}

export async function updateProduct(id: string, data: UpdateProductDto): Promise<ProductDto> {
  const res = await apiClient.put<ApiResponse<ProductDto>>(`/api/v1/products/${id}`, data);
  return res.data.data!;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/products/${id}`);
}
