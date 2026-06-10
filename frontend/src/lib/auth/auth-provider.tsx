'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '../api/client';
import { LoginRequestDto, LoginResponseDto, UserProfileDto, ApiResponse } from '@shared/dto/auth/auth.dto';

type UserProfile = UserProfileDto;

type AuthContextType = {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('gm_access_token');
    setToken(null);
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  // Load token and fetch user on mount
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('gm_access_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await apiClient.get<ApiResponse<UserProfileDto>>('/api/v1/auth/me');
          if (res.data && res.data.status === 'success' && res.data.data) {
            setUser(res.data.data);
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error('Failed to load user profile', err);
          handleLogout();
        }
      } else {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Update loading state once user is resolved or no token is found
  useEffect(() => {
    if (token && user) {
      setLoading(false);
    } else if (!token) {
      setLoading(false);
    }
  }, [token, user]);

  // Handle automatic redirection
  useEffect(() => {
    if (loading) return;

    const isLoginPage = pathname === '/login';
    if (!token && !isLoginPage) {
      router.push('/login');
    } else if (token && user && isLoginPage) {
      router.push('/');
    }
  }, [token, user, loading, pathname, router]);

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<LoginResponseDto>>('/api/v1/auth/login', { username, password } as LoginRequestDto);
      if (res.data && res.data.status === 'success' && res.data.data) {
        const { token: nextToken, user: nextUser } = res.data.data;
        localStorage.setItem('gm_access_token', nextToken);
        setToken(nextToken);
        setUser(nextUser);
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
