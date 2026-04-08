import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

/**
 * Tags API methods
 */
export const tagAPI = {
  getSuggestions: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/tags/suggestions', params));
  },
};
