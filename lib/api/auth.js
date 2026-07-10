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

  forgotPassword: async (email) => {
    return apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async ({ token, newPassword }) => {
    return apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  verifyEmail: async (token) => {
    return apiRequest(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  },

  resendVerification: async () => {
    return apiRequest('/api/auth/resend-verification', { method: 'POST' });
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
  updateAvatarSource: async (source) => {
    return apiRequest('/api/auth/avatar-source', {
      method: 'PUT',
      body: JSON.stringify({ source }),
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
  getAdminUsers: async (params = {}) => {
    return apiRequest(buildQueryEndpoint('/api/auth/users/admin', params));
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
  },
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiRequest('/api/auth/me/avatar', {
      method: 'POST',
      body: formData,
    });
  },
  getOnboarding: async () => {
    return apiRequest('/api/auth/onboarding');
  },
  updateOnboarding: async (data) => {
    return apiRequest('/api/auth/onboarding', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  // Returns creator contribution counts scoped to current user
  getContributionSummary: async () => {
    return apiRequest('/api/auth/contribution-summary');
  },
  // Returns current user's contributions with status grouping
  getMyContributions: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.type) qs.set('type', params.type);
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest(`/api/auth/my-contributions${query ? `?${query}` : ''}`);
  },
  // Returns current user's own public-profile readiness
  getProfileReadiness: async () => {
    return apiRequest('/api/auth/profile-readiness');
  },
};
