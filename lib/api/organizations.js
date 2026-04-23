import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const organizationAPI = {
  getAll: async (params = {}) => apiRequest(buildQueryEndpoint('/api/organizations', params)),

  getBySlug: async (slug) => apiRequest(`/api/organizations/${slug}`),

  create: async (data) => apiRequest('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: async (id, data) => apiRequest(`/api/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: async (id) => apiRequest(`/api/organizations/${id}`, {
    method: 'DELETE',
  }),

  getMembers: async (id) => apiRequest(`/api/organizations/${id}/members`),
};
