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

  join: async (id) => apiRequest(`/api/organizations/${id}/join`, {
    method: 'POST',
  }),

  leave: async (id) => apiRequest(`/api/organizations/${id}/leave`, {
    method: 'DELETE',
  }),

  inviteMember: async (id, userId) => apiRequest(`/api/organizations/${id}/members/invite`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),

  approveMember: async (id, userId) => apiRequest(`/api/organizations/${id}/members/${userId}/approve`, {
    method: 'PATCH',
  }),

  removeMember: async (id, userId) => apiRequest(`/api/organizations/${id}/members/${userId}`, {
    method: 'DELETE',
  }),

  updateMemberRole: async (id, userId, role) => apiRequest(`/api/organizations/${id}/members/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }),

  getPendingMembers: async (id) => apiRequest(`/api/organizations/${id}/members/pending`),

  getPolls: async (id, params = {}) => apiRequest(buildQueryEndpoint(`/api/organizations/${id}/polls`, params)),

  createPoll: async (id, data) => apiRequest(`/api/organizations/${id}/polls`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getSuggestions: async (id, params = {}) => apiRequest(buildQueryEndpoint(`/api/organizations/${id}/suggestions`, params)),

  createSuggestion: async (id, data) => apiRequest(`/api/organizations/${id}/suggestions`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
