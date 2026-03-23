import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

/**
 * Bookmark API methods
 */
export const bookmarkAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/bookmarks', params));
  },
  getCount: async (entityType, entityId) => {
    return apiRequest(buildQueryEndpoint('/api/bookmarks/count', {
      entity_type: entityType,
      entity_id: entityId
    }));
  },
  getStatus: async (entityType, entityId) => {
    return apiRequest(buildQueryEndpoint('/api/bookmarks/status', {
      entity_type: entityType,
      entity_id: entityId
    }));
  },
  toggle: async (entityType, entityId) => {
    return apiRequest('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId
      })
    });
  }
};
