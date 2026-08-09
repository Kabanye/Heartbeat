import api from './api';

export const notificationsApi = {
  getAll: () => api.get('/notifications/'),
  getUnread: () => api.get('/notifications/unread/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  
  getPreferences: () => api.get('/preferences/'),
  
  updatePreferences: async (data) => {
    // First get preferences to find the ID
    const res = await api.get('/preferences/');
    const id = res.data?.id;
    
    if (id) {
      // PATCH the specific preference by ID
      return api.patch(`/preferences/${id}/`, data);
    }
    
    // Fallback: if no preferences exist yet, try POST
    throw new Error('Preferences not found. Please try again.');
  },
};