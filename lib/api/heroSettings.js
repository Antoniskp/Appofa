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
  getSlides: () => apiRequest('/api/hero-settings/slides'),
  createSlide: (data) =>
    apiRequest('/api/hero-settings/slides', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSlide: (id, data) =>
    apiRequest(`/api/hero-settings/slides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSlide: (id) =>
    apiRequest(`/api/hero-settings/slides/${id}`, {
      method: 'DELETE',
    }),
  toggleSlide: (id) =>
    apiRequest(`/api/hero-settings/slides/${id}/toggle`, {
      method: 'PATCH',
    }),
  reorderSlides: (updates) =>
    apiRequest('/api/hero-settings/slides/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    }),
};
