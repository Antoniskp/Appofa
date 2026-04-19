import { apiRequest } from './client.js';

export const homepageSettingsAPI = {
  get: () => apiRequest('/api/homepage-settings'),
  update: (data) => apiRequest('/api/homepage-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
