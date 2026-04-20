import { apiRequest } from './client.js';

export const geoAPI = {
  detect: async () => {
    return apiRequest('/api/geo/detect');
  },
  getCountryFunding: async (locationId) => {
    return apiRequest(`/api/admin/geo-stats/country-funding/${locationId}/public`);
  },
};
