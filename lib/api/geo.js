import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const geoAPI = {
  searchAddress: (q, locationId) => apiRequest(buildQueryEndpoint('/api/geo/search', { q, locationId })),
  detect: async () => {
    return apiRequest('/api/geo/detect');
  },
  getCountryFunding: async (locationId) => {
    return apiRequest(`/api/admin/geo-stats/country-funding/${locationId}/public`);
  },
};
