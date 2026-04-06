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
  // Admin methods
  getAllAdmin: () => apiRequest('/api/manifests/admin'),
  create: (data) => apiRequest('/api/manifests', { method: 'POST', body: JSON.stringify(data) }),
  update: (slug, data) => apiRequest(`/api/manifests/${encodeURIComponent(slug)}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (slug) => apiRequest(`/api/manifests/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
};
