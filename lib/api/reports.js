import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const reportAPI = {
  submit: async (data) => apiRequest('/api/reports', { method: 'POST', body: JSON.stringify(data) }),
  getAll: async (params = {}) => apiRequest(buildQueryEndpoint('/api/reports', params)),
  getById: async (id) => apiRequest(`/api/reports/${id}`),
  getByContent: async (contentType, contentId) => apiRequest(`/api/reports/content/${contentType}/${contentId}`),
  review: async (id, data) => apiRequest(`/api/reports/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
};
