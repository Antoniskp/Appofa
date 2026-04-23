import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const officialPostsAPI = {
  getAll: async (params = {}) => apiRequest(buildQueryEndpoint('/api/official-posts', params)),
};
