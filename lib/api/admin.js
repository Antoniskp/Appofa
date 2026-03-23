import { apiRequest } from './client.js';

/**
 * Admin API methods
 */
export const adminAPI = {
  getHealthStatus: async () => {
    return apiRequest('/api/admin/health');
  },
};
