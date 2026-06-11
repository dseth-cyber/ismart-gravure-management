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
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfileDto;
}

export interface RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  statusCode: number;
  data?: T;
  message?: string;
  stack?: string;
}
