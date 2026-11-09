import { apiRequest } from './client';
export const issueFollowAPI = {
  list: (page = 1) => apiRequest(`/api/issue-follows?page=${page}`),
  status: (type, id) => apiRequest(`/api/issue-follows/${type}/${id}`),
  set: (type, id, following) => apiRequest(`/api/issue-follows/${type}/${id}`, { method: 'PUT', body: JSON.stringify({ following }) }),
  getDigestPreference: () => apiRequest('/api/issue-follows/digest-preference'),
  updateDigestPreference: (enabled, locale) => apiRequest('/api/issue-follows/digest-preference', { method: 'PUT', body: JSON.stringify({ enabled, locale }) }),
  unsubscribeDigest: (token) => apiRequest('/api/issue-follows/digest-unsubscribe', { method: 'POST', body: JSON.stringify({ token }) }),
};
