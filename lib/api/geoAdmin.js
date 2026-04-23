import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const geoAdminAPI = {
  trackVisit: async (data) =>
    apiRequest('/api/admin/geo-stats/track', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getVisits: async (params = {}) =>
    apiRequest(buildQueryEndpoint('/api/admin/geo-stats/visits', params)),

  clearVisitsOlderThan: async (olderThanDays) =>
    apiRequest(buildQueryEndpoint('/api/admin/geo-stats/visits', { olderThanDays }), {
      method: 'DELETE',
    }),

  getCountries: async () =>
    apiRequest('/api/admin/geo-stats/countries'),

  listFunding: async () =>
    apiRequest('/api/admin/geo-stats/country-funding'),

  createFunding: async (data) =>
    apiRequest('/api/admin/geo-stats/country-funding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFunding: async (id, data) =>
    apiRequest(`/api/admin/geo-stats/country-funding/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFunding: async (id) =>
    apiRequest(`/api/admin/geo-stats/country-funding/${id}`, {
      method: 'DELETE',
    }),
};
