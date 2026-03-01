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

  const contentType = response.headers?.get('content-type') || '';
  const text = await response.text();
  let data;
  if (contentType.includes('application/json') && text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  } else {
    data = text;
  }

  if (!response.ok) {
    const message = (typeof data === 'object' && data !== null && data.message)
      ? data.message
      : `Request failed (${response.status})`;
    throw new Error(message);
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
  updateUserRole: async (id, role, locationId = undefined) => {
    const payload = { role };
    if (locationId !== undefined && locationId !== null && locationId !== '') {
      payload.locationId = locationId;
    }

    return apiRequest(`/api/auth/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(payload),
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
  getPublicUserProfile: async (id) => {
    return apiRequest(`/api/auth/users/${id}/public`);
  },
  getPublicUserProfileByUsername: async (username) => {
    return apiRequest(`/api/auth/users/username/${encodeURIComponent(username)}/public`);
  },
  getPublicUserStats: async () => {
    return apiRequest('/api/auth/users/public-stats');
  },
  followUser: async (id) => {
    return apiRequest(`/api/users/${id}/follow`, { method: 'POST' });
  },
  unfollowUser: async (id) => {
    return apiRequest(`/api/users/${id}/follow`, { method: 'DELETE' });
  },
  isFollowing: async (id) => {
    return apiRequest(`/api/users/${id}/follow/status`);
  },
  getFollowCounts: async (id) => {
    return apiRequest(`/api/users/${id}/follow/counts`);
  },
  getFollowers: async (id, params = {}) => {
    return apiRequest(buildQueryEndpoint(`/api/users/${id}/followers`, params));
  },
  getFollowing: async (id, params = {}) => {
    return apiRequest(buildQueryEndpoint(`/api/users/${id}/following`, params));
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
 * Bookmark API methods
 */
export const bookmarkAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/bookmarks', params));
  },
  getCount: async (entityType, entityId) => {
    return apiRequest(buildQueryEndpoint('/api/bookmarks/count', {
      entity_type: entityType,
      entity_id: entityId
    }));
  },
  getStatus: async (entityType, entityId) => {
    return apiRequest(buildQueryEndpoint('/api/bookmarks/status', {
      entity_type: entityType,
      entity_id: entityId
    }));
  },
  toggle: async (entityType, entityId) => {
    return apiRequest('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId
      })
    });
  }
};

/**
 * Poll API methods
 */
export const pollAPI = {
  getAll: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/polls', params));
  },

  getMyVotedPolls: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/polls/my-voted', params));
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

/**
 * Stats API methods
 */
export const statsAPI = {
  getCommunityStats: async () => {
    return apiRequest('/api/stats/community');
  },
  
  getUserHomeLocation: async () => {
    return apiRequest('/api/stats/user/home-location');
  },
};
