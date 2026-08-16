import { apiRequest } from './client.js';

export const homepageAPI = {
  get: () => apiRequest('/api/homepage'),
};
