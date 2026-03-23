import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

/**
 * Message API methods
 */
export const messageAPI = {
  // Submit a message
  create: async (messageData) => {
    return apiRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // Admin - Get all messages
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/messages', params));
  },

  // Admin - Get single message
  getById: async (id) => {
    return apiRequest(`/api/messages/${id}`);
  },

  // Admin - Update status
  updateStatus: async (id, status) => {
    return apiRequest(`/api/messages/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Admin - Respond to message
  respond: async (id, response, adminNotes = null) => {
    return apiRequest(`/api/messages/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ response, adminNotes }),
    });
  },

  // Admin - Delete message
  delete: async (id) => {
    return apiRequest(`/api/messages/${id}`, {
      method: 'DELETE',
    });
  },
};
