'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';
import { getCsrfToken } from '@/lib/api/client';
import { saveReturnTo } from '@/lib/auth-redirect';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshUser = useCallback(async () => {
    const response = await authAPI.getProfile();
    if (!response.success) throw new Error(response.message || 'Could not refresh your account.');
    setUser(response.data.user);
    return response.data.user;
  }, []);

  useEffect(() => {
    // Check if user is logged in on mount
    const loadUser = async () => {
      // Every login sets the readable csrf_token cookie alongside the HttpOnly session
      // cookie. Without it there is no session, so skip the request that would 401.
      if (!getCsrfToken()) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const response = await authAPI.getProfile();
        if (response.success) {
          setUser(response.data.user);
          setAuthError(null);
        }
      } catch (error) {
        if (error.status === 401) {
          // Session has expired or token is gone — ensure user state is cleared
          // so the app correctly treats the visitor as logged out.
          setUser(null);
          setAuthError(null);
        } else if (error.status === 429) {
          setAuthError({
            status: 429,
            message: error.message,
            retryAfter: error.retryAfter,
            resetTime: error.resetTime,
          });
        } else {
          console.error('Failed to load user:', error);
          setAuthError({
            status: error.status,
            message: error.message || 'Failed to load user.',
          });
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path === '/login' || path === '/register') return;
        saveReturnTo(path);
        window.location.href = '/login?reason=session_expired';
      }
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    if (response.success) {
      setUser(response.data.user);
      setAuthError(null);
      return response;
    }
    throw new Error(response.message || 'Login failed');
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    if (response.success) {
      setUser(response.data.user);
      setAuthError(null);
      return response;
    }
    throw new Error(response.message || 'Registration failed');
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    setAuthError(null);
  };

  const deleteAccount = async ({ password, mode }) => {
    const response = await authAPI.deleteAccount({ password, mode });
    if (response.success) {
      setUser(null);
      setAuthError(null);
      return response;
    }
    throw new Error(response.message || 'Account deletion failed');
  };

  const updateProfile = async (profileData) => {
    const response = await authAPI.updateProfile(profileData);
    if (response.success) {
      setUser(response.data.user);
      setAuthError(null);
      return response;
    }
    throw new Error(response.message || 'Profile update failed');
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, register, logout, updateProfile, deleteAccount, refreshUser }}>
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
