import { apiRequest } from './client.js';

/**
 * Hero Settings API methods.
 * Slides have no `order` field — array position is the canonical order.
 * All mutation endpoints return the full slides array so the frontend can
 * replace its state atomically without drift.
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
  /** @param {string[]} ids - Ordered array of all slide ids */
  reorderSlides: (ids) =>
    apiRequest('/api/hero-settings/slides/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
};
