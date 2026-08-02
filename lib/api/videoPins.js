import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const videoPinAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/video-pins', params));
  },

  create: async (data) => {
    return apiRequest('/api/video-pins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/api/video-pins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove: async (id) => {
    return apiRequest(`/api/video-pins/${id}`, {
      method: 'DELETE',
    });
  },
};
