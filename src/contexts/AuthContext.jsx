import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Auth sync error:", e);
        localStorage.clear();
      }
    }
    // Ensure loading is set to false regardless of success
    setLoading(false);
  }, []);

  const login = useCallback((userData, authToken) => {
    if (!authToken) return;

    const safeUser = {
      username: userData.username || userData.name,
      userId: userData._id || userData.id || userData.userId,
      avatar: userData.avatar
    };

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(safeUser));

    setToken(authToken);
    setUser(safeUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};