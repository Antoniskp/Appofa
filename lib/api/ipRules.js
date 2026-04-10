import { apiRequest } from './client';

export const listIpRules = () => apiRequest('/api/admin/ip-rules');

export const addIpRule = (ip, type, reason) =>
  apiRequest('/api/admin/ip-rules', { method: 'POST', body: JSON.stringify({ ip, type, reason }) });

export const removeIpRule = (ip) =>
  apiRequest(`/api/admin/ip-rules/${encodeURIComponent(ip)}`, { method: 'DELETE' });

export const checkIpRule = (ip) =>
  apiRequest('/api/admin/ip-rules/check', { method: 'POST', body: JSON.stringify({ ip }) });
