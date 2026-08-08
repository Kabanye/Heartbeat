import api from './api';

export const servicesApi = {
  getAll: () => api.get('/services/'),
  getById: (id) => api.get(`/services/${id}/`),
  create: (data) => api.post('/services/', data),
  update: (id, data) => api.patch(`/services/${id}/`, data),
  delete: (id) => api.delete(`/services/${id}/`),
  toggle: (id) => api.post(`/services/${id}/toggle/`),
  testConnection: (id) => api.post(`/services/${id}/test_connection/`),
};