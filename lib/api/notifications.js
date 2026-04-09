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
  getPreferences: () => apiRequest('/api/notifications/preferences', { method: 'GET' }),
  updatePreferences: (preferences) => apiRequest('/api/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  }),
  broadcast: ({ title, body, actionUrl, targetRole }) => apiRequest('/api/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify({ title, body, actionUrl, targetRole }),
  }),
};
