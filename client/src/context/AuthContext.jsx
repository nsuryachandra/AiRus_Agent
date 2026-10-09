import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkCurrentSession();
  }, []);

  async function checkCurrentSession() {
    try {
      setLoading(true);
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (_) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    setAuthError(null);
    try {
      const res = await api.login(email, password);
      if (res.success && res.user) {
        if (res.token) setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      throw new Error(res.error || 'Login failed');
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  }

  async function register(name, email, password) {
    setAuthError(null);
    try {
      const res = await api.register(name, email, password);
      if (res.success && res.user) {
        if (res.token) setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      throw new Error(res.error || 'Registration failed');
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  }

  async function logout() {
    try {
      await api.logout();
    } catch (_) {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        refreshUser: checkCurrentSession
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
