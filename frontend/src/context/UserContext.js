import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('moviedbx_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (userData, token) => {
    const payload = token ? { ...userData, token } : userData;
    setUser(payload);
    localStorage.setItem('moviedbx_user', JSON.stringify(payload)); // Persist to browser storage
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('moviedbx_user');
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
