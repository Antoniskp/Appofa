'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const loadUser = async () => {
      try {
        const response = await authAPI.getProfile();
        if (response.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    if (response.success) {
      setUser(response.data.user);
      return response;
    }
    throw new Error(response.message || 'Login failed');
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    if (response.success) {
      setUser(response.data.user);
      return response;
    }
    throw new Error(response.message || 'Registration failed');
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const response = await authAPI.updateProfile(profileData);
    if (response.success) {
      setUser(response.data.user);
      return response;
    }
    throw new Error(response.message || 'Profile update failed');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
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
