const axios = require('axios');
const { User } = require('../models');
const { generateState, validateState, isOAuthConfigured } = require('../utils/oauthHelpers');
const { encryptToken } = require('../utils/encryption');
const { generateToken } = require('./authService');
require('dotenv').config();

class OAuthRedirectError extends Error {
  constructor(redirectUrl) {
    super('OAuth redirect');
    this.redirectUrl = redirectUrl;
    this.name = 'OAuthRedirectError';
  }
}

function initiateGithubOAuth(mode, userId) {
  if (!isOAuthConfigured('github')) {
    const err = new Error('GitHub OAuth is not configured.');
    err.status = 503;
    throw err;
  }

  const state = generateState(userId || null, mode || 'login');
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=user:email`;

  return { authUrl };
}

async function handleGithubCallback(code, state) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!code || !state) {
    throw new OAuthRedirectError(`${frontendUrl}/login?error=missing_params`);
  }

  const stateData = validateState(state);
  if (!stateData) {
    throw new OAuthRedirectError(`${frontendUrl}/login?error=invalid_state`);
  }

  const tokenResponse = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL
    },
    { headers: { Accept: 'application/json' } }
  );

  const accessToken = tokenResponse.data.access_token;
  if (!accessToken) {
    throw new OAuthRedirectError(`${frontendUrl}/login?error=token_exchange_failed`);
  }

  const userResponse = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const githubUser = userResponse.data;

  const emailsResponse = await axios.get('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const primaryEmail = emailsResponse.data.find((e) => e.primary)?.email || githubUser.email;

  if (stateData.mode === 'link') {
    if (!stateData.userId) {
      throw new OAuthRedirectError(`${frontendUrl}/profile?error=unauthorized`);
    }

    const user = await User.findByPk(stateData.userId);
    if (!user) {
      throw new OAuthRedirectError(`${frontendUrl}/profile?error=user_not_found`);
    }

    const existingGithubUser = await User.findOne({
      where: { githubId: githubUser.id.toString() }
    });

    if (existingGithubUser && existingGithubUser.id !== user.id) {
      throw new OAuthRedirectError(`${frontendUrl}/profile?error=github_already_linked`);
    }

    user.githubId = githubUser.id.toString();
    user.githubAccessToken = encryptToken(accessToken);
    if (!user.avatar && githubUser.avatar_url) {
      user.avatar = githubUser.avatar_url;
    }
    await user.save();

    return { redirectUrl: `${frontendUrl}/profile?success=github_linked` };
  } else {
    let user = await User.findOne({
      where: { githubId: githubUser.id.toString() }
    });

    if (user) {
      user.githubAccessToken = encryptToken(accessToken);
      if (githubUser.avatar_url) {
        user.avatar = githubUser.avatar_url;
      }
      await user.save();
    } else {
      const existingEmailUser = await User.findOne({
        where: { email: primaryEmail }
      });

      if (existingEmailUser) {
        existingEmailUser.githubId = githubUser.id.toString();
        existingEmailUser.githubAccessToken = encryptToken(accessToken);
        if (!existingEmailUser.avatar && githubUser.avatar_url) {
          existingEmailUser.avatar = githubUser.avatar_url;
        }
        await existingEmailUser.save();
        user = existingEmailUser;
      } else {
        const username = githubUser.login || `github_${githubUser.id}`;
        const name = githubUser.name || '';
        const nameParts = name.split(' ');

        user = await User.create({
          username,
          email: primaryEmail,
          githubId: githubUser.id.toString(),
          githubAccessToken: encryptToken(accessToken),
          firstNameNative: nameParts[0] || githubUser.login,
          lastNameNative: nameParts.slice(1).join(' ') || '',
          avatar: githubUser.avatar_url,
          role: 'viewer'
        });
      }
    }

    const token = generateToken(user);
    return { redirectUrl: `${frontendUrl}/login?oauth=1`, user, token };
  }
}

async function unlinkGithubAccount(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  if (!user.githubId) {
    const err = new Error('GitHub account is not linked.');
    err.status = 400;
    throw err;
  }

  if (!user.password) {
    const err = new Error('Cannot unlink GitHub. Please set a password first.');
    err.status = 400;
    throw err;
  }

  user.githubId = null;
  user.githubAccessToken = null;
  await user.save();
}

function initiateGoogleOAuth(mode, userId) {
  if (!isOAuthConfigured('google')) {
    const err = new Error('Google OAuth is not configured.');
    err.status = 503;
    throw err;
  }

  const state = generateState(userId || null, mode || 'login');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&scope=email profile`;

  return { authUrl };
}

async function handleGoogleCallback(code, state) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!code || !state) {
    throw new OAuthRedirectError(`${frontendUrl}/login?error=missing_params`);
  }

  const stateData = validateState(state);
  if (!stateData) {
    throw new OAuthRedirectError(`${frontendUrl}/login?error=invalid_state`);
  }

  const tokenResponse = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code'
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const accessToken = tokenResponse.data.access_token;
  if (!accessToken) {
    throw new OAuthRedirectError(`${frontendUrl}/login?error=token_exchange_failed`);
  }

  const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const googleUser = userResponse.data;

  if (stateData.mode === 'link') {
    if (!stateData.userId) {
      throw new OAuthRedirectError(`${frontendUrl}/profile?error=unauthorized`);
    }

    const user = await User.findByPk(stateData.userId);
    if (!user) {
      throw new OAuthRedirectError(`${frontendUrl}/profile?error=user_not_found`);
    }

    const existingGoogleUser = await User.findOne({
      where: { googleId: googleUser.id.toString() }
    });

    if (existingGoogleUser && existingGoogleUser.id !== user.id) {
      throw new OAuthRedirectError(`${frontendUrl}/profile?error=google_already_linked`);
    }

    user.googleId = googleUser.id.toString();
    user.googleAccessToken = encryptToken(accessToken);
    if (!user.avatar && googleUser.picture) {
      user.avatar = googleUser.picture;
    }
    await user.save();

    return { redirectUrl: `${frontendUrl}/profile?success=google_linked` };
  } else {
    let user = await User.findOne({
      where: { googleId: googleUser.id.toString() }
    });

    if (user) {
      user.googleAccessToken = encryptToken(accessToken);
      if (googleUser.picture) {
        user.avatar = googleUser.picture;
      }
      await user.save();
    } else {
      const existingEmailUser = await User.findOne({
        where: { email: googleUser.email }
      });

      if (existingEmailUser) {
        existingEmailUser.googleId = googleUser.id.toString();
        existingEmailUser.googleAccessToken = encryptToken(accessToken);
        if (!existingEmailUser.avatar && googleUser.picture) {
          existingEmailUser.avatar = googleUser.picture;
        }
        await existingEmailUser.save();
        user = existingEmailUser;
      } else {
        const username = googleUser.email.split('@')[0] || `google_${googleUser.id}`;
        const name = googleUser.name || '';
        const nameParts = name.split(' ');

        user = await User.create({
          username,
          email: googleUser.email,
          googleId: googleUser.id.toString(),
          googleAccessToken: encryptToken(accessToken),
          firstNameNative: googleUser.given_name || nameParts[0] || '',
          lastNameNative: googleUser.family_name || nameParts.slice(1).join(' ') || '',
          avatar: googleUser.picture,
          role: 'viewer'
        });
      }
    }

    const token = generateToken(user);
    return { redirectUrl: `${frontendUrl}/login?oauth=1`, user, token };
  }
}

async function unlinkGoogleAccount(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  if (!user.googleId) {
    const err = new Error('Google account is not linked.');
    err.status = 400;
    throw err;
  }

  if (!user.password && !user.githubId) {
    const err = new Error('Cannot unlink Google. Please set a password or link another account first.');
    err.status = 400;
    throw err;
  }

  user.googleId = null;
  user.googleAccessToken = null;
  await user.save();
}

function getOAuthConfig() {
  return {
    github: isOAuthConfigured('github'),
    google: isOAuthConfigured('google'),
    facebook: isOAuthConfigured('facebook')
  };
}

module.exports = {
  OAuthRedirectError,
  initiateGithubOAuth,
  handleGithubCallback,
  unlinkGithubAccount,
  initiateGoogleOAuth,
  handleGoogleCallback,
  unlinkGoogleAccount,
  getOAuthConfig
};
