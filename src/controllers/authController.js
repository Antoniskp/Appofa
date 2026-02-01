const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, sequelize } = require('../models');
require('dotenv').config();

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
      const { username, email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required.'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }]
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
        username,
        email,
        password,
        role: 'viewer',
        firstName,
        lastName
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
          token,
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
        message: 'Error registering user.',
        error: error.message
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
      }

      // Find user by email
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          token,
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
        message: 'Error logging in.',
        error: error.message
      });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile.',
        error: error.message
      });
    }
  },

  // Update current user profile (excluding email)
  updateProfile: async (req, res) => {
    try {
      const { username, firstName, lastName, avatar, avatarColor } = req.body;

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      if (username !== undefined) {
        if (typeof username !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'Username must be a string.'
          });
        }

        const trimmedUsername = username.trim();

        if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
          return res.status(400).json({
            success: false,
            message: 'Username must be between 3 and 50 characters.'
          });
        }

        if (trimmedUsername !== user.username) {
          const existingUser = await User.findOne({
            where: {
              username: trimmedUsername,
              id: { [Op.ne]: user.id }
            }
          });

          if (existingUser) {
            return res.status(400).json({
              success: false,
              message: 'Username is already taken.'
            });
          }
          user.username = trimmedUsername;
        }
      }

      if (firstName !== undefined) {
        user.firstName = firstName;
      }

      if (lastName !== undefined) {
        user.lastName = lastName;
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
            } catch (urlError) {
              return res.status(400).json({
                success: false,
                message: 'Avatar must be a valid URL.'
              });
            }
            if (!['http:', 'https:'].includes(avatarUrl.protocol)) {
              return res.status(400).json({
                success: false,
                message: 'Avatar must be a valid URL.'
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
          } else if (!/^#[0-9A-Fa-f]{6}$/.test(trimmedColor)) {
            return res.status(400).json({
              success: false,
              message: 'Avatar color must be a valid hex color.'
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
        message: 'Error updating profile.',
        error: error.message
      });
    }
  },

  // Update current user password
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters.'
        });
      }

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      const isValidPassword = await user.comparePassword(currentPassword);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password updated successfully.'
      });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating password.',
        error: error.message
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
        message: 'Error fetching users.',
        error: error.message
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
        message: 'Error fetching user stats.',
        error: error.message
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
        message: 'Error updating user role.',
        error: error.message
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
        message: 'Error initiating GitHub OAuth.',
        error: error.message
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
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            role: user.role 
          },
          process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
          { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        return res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
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
        message: 'Error unlinking GitHub account.',
        error: error.message
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
        message: 'Error fetching OAuth configuration.',
        error: error.message
      });
    }
  }
};

module.exports = authController;
