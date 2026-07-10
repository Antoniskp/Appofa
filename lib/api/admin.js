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

  // Returns aggregated onboarding funnel metrics (admin-only)
  getOnboardingFunnel: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.goal) qs.set('goal', params.goal);
    const query = qs.toString();
    return apiRequest(`/api/admin/onboarding/funnel${query ? `?${query}` : ''}`);
  },

  // Returns concise onboarding context for a specific user (admin/moderator review UIs)
  getUserOnboardingContext: async (userId) => {
    return apiRequest(`/api/admin/users/${userId}/onboarding-context`);
  },
};
