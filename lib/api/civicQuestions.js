import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const civicQuestionAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/civic-questions', params));
  },

  getById: async (id) => {
    return apiRequest(`/api/civic-questions/${id}`);
  },

  create: async (data) => {
    return apiRequest('/api/civic-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/api/civic-questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/civic-questions/${id}`, {
      method: 'DELETE',
    });
  },

  vote: async (id, choice) => {
    return apiRequest(`/api/civic-questions/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ choice }),
    });
  },

  getResults: async (id) => {
    return apiRequest(`/api/civic-questions/${id}/results`);
  },
};
