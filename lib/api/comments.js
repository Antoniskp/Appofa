import { apiRequest } from './client.js';

/**
 * Comment API methods
 */
export const commentAPI = {
  getComments: async (entityType, entityId) => {
    return apiRequest(`/api/comments?entityType=${entityType}&entityId=${entityId}`);
  },
  createComment: async (data) => {
    return apiRequest('/api/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  hideComment: async (id) => {
    return apiRequest(`/api/comments/${id}/hide`, { method: 'PATCH' });
  },
  unhideComment: async (id) => {
    return apiRequest(`/api/comments/${id}/unhide`, { method: 'PATCH' });
  },
  deleteComment: async (id) => {
    return apiRequest(`/api/comments/${id}`, { method: 'DELETE' });
  },
  updateArticleCommentSettings: async (id, settings) => {
    return apiRequest(`/api/articles/${id}/comment-settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
  updatePollCommentSettings: async (id, settings) => {
    return apiRequest(`/api/polls/${id}/comment-settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
  updateUserProfileCommentSettings: async (id, settings) => {
    return apiRequest(`/api/users/${id}/profile-comment-settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
};
