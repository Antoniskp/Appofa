import { apiRequest } from './client.js';

export const notificationAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/notifications${query ? '?' + query : ''}`, { method: 'GET' });
  },
  getUnreadCount: () => apiRequest('/api/notifications/unread-count', { method: 'GET' }),
  markAsRead:     (id) => apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead:  () => apiRequest('/api/notifications/read-all', { method: 'PUT' }),
  delete:         (id) => apiRequest(`/api/notifications/${id}`, { method: 'DELETE' }),
};
