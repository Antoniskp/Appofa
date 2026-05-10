import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

export const newsletterAPI = {
  subscribe: async (payload) => {
    return apiRequest('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  unsubscribe: async (token) => {
    return apiRequest('/api/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  adminListSubscribers: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/newsletter/admin/subscribers', params));
  },

  adminStats: async () => {
    return apiRequest('/api/newsletter/admin/stats');
  },

  adminAddSubscriber: async (payload) => {
    return apiRequest('/api/newsletter/admin/subscribers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminBulkAddSubscribers: async (payload) => {
    return apiRequest('/api/newsletter/admin/subscribers/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminUpdateSubscriber: async (id, payload) => {
    return apiRequest(`/api/newsletter/admin/subscribers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  adminListCampaigns: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/newsletter/admin/campaigns', params));
  },

  adminCreateCampaign: async (payload) => {
    return apiRequest('/api/newsletter/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminGetCampaign: async (id) => {
    return apiRequest(`/api/newsletter/admin/campaigns/${id}`);
  },

  adminUpdateCampaign: async (id, payload) => {
    return apiRequest(`/api/newsletter/admin/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  adminSendCampaignTest: async (id, payload) => {
    return apiRequest(`/api/newsletter/admin/campaigns/${id}/test-send`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminSendCampaignNow: async (id) => {
    return apiRequest(`/api/newsletter/admin/campaigns/${id}/send`, {
      method: 'POST',
    });
  },

  adminCampaignLogs: async (id, params = {}) => {
    return apiRequest(buildQueryEndpoint(`/api/newsletter/admin/campaigns/${id}/logs`, params));
  },
};
