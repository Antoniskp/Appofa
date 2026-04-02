import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

/**
 * Suggestion & Solution API methods
 */
export const suggestionAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/suggestions', params));
  },

  getById: async (id) => {
    return apiRequest(`/api/suggestions/${id}`);
  },

  create: async (data) => {
    return apiRequest('/api/suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/api/suggestions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/suggestions/${id}`, {
      method: 'DELETE',
    });
  },

  getSolutions: async (suggestionId) => {
    return apiRequest(`/api/suggestions/${suggestionId}/solutions`);
  },

  createSolution: async (suggestionId, data) => {
    return apiRequest(`/api/suggestions/${suggestionId}/solutions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  voteSuggestion: async (suggestionId, value) => {
    return apiRequest(`/api/suggestions/${suggestionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  },

  voteSolution: async (solutionId, value) => {
    return apiRequest(`/api/solutions/${solutionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  },

  getCategoryCounts: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/suggestions/category-counts', params));
  },
};
