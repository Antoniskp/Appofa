import { apiRequest } from './client.js';

/**
 * Dream Team Government API methods
 */
export const dreamTeamAPI = {
  getCountries: () => apiRequest('/api/dream-team/countries'),

  getPositions: (countryCode = 'GR') =>
    apiRequest(`/api/dream-team/positions?countryCode=${encodeURIComponent(countryCode.toUpperCase())}`),

  vote: (positionId, candidateUserId) =>
    apiRequest('/api/dream-team/vote', {
      method: 'POST',
      body: JSON.stringify({ positionId, candidateUserId }),
    }),

  getResults: (countryCode = 'GR') =>
    apiRequest(`/api/dream-team/results?countryCode=${encodeURIComponent(countryCode.toUpperCase())}`),

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

  // ── Formations ──────────────────────────────────────────────────────────────

  getMyFormations: () => apiRequest('/api/dream-team/formations'),

  createFormation: (data) =>
    apiRequest('/api/dream-team/formations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFormation: (id) => apiRequest(`/api/dream-team/formations/${id}`),

  updateFormation: (id, data) =>
    apiRequest(`/api/dream-team/formations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFormation: (id) =>
    apiRequest(`/api/dream-team/formations/${id}`, { method: 'DELETE' }),

  updateFormationPicks: (id, picks) =>
    apiRequest(`/api/dream-team/formations/${id}/picks`, {
      method: 'POST',
      body: JSON.stringify({ picks }),
    }),

  getPublicFormations: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/dream-team/formations/public${query ? '?' + query : ''}`);
  },

  likeFormation: (id) =>
    apiRequest(`/api/dream-team/formations/${id}/like`, { method: 'POST' }),

  getSharedFormation: (slug) =>
    apiRequest(`/api/dream-team/formations/share/${slug}`),

  getPopularPicks: () =>
    apiRequest('/api/dream-team/formations/popular-picks'),

  getFormationOfTheWeek: () =>
    apiRequest('/api/dream-team/formations/formation-of-the-week'),

  getLeaderboard: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/dream-team/formations/leaderboard${query ? '?' + query : ''}`);
  },

  getUserStats: () =>
    apiRequest('/api/dream-team/formations/my-stats'),

  getActivityFeed: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/dream-team/formations/activity${query ? '?' + query : ''}`);
  },
};
