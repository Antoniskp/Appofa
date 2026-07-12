import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const mediaAPI = {
  list: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/media', params));
  },

  getById: async (id) => {
    return apiRequest(`/api/media/${id}`);
  },

  upload: async (file, fields = {}) => {
    const formData = new FormData();
    formData.append('image', file);

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    return apiRequest('/api/media/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadArticleImage: async (file, fields = {}) => {
    return mediaAPI.upload(file, {
      usageType: 'article_cover',
      entityType: 'article',
      ...fields,
    });
  },

  update: async (id, payload) => {
    return apiRequest(`/api/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  remove: async (id, force = false) => {
    const endpoint = force ? `/api/media/${id}?force=true` : `/api/media/${id}`;
    return apiRequest(endpoint, {
      method: 'DELETE',
    });
  },

  getAdminStats: async () => {
    return apiRequest('/api/media/admin/stats');
  },

  getAdminCleanupReport: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/media/admin/cleanup-report', params));
  },

  runAdminCleanup: async (payload = {}) => {
    return apiRequest('/api/media/admin/cleanup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
