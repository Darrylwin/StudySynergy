// src/contexts/AuthContext.jsx - ADAPTÉ
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const savedUser = authAPI.getCurrentUser();
      const token = localStorage.getItem('access_token');
      
      if (savedUser && token) {
        // Vérifier que le token est encore valide
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (error) {
          // Token invalide
          authAPI.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const userData = response.data;
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Échec de la connexion'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const response = await authAPI.register(userData);
      const userInfo = response.data;
      
      setUser(userInfo);
      return { success: true, user: userInfo };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Échec de l\'inscription'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
