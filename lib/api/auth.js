import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

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
  refreshCsrf: async () => {
    return apiRequest('/api/auth/csrf');
  },
  deleteAccount: async ({ password, mode }) => {
    return apiRequest('/api/auth/profile', {
      method: 'DELETE',
      body: JSON.stringify({ password, mode }),
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
  checkUsernameAvailability: async (username) => {
    return apiRequest(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
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
  },
  verifyUser: async (id, isVerified) => {
    return apiRequest(`/api/auth/users/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ isVerified }),
    });
  },
  adminDeleteUser: async (id) => {
    return apiRequest(`/api/auth/users/${id}`, {
      method: 'DELETE',
    });
  }
};
