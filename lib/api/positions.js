import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

const write = (path, method, data) => apiRequest('/api/positions' + path, { method, body: JSON.stringify(data) });
export const positionAPI = {
  metadata: params => apiRequest(buildQueryEndpoint('/api/positions/metadata', params)),
  list: params => apiRequest(buildQueryEndpoint('/api/positions', params)),
  summary: id => apiRequest('/api/positions/organizations/' + id + '/summary'),
  detail: id => apiRequest('/api/positions/' + id),
  history: id => apiRequest('/api/positions/' + id + '/history'),
  create: (organizationId, data) => write('/organizations/' + organizationId, 'POST', data),
  revise: (id, data) => write('/' + id + '/revisions', 'POST', data),
  save: (id, data) => write('/revisions/' + id, 'PUT', data),
  publish: id => write('/revisions/' + id + '/publish', 'POST', { sourcesVerified: true }),
  reject: (id, reviewNote) => write('/revisions/' + id + '/reject', 'POST', { reviewNote }),
  status: (id, status) => write('/' + id + '/status', 'PATCH', { status }),
  vote: (id, value) => write('/revisions/' + id + '/vote', 'PUT', { value }),
  createCategory: data => write('/categories', 'POST', data),
};
