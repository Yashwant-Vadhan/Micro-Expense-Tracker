// src/context/AuthContext.jsx
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  // start explicitly signed-out
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = useCallback(({ token: newToken, name }) => {
    if (!newToken) return;
    setToken(newToken);
    setUser({ name: name || '' });
    // session-only so closing browser clears it
    sessionStorage.setItem('token', newToken);
    if (name) sessionStorage.setItem('name', name);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('name');
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    // redirect handled by caller
  }, []);

  useEffect(() => {
    // Enforce explicit login on app start:
    // If you would like "remember me" later, change this behaviour.
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('name');
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ token, user, login, logout }), [token, user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
