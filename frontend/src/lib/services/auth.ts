import { apiClient } from '@/lib/api/client';
import type { LoginRequestDto, LoginResponseDto, UserProfileDto, ApiResponse } from '@shared/dto/auth/auth.dto';

export async function login(data: LoginRequestDto): Promise<LoginResponseDto> {
  const res = await apiClient.post<ApiResponse<LoginResponseDto>>('/api/v1/auth/login', data);
  return res.data.data!;
}

export async function getMe(): Promise<UserProfileDto> {
  const res = await apiClient.get<ApiResponse<UserProfileDto>>('/api/v1/auth/me');
  return res.data.data!;
}
