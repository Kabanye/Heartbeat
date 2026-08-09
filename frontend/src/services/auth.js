import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login/', {
      username: credentials.username,
      password: credentials.password,
    });
    return response;
  },

  logout: async () => {
    const token = localStorage.getItem('token');
    try {
      await api.post('/auth/logout/', null, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
    } catch (error) {
      console.log('Server logout completed or failed, clearing local session');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/auth/profile/update/', data);
    // Update stored user data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return response;
  },

  changePassword: async (data) => {
    const response = await api.post('/auth/change-password/', data);
    // Update token if returned
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  },
};