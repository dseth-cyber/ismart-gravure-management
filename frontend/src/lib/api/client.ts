import axios from 'axios';
import { emitGlobalError } from '@/components/shared/error-dialog';

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
    if (error.response && error.response.status === 403) {
      const lang = typeof window !== 'undefined' ? window.localStorage.getItem('gm_lang') || 'th' : 'th';
      let msg = 'Access Denied: You do not have permission to access this resource.';
      if (lang === 'th') {
        msg = 'คุณไม่มีสิทธิ์เข้าถึงหรือดำเนินการในส่วนนี้ กรุณาติดต่อผู้ดูแลระบบ';
      } else if (lang === 'cn') {
        msg = '您没有权限访问此资源，请联系管理员。';
      } else if (lang === 'ja') {
        msg = 'このリソースにアクセスする権限がありません。管理者にお問い合わせください。';
      } else if (lang === 'mm') {
        msg = 'ဤလုပ်ဆောင်ချက်ကို လုပ်ဆောင်ရန် သင့်တွင် ခွင့်ပြုချက်မရှိပါ။ စီမံခန့်ခွဲသူကို ဆက်သွယ်ပါ။';
      }
      error.message = msg;
      if (error.response.data && typeof error.response.data === 'object') {
        error.response.data.message = msg;
      }
      if (typeof window !== 'undefined') {
        emitGlobalError({ message: msg, titleKey: 'common.forbidden', statusCode: 403 });
      }
      return Promise.reject(error);
    }

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
      document.cookie = 'gm_token=; path=/; max-age=0';
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
