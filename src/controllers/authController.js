const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Location, LocationLink, sequelize } = require('../models');
const { generateCsrfToken, storeCsrfToken, ensureCsrfToken, CSRF_COOKIE } = require('../utils/csrf');
const { getCookie } = require('../utils/cookies');
const {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeEmail,
  normalizePassword
} = require('../utils/validators');
require('dotenv').config();

const VALID_HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 6;
const NAME_MAX_LENGTH = 100;
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

const buildUserStats = async () => {
  const totalUsers = await User.count();
  const roles = ['admin', 'moderator', 'editor', 'viewer'];
  const counts = await User.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('role')), 'count']
    ],
    group: ['role']
  });
  const byRole = roles.reduce((acc, role) => {
    acc[role] = 0;
    return acc;
  }, {});
  counts.forEach((item) => {
    const role = item.get('role');
    if (byRole[role] !== undefined) {
      byRole[role] = parseInt(item.get('count'), 10);
    }
  });

  return {
    total: totalUsers,
    byRole
  };
};

const authController = {
  // Register a new user
  register: async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, searchable } = req.body;

      const usernameResult = normalizeRequiredText(username, 'Username', USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH);
      if (usernameResult.error) {
        return res.status(400).json({
          success: false,
          message: usernameResult.error
        });
      }

      const emailResult = normalizeEmail(email);
      if (emailResult.error) {
        return res.status(400).json({
          success: false,
          message: emailResult.error
        });
      }

      const passwordResult = normalizePassword(password, 'Password', PASSWORD_MIN_LENGTH);
      if (passwordResult.error) {
        return res.status(400).json({
          success: false,
          message: passwordResult.error
        });
      }

      const firstNameResult = normalizeOptionalText(firstName, 'First name', undefined, NAME_MAX_LENGTH);
      if (firstNameResult.error) {
        return res.status(400).json({
          success: false,
          message: firstNameResult.error
        });
      }

      const lastNameResult = normalizeOptionalText(lastName, 'Last name', undefined, NAME_MAX_LENGTH);
      if (lastNameResult.error) {
        return res.status(400).json({
          success: false,
          message: lastNameResult.error
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email: emailResult.value }, { username: usernameResult.value }]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists.'
        });
      }

      // Create new user
      const user = await User.create({
        username: usernameResult.value,
        email: emailResult.value,
        password: passwordResult.value,
        role: 'viewer',
        firstName: firstNameResult.value,
        lastName: lastNameResult.value,
        searchable: searchable !== undefined ? Boolean(searchable) : true
      });

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET must be configured');
      }
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

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
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            avatarColor: user.avatarColor
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user.'
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const emailResult = normalizeEmail(email);
      if (emailResult.error) {
        return res.status(400).json({
          success: false,
          message: emailResult.error
        });
      }

      const passwordResult = normalizePassword(password, 'Password', PASSWORD_MIN_LENGTH);
      if (passwordResult.error) {
        return res.status(400).json({
          success: false,
          message: passwordResult.error
        });
      }

      // Find user by email
      const user = await User.findOne({ where: { email: emailResult.value } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(passwordResult.value);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET must be configured');
      }
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

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
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            avatarColor: user.avatarColor
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in.'
      });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const { Location } = require('../models');
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Location,
            as: 'homeLocation',
            attributes: ['id', 'name', 'type', 'slug']
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      ensureUserCsrfCookie(req, res, user.id);

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile.'
      });
    }
  },

  // Update current user profile (excluding email)
  updateProfile: async (req, res) => {
    try {
      const { username, firstName, lastName, avatar, avatarColor, homeLocationId, searchable } = req.body;

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      if (username !== undefined) {
        const usernameResult = normalizeRequiredText(username, 'Username', USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH);
        if (usernameResult.error) {
          return res.status(400).json({
            success: false,
            message: usernameResult.error
          });
        }

        if (usernameResult.value !== user.username) {
          const existingUser = await User.findOne({
            where: {
              username: usernameResult.value,
              id: { [Op.ne]: user.id }
            }
          });

          if (existingUser) {
            return res.status(400).json({
              success: false,
              message: 'Username is already taken.'
            });
          }
          user.username = usernameResult.value;
        }
      }

      const firstNameResult = normalizeOptionalText(firstName, 'First name', undefined, NAME_MAX_LENGTH);
      if (firstNameResult.error) {
        return res.status(400).json({
          success: false,
          message: firstNameResult.error
        });
      }
      if (firstNameResult.value !== undefined) {
        user.firstName = firstNameResult.value;
      }

      const lastNameResult = normalizeOptionalText(lastName, 'Last name', undefined, NAME_MAX_LENGTH);
      if (lastNameResult.error) {
        return res.status(400).json({
          success: false,
          message: lastNameResult.error
        });
      }
      if (lastNameResult.value !== undefined) {
        user.lastName = lastNameResult.value;
      }

      if (avatar !== undefined) {
        if (avatar === null) {
          user.avatar = null;
        } else if (typeof avatar === 'string') {
          const trimmedAvatar = avatar.trim();
          if (trimmedAvatar.length === 0) {
            user.avatar = null;
          } else {
            let avatarUrl;
            try {
              avatarUrl = new URL(trimmedAvatar);
            } catch (parseError) {
              return res.status(400).json({
                success: false,
                message: 'Avatar URL is malformed.'
              });
            }
            if (!['http:', 'https:'].includes(avatarUrl.protocol)) {
              return res.status(400).json({
                success: false,
                message: 'Avatar URL must use HTTP or HTTPS protocol.'
              });
            }
            user.avatar = trimmedAvatar;
          }
        } else {
          return res.status(400).json({
            success: false,
            message: 'Avatar must be a string.'
          });
        }
      }

      if (avatarColor !== undefined) {
        if (avatarColor === null) {
          user.avatarColor = null;
        } else if (typeof avatarColor === 'string') {
          const trimmedColor = avatarColor.trim();
          if (trimmedColor.length === 0) {
            user.avatarColor = null;
          } else if (!VALID_HEX_COLOR_REGEX.test(trimmedColor)) {
            return res.status(400).json({
              success: false,
              message: 'Avatar color must be a valid hex color (#RGB or #RRGGBB).'
            });
          } else {
            user.avatarColor = trimmedColor;
          }
        } else {
          return res.status(400).json({
            success: false,
            message: 'Avatar color must be a string.'
          });
        }
      }

      // Handle homeLocationId update
      if (homeLocationId !== undefined) {
        if (homeLocationId === null) {
          // Only remove location link if user had a homeLocationId set
          // This prevents deleting manual links created via /api/locations/link
          if (user.homeLocationId !== null) {
            await LocationLink.destroy({
              where: {
                entity_type: 'user',
                entity_id: user.id,
                location_id: user.homeLocationId
              }
            });
          }
          user.homeLocationId = null;
        } else {
          const locationId = parseInt(homeLocationId);
          if (isNaN(locationId)) {
            return res.status(400).json({
              success: false,
              message: 'Home location ID must be a number.'
            });
          }
          // Verify location exists
          const location = await Location.findByPk(locationId);
          if (!location) {
            return res.status(404).json({
              success: false,
              message: 'Location not found.'
            });
          }
          user.homeLocationId = locationId;
          
          // Create or update LocationLink
          const [link, created] = await LocationLink.findOrCreate({
            where: {
              entity_type: 'user',
              entity_id: user.id
            },
            defaults: {
              location_id: locationId
            }
          });
          
          // If link exists but points to different location, update it
          if (!created && link.location_id !== locationId) {
            link.location_id = locationId;
            await link.save();
          }
        }
      }

      // Handle searchable update
      if (searchable !== undefined) {
        if (typeof searchable !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'Searchable must be a boolean.'
          });
        }
        user.searchable = searchable;
      }

      await user.save();

      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] }
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile.'
      });
    }
  },

  // Update current user password
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const currentPasswordResult = normalizePassword(currentPassword, 'Current password', PASSWORD_MIN_LENGTH);
      if (currentPasswordResult.error) {
        return res.status(400).json({
          success: false,
          message: currentPasswordResult.error
        });
      }

      const newPasswordResult = normalizePassword(newPassword, 'New password', PASSWORD_MIN_LENGTH);
      if (newPasswordResult.error) {
        return res.status(400).json({
          success: false,
          message: newPasswordResult.error
        });
      }

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      const isValidPassword = await user.comparePassword(currentPasswordResult.value);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }

      user.password = newPasswordResult.value;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password updated successfully.'
      });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating password.'
      });
    }
  },
  // Get all users (admin only)
  getUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username', 'email', 'role', 'firstName', 'lastName', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
      const stats = await buildUserStats();

      res.status(200).json({
        success: true,
        data: { users, stats }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users.'
      });
    }
  },

  // Get user statistics (admin only)
  getUserStats: async (req, res) => {
    try {
      const stats = await buildUserStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user stats.'
      });
    }
  },

  // Update user role (admin only)
  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const allowedRoles = ['admin', 'moderator', 'editor', 'viewer'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role.'
        });
      }

      let updatedUser = null;
      let roleAlreadySet = false;

      await sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!user) {
          const notFoundError = new Error('USER_NOT_FOUND');
          notFoundError.status = 404;
          throw notFoundError;
        }

        if (user.role === role) {
          roleAlreadySet = true;
          updatedUser = user;
          return;
        }

        if (user.role === 'admin' && role !== 'admin') {
          const adminCount = await User.count({
            where: { role: 'admin' },
            transaction,
            lock: transaction.LOCK.UPDATE
          });
          if (adminCount <= 1) {
            const lastAdminError = new Error('LAST_ADMIN');
            lastAdminError.status = 400;
            throw lastAdminError;
          }
        }

        user.role = role;
        await user.save({ transaction });
        updatedUser = user;
      });

      const stats = await buildUserStats();

      res.status(200).json({
        success: true,
        message: roleAlreadySet ? 'User already has the requested role.' : 'User role updated successfully.',
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            createdAt: updatedUser.createdAt
          },
          stats
        }
      });
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }
      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          message: 'At least one admin must remain.'
        });
      }
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user role.'
      });
    }
  },

  // GitHub OAuth initiation
  initiateGithubOAuth: async (req, res) => {
    try {
      const { generateState, isOAuthConfigured } = require('../utils/oauthHelpers');
      
      if (!isOAuthConfigured('github')) {
        return res.status(503).json({
          success: false,
          message: 'GitHub OAuth is not configured.'
        });
      }

      const mode = req.query.mode || 'login'; // 'login' or 'link'
      const userId = mode === 'link' ? req.user?.id : null;

      const state = generateState(userId, mode);
      const clientId = process.env.GITHUB_CLIENT_ID;
      const redirectUri = process.env.GITHUB_CALLBACK_URL;
      
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=user:email`;

      res.status(200).json({
        success: true,
        data: { authUrl: githubAuthUrl }
      });
    } catch (error) {
      console.error('GitHub OAuth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initiating GitHub OAuth.'
      });
    }
  },

  // GitHub OAuth callback
  githubCallback: async (req, res) => {
    try {
      const axios = require('axios');
      const { validateState } = require('../utils/oauthHelpers');
      const { encryptToken } = require('../utils/encryption');
      
      const { code, state } = req.query;

      if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_params`);
      }

      // Validate state token
      const stateData = validateState(state);
      if (!stateData) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
      }

      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL
        },
        {
          headers: { Accept: 'application/json' }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_exchange_failed`);
      }

      // Fetch user profile from GitHub
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const githubUser = userResponse.data;

      // Get user emails
      const emailsResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const primaryEmail = emailsResponse.data.find(e => e.primary)?.email || githubUser.email;

      if (stateData.mode === 'link') {
        // Link GitHub account to existing user
        if (!stateData.userId) {
          return res.redirect(`${process.env.FRONTEND_URL}/profile?error=unauthorized`);
        }

        const user = await User.findByPk(stateData.userId);
        if (!user) {
          return res.redirect(`${process.env.FRONTEND_URL}/profile?error=user_not_found`);
        }

        // Check if GitHub account is already linked to another user
        const existingGithubUser = await User.findOne({
          where: { githubId: githubUser.id.toString() }
        });

        if (existingGithubUser && existingGithubUser.id !== user.id) {
          return res.redirect(`${process.env.FRONTEND_URL}/profile?error=github_already_linked`);
        }

        user.githubId = githubUser.id.toString();
        user.githubAccessToken = encryptToken(accessToken);
        if (!user.avatar && githubUser.avatar_url) {
          user.avatar = githubUser.avatar_url;
        }
        await user.save();

        return res.redirect(`${process.env.FRONTEND_URL}/profile?success=github_linked`);
      } else {
        // Login or signup with GitHub
        let user = await User.findOne({
          where: { githubId: githubUser.id.toString() }
        });

        if (user) {
          // Update access token
          user.githubAccessToken = encryptToken(accessToken);
          if (githubUser.avatar_url) {
            user.avatar = githubUser.avatar_url;
          }
          await user.save();
        } else {
          // Check if email already exists
          const existingEmailUser = await User.findOne({
            where: { email: primaryEmail }
          });

          if (existingEmailUser) {
            // Link GitHub to existing account
            existingEmailUser.githubId = githubUser.id.toString();
            existingEmailUser.githubAccessToken = encryptToken(accessToken);
            if (!existingEmailUser.avatar && githubUser.avatar_url) {
              existingEmailUser.avatar = githubUser.avatar_url;
            }
            await existingEmailUser.save();
            user = existingEmailUser;
          } else {
            // Create new user from GitHub profile
            const username = githubUser.login || `github_${githubUser.id}`;
            const name = githubUser.name || '';
            const nameParts = name.split(' ');
            
            user = await User.create({
              username,
              email: primaryEmail,
              githubId: githubUser.id.toString(),
              githubAccessToken: encryptToken(accessToken),
              firstName: nameParts[0] || githubUser.login,
              lastName: nameParts.slice(1).join(' ') || '',
              avatar: githubUser.avatar_url,
              role: 'viewer'
            });
          }
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET must be configured');
        }
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            role: user.role 
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        setAuthCookies(res, token, user.id);
        return res.redirect(`${process.env.FRONTEND_URL}/login?oauth=1`);
      }
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  },

  // Unlink GitHub account
  unlinkGithub: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      if (!user.githubId) {
        return res.status(400).json({
          success: false,
          message: 'GitHub account is not linked.'
        });
      }

      // Ensure user has a password before unlinking
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Cannot unlink GitHub. Please set a password first.'
        });
      }

      user.githubId = null;
      user.githubAccessToken = null;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'GitHub account unlinked successfully.'
      });
    } catch (error) {
      console.error('Unlink GitHub error:', error);
      res.status(500).json({
        success: false,
        message: 'Error unlinking GitHub account.'
      });
    }
  },

  // Get OAuth configuration status
  getOAuthConfig: async (req, res) => {
    try {
      const { isOAuthConfigured } = require('../utils/oauthHelpers');

      res.status(200).json({
        success: true,
        data: {
          github: isOAuthConfigured('github'),
          google: isOAuthConfigured('google'),
          facebook: isOAuthConfigured('facebook')
        }
      });
    } catch (error) {
      console.error('Get OAuth config error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching OAuth configuration.'
      });
    }
  },
  logout: async (req, res) => {
    try {
      clearAuthCookies(res);
      res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging out.'
      });
    }
  },

  // Search users (public, returns only searchable users)
  searchUsers: async (req, res) => {
    try {
      const { search = '', page = 1, limit = 20 } = req.query;
      
      // Validate and sanitize pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const whereClause = {
        searchable: true
      };

      if (search && typeof search === 'string') {
        const sequelize = require('../config/database');
        const isPostgres = sequelize.getDialect() === 'postgres';
        
        // Escape special LIKE characters to prevent SQL injection
        const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
        
        whereClause.username = {
          [isPostgres ? Op.iLike : Op.like]: `%${sanitizedSearch}%`
        };
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'avatarColor', 'createdAt'],
        order: [['username', 'ASC']],
        limit: limitNum,
        offset: offset
      });

      const totalPages = Math.ceil(count / limitNum);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems: count,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching users.'
      });
    }
  },

  // Get public user statistics (no authentication required)
  getPublicUserStats: async (req, res) => {
    try {
      // Get counts in a single optimized query
      const stats = await User.findAll({
        attributes: [
          'searchable',
          [sequelize.fn('COUNT', sequelize.col('searchable')), 'count']
        ],
        group: ['searchable']
      });

      // Parse results
      let totalUsers = 0;
      let searchableUsers = 0;
      let nonSearchableUsers = 0;

      stats.forEach((item) => {
        const count = parseInt(item.get('count'), 10);
        totalUsers += count;
        if (item.get('searchable')) {
          searchableUsers = count;
        } else {
          nonSearchableUsers = count;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          searchableUsers,
          nonSearchableUsers
        }
      });
    } catch (error) {
      console.error('Get public user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics.'
      });
    }
  }
};

module.exports = authController;
