import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  });
  const [loading, setLoading] = useState(true);

  // Synchronize loading state
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    return await authService.registerCustomer(payload);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setCurrentUser(null);
  }, []);

  const updateProfile = async (payload) => {
    const data = await authService.updateProfile(payload);
    setCurrentUser(data.user);
    return data;
  };

  // Listen to global auth-logout events triggered by API interceptor (e.g. 401s)
  useEffect(() => {
    const handleGlobalLogout = () => {
      logout();
    };
    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, [logout]);

  const value = {
    token,
    currentUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
