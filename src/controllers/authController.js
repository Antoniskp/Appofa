const authService = require('../services/authService');
const oauthService = require('../services/oauthService');
const userService = require('../services/userService');
const badgeService = require('../services/badgeService');
const { User } = require('../models');
const { generateCsrfToken, storeCsrfToken, ensureCsrfToken, CSRF_COOKIE } = require('../utils/csrf');
const { getCookie } = require('../utils/cookies');
require('dotenv').config();

const AUTH_COOKIE = 'auth_token';

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/'
};

const csrfCookieOptions = {
  httpOnly: false,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 2 * 60 * 60 * 1000,
  path: '/'
};

const setAuthCookies = (res, token, userId) => {
  res.cookie(AUTH_COOKIE, token, authCookieOptions);
  const csrfToken = generateCsrfToken();
  storeCsrfToken(csrfToken, userId);
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions);
};

const ensureUserCsrfCookie = (req, res, userId) => {
  const existingToken = getCookie(req, CSRF_COOKIE);
  if (existingToken && ensureCsrfToken(existingToken, userId)) {
    return;
  }
  const csrfToken = generateCsrfToken();
  storeCsrfToken(csrfToken, userId);
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions);
};

const clearAuthCookies = (res) => {
  res.clearCookie(AUTH_COOKIE, { path: '/' });
  res.clearCookie(CSRF_COOKIE, { path: '/' });
};

const authController = {
  // Register a new user
  register: async (req, res) => {
    try {
      const { user, token } = await authService.registerUser(req.body);
      setAuthCookies(res, token, user.id);
      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstNameNative: user.firstNameNative,
            lastNameNative: user.lastNameNative,
            avatar: user.avatar,
            avatarColor: user.avatarColor
          }
        }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Error registering user.' });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.loginUser(email, password);
      setAuthCookies(res, token, user.id);
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstNameNative: user.firstNameNative,
            lastNameNative: user.lastNameNative,
            avatar: user.avatar,
            avatarColor: user.avatarColor
          }
        }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Error logging in.' });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const userJson = await userService.getUserProfile(req.user.id);
      ensureUserCsrfCookie(req, res, req.user.id);
      res.status(200).json({ success: true, data: { user: userJson } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Get profile error:', error);
      res.status(500).json({ success: false, message: 'Error fetching user profile.' });
    }
  },

  // Update current user profile (excluding email)
  updateProfile: async (req, res) => {
    try {
      const updatedUser = await userService.updateUserProfile(req.user.id, req.body);
      badgeService.evaluate(req.user.id).catch(err => console.error('Badge evaluation error:', err));
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: { user: updatedUser }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, message: 'Error updating profile.' });
    }
  },

  // Update current user password
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (user.password === null) {
        await authService.setPassword(req.user.id, newPassword);
      } else {
        await authService.changePassword(req.user.id, currentPassword, newPassword);
      }
      res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Update password error:', error);
      res.status(500).json({ success: false, message: 'Error updating password.' });
    }
  },

  // Get all users (admin/moderator only) — legacy, fetches all at once
  getUsers: async (req, res) => {
    try {
      const { users, stats } = await userService.getUsers(req.user.id, req.user.role);
      res.status(200).json({ success: true, data: { users, stats } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Get users error:', error);
      res.status(500).json({ success: false, message: 'Error fetching users.' });
    }
  },

  // Get users with server-side pagination/filtering (admin/moderator only)
  getAdminUsers: async (req, res) => {
    try {
      const { search, role, verified, placeholder, page, limit } = req.query;
      const result = await userService.getAdminUsers(req.user.id, req.user.role, {
        search, role, verified, placeholder, page, limit
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Get admin users error:', error);
      res.status(500).json({ success: false, message: 'Error fetching users.' });
    }
  },

  // Get user statistics (admin/moderator only)
  getUserStats: async (req, res) => {
    try {
      const stats = await userService.getUserStats(req.user.id, req.user.role);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Get user stats error:', error);
      res.status(500).json({ success: false, message: 'Error fetching user stats.' });
    }
  },

  // Update user role (admin/moderator only)
  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role, locationId } = req.body;
      const { user, stats, roleAlreadySet } = await userService.updateUserRole(
        req.user.id,
        req.user.role,
        id,
        role,
        locationId
      );
      res.status(200).json({
        success: true,
        message: roleAlreadySet ? 'User already has the requested role.' : 'User role updated successfully.',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstNameNative: user.firstNameNative,
            lastNameNative: user.lastNameNative,
            homeLocationId: user.homeLocationId,
            homeLocation: user.homeLocation,
            moderatorLocationId: user.moderatorLocationId,
            moderatorLocation: user.moderatorLocation,
            createdAt: user.createdAt
          },
          stats
        }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Update user role error:', error);
      res.status(500).json({ success: false, message: 'Error updating user role.' });
    }
  },

  getUserStatsForModeratorScope: async (moderatorUserId) => {
    return userService.getUserStatsForModeratorScope(moderatorUserId);
  },

  // GitHub OAuth initiation
  initiateGithubOAuth: async (req, res) => {
    try {
      const mode = req.query.mode || 'login';
      const userId = mode === 'link' ? req.user?.id : null;
      const { authUrl } = oauthService.initiateGithubOAuth(mode, userId);
      res.status(200).json({ success: true, data: { authUrl } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('GitHub OAuth initiation error:', error);
      res.status(500).json({ success: false, message: 'Error initiating GitHub OAuth.' });
    }
  },

  // GitHub OAuth callback
  githubCallback: async (req, res) => {
    try {
      const { code, state } = req.query;
      const result = await oauthService.handleGithubCallback(code, state);
      if (result.token) {
        setAuthCookies(res, result.token, result.user.id);
      }
      return res.redirect(result.redirectUrl);
    } catch (error) {
      if (error.redirectUrl) {
        return res.redirect(error.redirectUrl);
      }
      console.error('GitHub callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  },

  // Unlink GitHub account
  unlinkGithub: async (req, res) => {
    try {
      await oauthService.unlinkGithubAccount(req.user.id);
      res.status(200).json({ success: true, message: 'GitHub account unlinked successfully.' });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Unlink GitHub error:', error);
      res.status(500).json({ success: false, message: 'Error unlinking GitHub account.' });
    }
  },

  // Google OAuth initiation
  initiateGoogleOAuth: async (req, res) => {
    try {
      const mode = req.query.mode || 'login';
      const userId = mode === 'link' ? req.user?.id : null;
      const { authUrl } = oauthService.initiateGoogleOAuth(mode, userId);
      res.status(200).json({ success: true, data: { authUrl } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Google OAuth initiation error:', error);
      res.status(500).json({ success: false, message: 'Error initiating Google OAuth.' });
    }
  },

  // Google OAuth callback
  googleCallback: async (req, res) => {
    try {
      const { code, state } = req.query;
      const result = await oauthService.handleGoogleCallback(code, state);
      if (result.token) {
        setAuthCookies(res, result.token, result.user.id);
      }
      return res.redirect(result.redirectUrl);
    } catch (error) {
      if (error.redirectUrl) {
        return res.redirect(error.redirectUrl);
      }
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  },

  // Unlink Google account
  unlinkGoogle: async (req, res) => {
    try {
      await oauthService.unlinkGoogleAccount(req.user.id);
      res.status(200).json({ success: true, message: 'Google account unlinked successfully.' });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Unlink Google error:', error);
      res.status(500).json({ success: false, message: 'Error unlinking Google account.' });
    }
  },

  updateAvatarSource: async (req, res) => {
    try {
      const { source } = req.body;
      await oauthService.updateAvatarSource(req.user.id, source);
      const user = await userService.getUserProfile(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Avatar source updated successfully.',
        data: { user }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Update avatar source error:', error);
      res.status(500).json({ success: false, message: 'Error updating avatar source.' });
    }
  },

  // Get OAuth configuration status
  getOAuthConfig: async (req, res) => {
    try {
      const config = oauthService.getOAuthConfig();
      res.status(200).json({ success: true, data: config });
    } catch (error) {
      console.error('Get OAuth config error:', error);
      res.status(500).json({ success: false, message: 'Error fetching OAuth configuration.' });
    }
  },

  logout: async (req, res) => {
    try {
      clearAuthCookies(res);
      res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Error logging out.' });
    }
  },

  // Get public user profile (basic data, only if searchable)
  getPublicUserProfile: async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await userService.getPublicUserProfile(userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Get public user profile error:', error);
      res.status(500).json({ success: false, message: 'Error fetching public user profile.' });
    }
  },

  // Get public user profile by username (basic data, only if searchable)
  getPublicUserProfileByUsername: async (req, res) => {
    try {
      const { username } = req.params;
      const user = await userService.getPublicUserProfileByUsername(username);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Get public user profile by username error:', error);
      res.status(500).json({ success: false, message: 'Error fetching public user profile.' });
    }
  },

  // Search users (public, returns only searchable users)
  searchUsers: async (req, res) => {
    try {
      const { search = '', page = 1, limit = 20, expertiseArea, locationId } = req.query;
      const result = await userService.searchUsers(search, page, limit, expertiseArea, locationId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Search users error:', error);
      res.status(500).json({ success: false, message: 'Error searching users.' });
    }
  },

  // Get public user statistics (no authentication required)
  getPublicUserStats: async (req, res) => {
    try {
      const data = await userService.getPublicUserStats();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Get public user stats error:', error);
      res.status(500).json({ success: false, message: 'Error fetching user statistics.' });
    }
  },

  // Delete or anonymize current user account
  deleteAccount: async (req, res) => {
    try {
      const { password, mode } = req.body;
      await userService.deleteUserAccount(req.user.id, password, mode);
      clearAuthCookies(res);
      res.status(200).json({
        success: true,
        message: mode === 'purge' ? 'Account permanently deleted.' : 'Account anonymized and deleted.'
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Delete account error:', error);
      res.status(500).json({ success: false, message: 'Error deleting account.' });
    }
  },

  refreshCsrf: async (req, res) => {
    try {
      ensureUserCsrfCookie(req, res, req.user.id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('CSRF refresh error:', error);
      return res.status(500).json({ success: false, message: 'Error refreshing CSRF token.' });
    }
  },

  // Verify or unverify a user (admin: anyone; moderator: only within scope)
  verifyUser: async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      const { isVerified } = req.body;
      const updatedUser = await userService.verifyUser(
        req.user.id,
        targetId,
        isVerified
      );
      // Trigger badge evaluation so the verified badge is auto-awarded immediately
      badgeService.evaluate(targetId).catch(err => console.error('Badge evaluation error after verify:', err));
      return res.status(200).json({
        success: true,
        message: isVerified ? 'User verified successfully.' : 'User unverified successfully.',
        data: { user: updatedUser }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Verify user error:', error);
      return res.status(500).json({ success: false, message: 'Error updating verification status.' });
    }
  },
  adminDeleteUser: async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      await userService.adminDeleteUser(req.user.id, req.user.role, targetId);
      res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Admin delete user error:', error);
      res.status(500).json({ success: false, message: 'Error deleting user.' });
    }
  },

  // Check if a username is available (not taken by another user)
  checkUsernameAvailability: async (req, res) => {
    const { username } = req.query;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Invalid username.' });
    }
    try {
      const available = await userService.isUsernameAvailable(username.trim(), req.user.id);
      return res.status(200).json({ success: true, available });
    } catch (error) {
      console.error('Username availability check error:', error);
      return res.status(500).json({ success: false, message: 'Error checking username.' });
    }
  },

  // Upload and replace avatar for the authenticated user
  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }
      const { processAvatar } = require('../services/imageProcessingService');
      const { saveAvatar } = require('../services/imageStorageService');
      let optimizedBuffer;
      try {
        optimizedBuffer = await processAvatar(req.file.buffer);
      } catch (err) {
        console.error('Avatar processing failed:', err);
        const isHeic = /^image\/hei[cf](-sequence)?$/.test(req.file.mimetype || '');
        if (isHeic) {
          return res.status(422).json({
            success: false,
            message: 'HEIC/HEIF images could not be processed on this server. Please convert to JPEG, PNG, or WebP and try again.',
          });
        }
        return res.status(422).json({ success: false, message: 'Invalid or corrupt image.' });
      }
      const avatarUrl = saveAvatar(optimizedBuffer, req.user.id);
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      user.avatarUrl = avatarUrl;
      user.avatarUpdatedAt = new Date();
      // Activate the uploaded avatar as the current profile image
      user.avatar = avatarUrl;
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully.',
        data: { avatarUrl, avatarUpdatedAt: user.avatarUpdatedAt }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      return res.status(500).json({ success: false, message: 'Error uploading avatar.' });
    }
  },
};

module.exports = authController;
