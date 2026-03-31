import { apiRequest } from './client.js';

/**
 * Dream Team Government API methods
 */
export const dreamTeamAPI = {
  getPositions: () => apiRequest('/api/dream-team/positions'),

  vote: (positionId, personId, candidateUserId) =>
    apiRequest('/api/dream-team/vote', {
      method: 'POST',
      body: JSON.stringify({ positionId, personId, candidateUserId }),
    }),

  getResults: () => apiRequest('/api/dream-team/results'),

  getMyVotes: () => apiRequest('/api/dream-team/my-votes'),

  deleteVote: (positionId) =>
    apiRequest(`/api/dream-team/vote/${positionId}`, { method: 'DELETE' }),

  // ── Admin ──────────────────────────────────────────────────────────────────

  adminGetPositions: () => apiRequest('/api/admin/dream-team/positions'),

  adminCreateSuggestion: (data) =>
    apiRequest('/api/admin/dream-team/suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateSuggestion: (id, data) =>
    apiRequest(`/api/admin/dream-team/suggestions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteSuggestion: (id) =>
    apiRequest(`/api/admin/dream-team/suggestions/${id}`, { method: 'DELETE' }),

  adminCreateHolder: (data) =>
    apiRequest('/api/admin/dream-team/holders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateHolder: (id, data) =>
    apiRequest(`/api/admin/dream-team/holders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteHolder: (id) =>
    apiRequest(`/api/admin/dream-team/holders/${id}`, { method: 'DELETE' }),
};
