import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const personRemovalRequestAPI = {
  submit: async (data) => apiRequest('/api/person-removal-requests', { method: 'POST', body: JSON.stringify(data) }),
  getAll: async (params = {}) => apiRequest(buildQueryEndpoint('/api/person-removal-requests', params)),
  getById: async (id) => apiRequest(`/api/person-removal-requests/${id}`),
  review: async (id, data) => apiRequest(`/api/person-removal-requests/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
};
