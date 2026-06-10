import axios from 'axios';

const isServer = typeof window === 'undefined';

export const apiClient = axios.create({
  baseURL: isServer 
    ? (process.env.BACKEND_INTERNAL_URL || 'http://backend:5000') 
    : (process.env.NEXT_PUBLIC_API_BASE_URL || ''),
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  const token = window.localStorage.getItem('gm_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
