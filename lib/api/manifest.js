import { apiRequest } from './client.js';

export const manifestAPI = {
  getAll: () => apiRequest('/api/manifests'),
  getSupporters: (slug, params = {}) =>
    apiRequest(`/api/manifests/${encodeURIComponent(slug)}/supporters?${new URLSearchParams(params)}`),
  getRandomSupporters: (slug, limit = 8) =>
    apiRequest(`/api/manifests/${encodeURIComponent(slug)}/supporters/random?limit=${limit}`),
  getMyAcceptances: () => apiRequest('/api/manifests/my-acceptances'),
  accept: (slug) =>
    apiRequest(`/api/manifests/${encodeURIComponent(slug)}/accept`, { method: 'PUT' }),
  withdraw: (slug) =>
    apiRequest(`/api/manifests/${encodeURIComponent(slug)}/accept`, { method: 'DELETE' }),
};
