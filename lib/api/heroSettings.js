import { apiRequest } from './client.js';

/**
 * Hero Settings API methods
 */
export const heroSettingsAPI = {
  get: () => apiRequest('/api/hero-settings'),
  update: (data) =>
    apiRequest('/api/hero-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
