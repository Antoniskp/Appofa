import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

/**
 * Location API methods
 */
export const locationAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/locations', params));
  },
  
  getById: async (id) => {
    return apiRequest(`/api/locations/${id}`);
  },
  
  create: async (locationData) => {
    return apiRequest('/api/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  },
  
  update: async (id, locationData) => {
    return apiRequest(`/api/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/api/locations/${id}`, {
      method: 'DELETE',
    });
  },
  
  link: async (entityType, entityId, locationId) => {
    return apiRequest('/api/locations/link', {
      method: 'POST',
      body: JSON.stringify({ 
        entity_type: entityType, 
        entity_id: entityId, 
        location_id: locationId 
      }),
    });
  },
  
  unlink: async (entityType, entityId, locationId) => {
    return apiRequest('/api/locations/unlink', {
      method: 'POST',
      body: JSON.stringify({ 
        entity_type: entityType, 
        entity_id: entityId, 
        location_id: locationId 
      }),
    });
  },
  
  getEntityLocations: async (entityType, entityId) => {
    return apiRequest(`/api/locations/${entityType}/${entityId}/locations`);
  },
  
  getLocationEntities: async (id) => {
    return apiRequest(`/api/locations/${id}/entities`);
  },
};

/**
 * Location Request API methods
 */
export const locationRequestAPI = {
  create: async (requestData) => {
    return apiRequest('/api/locations/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/locations/requests', params));
  },

  update: async (id, data) => {
    return apiRequest(`/api/locations/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Location Section API methods
 */
export const locationSectionAPI = {
  getSections: async (locationId) => {
    return apiRequest(`/api/locations/${locationId}/sections`);
  },

  createSection: async (locationId, sectionData) => {
    return apiRequest(`/api/locations/${locationId}/sections`, {
      method: 'POST',
      body: JSON.stringify(sectionData),
    });
  },

  updateSection: async (locationId, sectionId, sectionData) => {
    return apiRequest(`/api/locations/${locationId}/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(sectionData),
    });
  },

  deleteSection: async (locationId, sectionId) => {
    return apiRequest(`/api/locations/${locationId}/sections/${sectionId}`, {
      method: 'DELETE',
    });
  },

  reorderSections: async (locationId, order) => {
    return apiRequest(`/api/locations/${locationId}/sections/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ order }),
    });
  },
};
