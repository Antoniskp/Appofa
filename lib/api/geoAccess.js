import { apiRequest } from './client.js';

export const listCountryRules = () => apiRequest('/api/admin/geo-access/rules');

export const addCountryRule = (countryCode, reason, redirectPath) =>
  apiRequest('/api/admin/geo-access/rules', {
    method: 'POST',
    body: JSON.stringify({ countryCode, reason, redirectPath }),
  });

export const removeCountryRule = (code) =>
  apiRequest(`/api/admin/geo-access/rules/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });

export const getSettings = () => apiRequest('/api/admin/geo-access/settings');

export const updateSetting = (key, value) =>
  apiRequest('/api/admin/geo-access/settings', {
    method: 'PUT',
    body: JSON.stringify({ key, value }),
  });
