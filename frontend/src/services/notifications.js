import api from './api';

export const notificationsApi = {
  getAll: () => api.get('/notifications/'),
  getUnread: () => api.get('/notifications/unread/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  getPreferences: () => api.get('/preferences/'),
  updatePreferences: (data) => api.patch('/preferences/', data),
};