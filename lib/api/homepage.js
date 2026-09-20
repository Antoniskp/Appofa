import { apiRequest } from './client.js';

export const homepageAPI = {
  get: (locationId) => apiRequest(locationId ? `/api/homepage?locationId=${encodeURIComponent(locationId)}` : '/api/homepage'),
};
