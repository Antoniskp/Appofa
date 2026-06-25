import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const mediaAPI = {
  list: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/media', params));
  },

  uploadArticleImage: async (file, fields = {}) => {
    const formData = new FormData();
    formData.append('image', file);

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    return apiRequest('/api/media/articles/images', {
      method: 'POST',
      body: formData,
    });
  },
};
