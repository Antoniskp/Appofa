import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const candidateRegistrationAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/candidate-registrations', params));
  },

  getMine: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/candidate-registrations/mine', params));
  },

  getById: async (id) => {
    return apiRequest(`/api/candidate-registrations/${id}`);
  },

  create: async (data) => {
    return apiRequest('/api/candidate-registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/api/candidate-registrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  archive: async (id) => {
    return apiRequest(`/api/candidate-registrations/${id}`, {
      method: 'DELETE',
    });
  },
};
