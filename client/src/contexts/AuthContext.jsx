import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const response = await api.get('/auth/verify');
        setUser(response.data.user);
      } catch {
        logout(true);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  // Auto logout after 30 minutes of inactivity
  useEffect(() => {
    let inactivityTimer;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (user) {
        inactivityTimer = setTimeout(() => {
          toast.error('Session expired due to inactivity');
          logout(true);
        }, 30 * 60 * 1000); // 30 minutes
      }
    };

    if (user) {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keypress', resetTimer);
      window.addEventListener('click', resetTimer);
      window.addEventListener('scroll', resetTimer);
      resetTimer();
    }

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [user]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const newToken = response.data.token;
      const userData = response.data.user;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success('Welcome back, ' + userData.fullName + '!');
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = useCallback((silent = false) => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
    // Force page refresh to clear all state
    setTimeout(() => {
      window.location.reload();
    }, 100);
    if (!silent) {
      toast.success('Logged out successfully');
    }
  }, [navigate]);

  const value = {
    user, token, loading, login, logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Administrator',
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};
