import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const topicAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/topics', params));
  },

  getBySlug: async (slug, params = {}) => {
    return apiRequest(buildQueryEndpoint(`/api/topics/${encodeURIComponent(slug)}`, params));
  },

  create: async (data) => {
    return apiRequest('/api/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/api/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
