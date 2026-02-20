import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await chrome.storage.local.get(['token', 'user']);
        if (data.token) {
          setToken(data.token);
          setUser(data.user || null);
          // Verify token is still valid
          try {
            const res = await authAPI.getMe();
            setUser(res.data.user);
            await chrome.storage.local.set({ user: res.data.user });
          } catch {
            // Token expired
            await chrome.storage.local.remove(['token', 'user']);
            setToken(null);
            setUser(null);
          }
        }
      } catch {
        // Not in extension context
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    await chrome.storage.local.set({ token: t, user: u });
    return u;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await authAPI.register({ email, password, name });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    await chrome.storage.local.set({ token: t, user: u });
    return u;
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await chrome.storage.local.remove(['token', 'user', 'rules']);
  }, []);

  const updateSettings = useCallback(async (settings) => {
    const res = await authAPI.updateSettings({ settings });
    setUser(res.data.user);
    await chrome.storage.local.set({ user: res.data.user });
    return res.data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateSettings, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
