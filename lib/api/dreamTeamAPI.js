import { apiRequest } from './client.js';

/**
 * Dream Team Government API methods
 */
export const dreamTeamAPI = {
  getPositions: () => apiRequest('/api/dream-team/positions'),

  vote: (positionId, personId) =>
    apiRequest('/api/dream-team/vote', {
      method: 'POST',
      body: JSON.stringify({ positionId, personId }),
    }),

  getResults: () => apiRequest('/api/dream-team/results'),

  getMyVotes: () => apiRequest('/api/dream-team/my-votes'),
};
