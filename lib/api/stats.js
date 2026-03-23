import { apiRequest } from './client.js';

/**
 * Stats API methods
 */
export const statsAPI = {
  getCommunityStats: async () => {
    return apiRequest('/api/stats/community');
  },

  getUserHomeLocation: async () => {
    return apiRequest('/api/stats/user/home-location');
  },
};
