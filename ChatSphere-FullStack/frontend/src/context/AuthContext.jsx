import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('chatsphere_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('chatsphere_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data);
          localStorage.setItem('chatsphere_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session expired:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('chatsphere_token', newToken);
    localStorage.setItem('chatsphere_user', JSON.stringify(userData));
    return userData;
  };

  const signup = async (name, email, password, avatarUrl) => {
    const res = await api.post('/auth/signup', { name, email, password, avatarUrl });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('chatsphere_token', newToken);
    localStorage.setItem('chatsphere_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('chatsphere_token');
    localStorage.removeItem('chatsphere_user');
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    setUser(res.data);
    localStorage.setItem('chatsphere_user', JSON.stringify(res.data));
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, signup, logout, updateProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
