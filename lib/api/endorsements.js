import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

/**
 * Endorsement API methods
 */
export const endorsementAPI = {
  getTopics: async () => {
    return apiRequest('/api/endorsements/topics');
  },

  getLeaderboard: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/endorsements/leaderboard', params));
  },

  getStatus: async (userId) => {
    return apiRequest(`/api/endorsements/status?userId=${userId}`);
  },

  endorse: async (endorsedUserId, topic) => {
    return apiRequest('/api/endorsements', {
      method: 'POST',
      body: JSON.stringify({ endorsedUserId, topic }),
    });
  },

  removeEndorsement: async (endorsedUserId, topic) => {
    return apiRequest('/api/endorsements', {
      method: 'DELETE',
      body: JSON.stringify({ endorsedUserId, topic }),
    });
  },
};
