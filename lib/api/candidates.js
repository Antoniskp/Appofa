import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const candidateAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/candidates', params));
  },

  getBySlug: async (slug) => {
    return apiRequest(`/api/candidates/${slug}`);
  },

  apply: async (data) => {
    return apiRequest('/api/candidates/apply', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMyApplication: async () => {
    return apiRequest('/api/candidates/my-application');
  },

  getDashboard: async () => {
    return apiRequest('/api/candidates/dashboard');
  },

  createProfile: async (data) => {
    return apiRequest('/api/candidates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateProfile: async (id, data) => {
    return apiRequest(`/api/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteProfile: async (id) => {
    return apiRequest(`/api/candidates/${id}`, {
      method: 'DELETE'
    });
  },

  submitClaim: async (id, data) => {
    return apiRequest(`/api/candidates/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getPendingApplications: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/candidates/applications', params));
  },

  getApplicationById: async (id) => {
    return apiRequest(`/api/candidates/applications/${id}`);
  },

  approveApplication: async (id) => {
    return apiRequest(`/api/candidates/applications/${id}/approve`, {
      method: 'POST'
    });
  },

  rejectApplication: async (id, data) => {
    return apiRequest(`/api/candidates/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getPendingClaims: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/candidates/claims', params));
  },

  approveClaim: async (id) => {
    return apiRequest(`/api/candidates/claims/${id}/approve`, {
      method: 'POST'
    });
  },

  rejectClaim: async (id, data) => {
    return apiRequest(`/api/candidates/claims/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
