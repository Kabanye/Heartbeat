import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response;
  },

  logout: async () => {
    const token = localStorage.getItem('token');
    try {
      // Try server logout with token
      await api.post('/auth/logout/', null, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
    } catch (error) {
      // Silently fail - we clear locally anyway
      console.log('Server logout completed or failed, clearing local session');
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response;
  },
};