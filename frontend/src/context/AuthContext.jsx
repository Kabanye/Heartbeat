import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Set default header
        api.defaults.headers.Authorization = `Token ${token}`;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []); // Empty dependency array - only runs once on mount

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.Authorization = `Token ${token}`;
    setUser(userData);
    return response.data;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    const { token, user: newUser } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    api.defaults.headers.Authorization = `Token ${token}`;
    setUser(newUser);
    return response.data;
  };

 const logout = useCallback(async () => {
  // Clear local state first for instant feedback
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers.Authorization;
  setUser(null);
  
  // Then try server logout (fire and forget)
  try {
    await authService.logout();
  } catch (error) {
    // Already cleared locally, ignore server errors
  }
}, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;