import { apiRequest } from './client.js';

/**
 * Admin API methods
 */
export const adminAPI = {
  getHealthStatus: async () => {
    return apiRequest('/api/admin/health');
  },

  getWorkerHealthStatus: async () => {
    return apiRequest('/api/admin/worker-status/health');
  },

  sendWorkerTestSnapshot: async (snapshot = null) => {
    return apiRequest('/api/admin/worker-status/test-snapshot', {
      method: 'POST',
      body: JSON.stringify({ snapshot }),
    });
  },

  listWorkerTokens: async () => {
    return apiRequest('/api/admin/worker-tokens');
  },

  createWorkerToken: async (data) => {
    return apiRequest('/api/admin/worker-tokens', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  revokeWorkerToken: async (tokenId) => {
    return apiRequest(`/api/admin/worker-tokens/${tokenId}/revoke`, {
      method: 'POST',
    });
  },
};
