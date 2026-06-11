'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '../api/client';
import { UserProfileDto, ApiResponse } from '@shared/dto/auth/auth.dto';

type AuthContextType = {
  user: UserProfileDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('gm_refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/api/v1/auth/logout', { refreshToken });
      } catch { /* ignore */ }
    }
    localStorage.removeItem('gm_access_token');
    localStorage.removeItem('gm_refresh_token');
    setAccessToken(null);
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('gm_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
        try {
          const res = await apiClient.get<ApiResponse<UserProfileDto>>('/api/v1/auth/me');
          if (res.data?.status === 'success' && res.data.data) {
            setUser(res.data.data);
          } else {
            await handleLogout();
          }
        } catch {
          await handleLogout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (loading) return;
    const isLoginPage = pathname === '/login';
    if (!accessToken && !isLoginPage) {
      router.push('/login');
    } else if (accessToken && user && isLoginPage) {
      router.push('/');
    }
  }, [accessToken, user, loading, pathname, router]);

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/api/v1/auth/login', { username, password });
      const { accessToken: at, refreshToken: rt, user: u } = res.data.data;
      localStorage.setItem('gm_access_token', at);
      localStorage.setItem('gm_refresh_token', rt);
      setAccessToken(at);
      setUser(u);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    await apiClient.post('/api/v1/auth/change-password', { currentPassword, newPassword });
    localStorage.removeItem('gm_access_token');
    localStorage.removeItem('gm_refresh_token');
    setAccessToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken && !!user,
        loading,
        login: handleLogin,
        logout: handleLogout,
        changePassword: handleChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
