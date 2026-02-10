/**
 * API client for backend communication
 */

import { buildQueryEndpoint } from './utils/queryString.js';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }

  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

/**
 * Get cookie value for internal use.
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null;

  const nameValue = `${name}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(nameValue) === 0) {
      return cookie.substring(nameValue.length, cookie.length);
    }
  }
  return null;
}

export function getCsrfToken() {
  return getCookie('csrf_token');
}

/**
 * Make API request
 */
export async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.method && options.method !== 'GET' && options.method !== 'HEAD' && options.method !== 'OPTIONS') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }
  
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
}

/**
 * Auth API methods
 */
export const authAPI = {
  register: async (userData) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  login: async (credentials) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  getProfile: async () => {
    return apiRequest('/api/auth/profile');
  },
  
  updateProfile: async (profileData) => {
    return apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  
  updatePassword: async (passwordData) => {
    return apiRequest('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },
  getUsers: async () => {
    return apiRequest('/api/auth/users');
  },
  updateUserRole: async (id, role) => {
    return apiRequest(`/api/auth/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },
  getOAuthConfig: async () => {
    return apiRequest('/api/auth/oauth/config');
  },
  initiateGithubOAuth: async (mode = 'login') => {
    return apiRequest(`/api/auth/github?mode=${mode}`);
  },
  unlinkGithub: async () => {
    return apiRequest('/api/auth/github/unlink', {
      method: 'DELETE',
    });
  },
  initiateGoogleOAuth: async (mode = 'login') => {
    return apiRequest(`/api/auth/google?mode=${mode}`);
  },
  unlinkGoogle: async () => {
    return apiRequest('/api/auth/google/unlink', {
      method: 'DELETE',
    });
  },
  logout: async () => {
    return apiRequest('/api/auth/logout', {
      method: 'POST'
    });
  },
  searchUsers: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/auth/users/search', params));
  },
  getPublicUserStats: async () => {
    return apiRequest('/api/auth/users/public-stats');
  }
};

/**
 * Admin API methods
 */
export const adminAPI = {
  getHealthStatus: async () => {
    return apiRequest('/api/admin/health');
  },
};

/**
 * Article API methods
 */
export const articleAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/articles', params));
  },
  
  getById: async (id) => {
    return apiRequest(`/api/articles/${id}`);
  },
  
  create: async (articleData) => {
    return apiRequest('/api/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  },
  
  update: async (id, articleData) => {
    return apiRequest(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/api/articles/${id}`, {
      method: 'DELETE',
    });
  },
  
  approveNews: async (id) => {
    return apiRequest(`/api/articles/${id}/approve-news`, {
      method: 'POST',
    });
  },
};

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
 * Poll API methods
 */
export const pollAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/polls', params));
  },
  
  getById: async (id) => {
    return apiRequest(`/api/polls/${id}`);
  },
  
  create: async (pollData) => {
    return apiRequest('/api/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    });
  },
  
  update: async (id, pollData) => {
    return apiRequest(`/api/polls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pollData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/api/polls/${id}`, {
      method: 'DELETE',
    });
  },
  
  vote: async (id, optionId) => {
    return apiRequest(`/api/polls/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  },
  
  addOption: async (id, optionData) => {
    return apiRequest(`/api/polls/${id}/options`, {
      method: 'POST',
      body: JSON.stringify(optionData),
    });
  },
  
  getResults: async (id) => {
    return apiRequest(`/api/polls/${id}/results`);
  },
};
