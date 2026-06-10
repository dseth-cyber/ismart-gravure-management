export interface UserProfileDto {
  id: string;
  username: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequestDto {
  username: string;
  password?: string;
}

export interface LoginResponseDto {
  token: string;
  user: UserProfileDto;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  statusCode: number;
  data?: T;
  message?: string;
  stack?: string;
}
