import { apiRequest } from './client.js';

export const badgeAPI = {
  getMyProgress: () => apiRequest('/api/badges/my'),
  getUserBadges: (userId) => apiRequest(`/api/badges/user/${userId}`),
  evaluate: () => apiRequest('/api/badges/evaluate', { method: 'POST' }),
};
