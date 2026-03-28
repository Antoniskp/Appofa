import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const personAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/persons', params));
  },

  getBySlug: async (slug) => {
    return apiRequest(`/api/persons/${slug}`);
  },

  apply: async (data) => {
    return apiRequest('/api/persons/apply', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMyApplication: async () => {
    return apiRequest('/api/persons/my-application');
  },

  getDashboard: async () => {
    return apiRequest('/api/persons/dashboard');
  },

  createProfile: async (data) => {
    return apiRequest('/api/persons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateProfile: async (id, data) => {
    return apiRequest(`/api/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteProfile: async (id) => {
    return apiRequest(`/api/persons/${id}`, {
      method: 'DELETE'
    });
  },

  submitClaim: async (id, data) => {
    return apiRequest(`/api/persons/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getPendingApplications: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/persons/applications', params));
  },

  getApplicationById: async (id) => {
    return apiRequest(`/api/persons/applications/${id}`);
  },

  approveApplication: async (id) => {
    return apiRequest(`/api/persons/applications/${id}/approve`, {
      method: 'POST'
    });
  },

  rejectApplication: async (id, data) => {
    return apiRequest(`/api/persons/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getPendingClaims: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/persons/claims', params));
  },

  approveClaim: async (id) => {
    return apiRequest(`/api/persons/claims/${id}/approve`, {
      method: 'POST'
    });
  },

  rejectClaim: async (id, data) => {
    return apiRequest(`/api/persons/claims/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getById: async (id) => {
    return apiRequest(`/api/persons/profile/${id}`);
  },

  appointAsCandidate: async (id, data) => {
    return apiRequest(`/api/persons/${id}/appoint`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  retireCandidate: async (id) => {
    return apiRequest(`/api/persons/${id}/retire`, {
      method: 'POST'
    });
  }
};
