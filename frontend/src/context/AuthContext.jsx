import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// ── Storage helpers ────────────────────────────────────────────────────────
// We use sessionStorage (not localStorage) so the JWT is cleared automatically
// when the browser tab is closed.  This prevents tokens from persisting forever
// in the browser, which is a common source of session hijacking.
const STORAGE = {
  getToken:  ()      => sessionStorage.getItem('chatsphere_token'),
  setToken:  (val)   => sessionStorage.setItem('chatsphere_token', val),
  clearToken:()      => sessionStorage.removeItem('chatsphere_token'),
  getUser:   ()      => { try { return JSON.parse(sessionStorage.getItem('chatsphere_user')); } catch { return null; } },
  setUser:   (val)   => sessionStorage.setItem('chatsphere_user', JSON.stringify(val)),
  clearUser: ()      => sessionStorage.removeItem('chatsphere_user'),
  clear:     ()      => { sessionStorage.removeItem('chatsphere_token'); sessionStorage.removeItem('chatsphere_user'); },
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => STORAGE.getUser());
  const [token,   setToken]   = useState(() => STORAGE.getToken());
  const [loading, setLoading] = useState(true);

  // Verify the stored token is still valid on mount
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data);
          STORAGE.setUser(res.data);
        } catch (err) {
          console.error('Session expired or invalid — logging out:', err);
          _clearSession();
        }
      }
      setLoading(false);
    };
    verifyUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Internal helper ──────────────────────────────────────────────────────
  const _applySession = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    STORAGE.setToken(newToken);
    STORAGE.setUser(userData);
  };

  const _clearSession = () => {
    setToken(null);
    setUser(null);
    STORAGE.clear();
  };

  // ── Public API ────────────────────────────────────────────────────────────

  /** Standard email + password login */
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    _applySession(newToken, userData);
    return userData;
  };

  /**
   * Demo login — calls the secure backend endpoint.
   * The password is NEVER stored in or sent from the frontend.
   * @param {'alice'|'bob'|'charlie'} account
   */
  const demoLogin = async (account = 'alice') => {
    const res = await api.post(`/auth/demo?account=${account}`);
    const { token: newToken, user: userData } = res.data;
    _applySession(newToken, userData);
    return userData;
  };

  /** New user registration */
  const signup = async (name, email, password, avatarUrl) => {
    const res = await api.post('/auth/signup', { name, email, password, avatarUrl });
    const { token: newToken, user: userData } = res.data;
    _applySession(newToken, userData);
    return userData;
  };

  /** Clear session (client-side only — JWTs are stateless) */
  const logout = () => _clearSession();

  /** Update own profile and refresh stored user object */
  const updateProfile = async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    setUser(res.data);
    STORAGE.setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        demoLogin,
        signup,
        logout,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
