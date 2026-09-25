const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { getOAuthUrl, exchangeCodeForToken, getGitHubUserProfile } = require('../services/github/githubAuth');

function generateToken(userId) {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function setAuthCookie(res, token) {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

/**
 * Initiates GitHub OAuth flow
 */
async function githubLogin(req, res) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return res.status(400).json({
      success: false,
      error: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env, or use Demo Login.',
      demoAvailable: true,
    });
  }

  const state = crypto.randomBytes(20).toString('hex');
  res.cookie('github_oauth_state', state, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax',
  });

  const redirectUrl = getOAuthUrl(state);
  res.redirect(redirectUrl);
}

/**
 * Handles GitHub OAuth callback
 */
async function githubCallback(req, res) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(error_description || error)}`);
  }

  const storedState = req.cookies?.github_oauth_state;
  res.clearCookie('github_oauth_state');

  // Verify state against CSRF
  if (!state || (storedState && state !== storedState)) {
    return res.redirect(`${env.CLIENT_URL}/login?error=Invalid+OAuth+state+parameter`);
  }

  if (!code) {
    return res.redirect(`${env.CLIENT_URL}/login?error=Authorization+code+missing`);
  }

  try {
    // 1. Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // 2. Fetch GitHub profile
    const profile = await getGitHubUserProfile(accessToken);

    // 3. Find or create user
    let user = await User.findOne({ githubId: profile.githubId }).select('+githubAccessToken');
    if (!user) {
      user = new User({
        githubId: profile.githubId,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        email: profile.email,
        isDemoUser: false,
      });
    } else {
      user.username = profile.username;
      user.displayName = profile.displayName;
      user.avatarUrl = profile.avatarUrl;
      if (profile.email) user.email = profile.email;
    }

    user.setToken(accessToken);
    await user.save();

    // 4. Issue JWT and set cookie
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // Redirect to dashboard with token in hash for easy single-page auth synchronization
    return res.redirect(`${env.CLIENT_URL}/dashboard#token=${token}`);
  } catch (err) {
    console.error('[OAuth Callback Error]:', err);
    return res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
  }
}

/**
 * Get current authenticated user details
 */
async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  res.json({
    success: true,
    user: req.user.toSafeJSON(),
  });
}

/**
 * 1-click Demo Account Login for instant testing without OAuth keys
 */
async function demoLogin(req, res) {
  try {
    const demoGithubId = 'demo-octocat-999';
    let user = await User.findOne({ githubId: demoGithubId }).select('+githubAccessToken');

    if (!user) {
      user = new User({
        githubId: demoGithubId,
        username: 'octocat-demo',
        displayName: 'Demo Developer',
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
        email: 'developer@example.com',
        isDemoUser: true,
      });
      // Store dummy token for demo
      user.setToken('mock_github_access_token_demo_mode');
      await user.save();
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: 'Logged in as Demo User',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('[Demo Login Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Log out user
 */
async function logout(req, res) {
  res.clearCookie('token', { path: '/' });
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

module.exports = {
  githubLogin,
  githubCallback,
  getMe,
  demoLogin,
  logout,
};
