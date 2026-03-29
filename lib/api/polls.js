import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

/**
 * Poll API methods
 */
export const pollAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/polls', params));
  },

  getMyVotedPolls: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/polls/my-voted', params));
  },

  getById: async (id) => {
    return apiRequest(`/api/polls/${id}`);
  },
  
  create: async (pollData) => {
    return apiRequest('/api/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    });
  },
  
  update: async (id, pollData) => {
    return apiRequest(`/api/polls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pollData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/api/polls/${id}`, {
      method: 'DELETE',
    });
  },
  
  vote: async (id, optionId) => {
    return apiRequest(`/api/polls/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  },
  
  addOption: async (id, optionData) => {
    return apiRequest(`/api/polls/${id}/options`, {
      method: 'POST',
      body: JSON.stringify(optionData),
    });
  },
  
  getResults: async (id) => {
    return apiRequest(`/api/polls/${id}/results`);
  },

  exportData: async (id) => {
    return apiRequest(`/api/polls/${id}/export`);
  },

  getCategoryCounts: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/polls/category-counts', params));
  },
};
