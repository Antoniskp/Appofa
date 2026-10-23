import { apiRequest } from './client';
export const issueFollowAPI = {
  list: (page = 1) => apiRequest(`/api/issue-follows?page=${page}`),
  status: (type, id) => apiRequest(`/api/issue-follows/${type}/${id}`),
  set: (type, id, following) => apiRequest(`/api/issue-follows/${type}/${id}`, { method: 'PUT', body: JSON.stringify({ following }) }),
};
