import axios from 'axios';

const isServer = typeof window === 'undefined';

export const apiClient = axios.create({
  baseURL: isServer
    ? (process.env.BACKEND_INTERNAL_URL || 'http://backend:5000')
    : (process.env.NEXT_PUBLIC_API_BASE_URL || ''),
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (isServer) return config;

  const token = window.localStorage.getItem('gm_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (isServer || !error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = window.localStorage.getItem('gm_refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const res = await axios.post(
        (process.env.NEXT_PUBLIC_API_BASE_URL || '') + '/api/v1/auth/refresh',
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = res.data.data;
      window.localStorage.setItem('gm_access_token', accessToken);
      if (newRefreshToken) {
        window.localStorage.setItem('gm_refresh_token', newRefreshToken);
      }

      refreshQueue.forEach(q => q.resolve(accessToken));
      refreshQueue = [];

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshQueue.forEach(q => q.reject(refreshError));
      refreshQueue = [];
      window.localStorage.removeItem('gm_access_token');
      window.localStorage.removeItem('gm_refresh_token');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
