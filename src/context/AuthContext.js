// src/context/AuthContext.js
import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/authapi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Rehydrate from sessionStorage so refresh doesn't log the user out
  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem('jwt_token');
    const email = sessionStorage.getItem('jwt_email');
    const role  = sessionStorage.getItem('jwt_role');
    return token ? { token, email, role } : null;
  });

  const persist = (data) => {
    sessionStorage.setItem('jwt_token', data.token);
    sessionStorage.setItem('jwt_email', data.email);
    sessionStorage.setItem('jwt_role',  data.role);
    setUser({ token: data.token, email: data.email, role: data.role });
  };

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);   // throws on failure
    persist(data);
  }, []);

  const register = useCallback(async (email, password) => {
    const data = await apiRegister(email, password); // throws on failure
    persist(data);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('jwt_token');
    sessionStorage.removeItem('jwt_email');
    sessionStorage.removeItem('jwt_role');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook — use this in any component
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}