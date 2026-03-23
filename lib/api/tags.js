import { apiRequest } from './client.js';

/**
 * Tags API methods
 */
export const tagAPI = {
  getSuggestions: async () => {
    return apiRequest('/api/tags/suggestions');
  },
};
