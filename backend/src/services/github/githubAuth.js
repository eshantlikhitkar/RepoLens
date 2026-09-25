const axios = require('axios');
const env = require('../../config/env');
const { createGitHubClient } = require('./githubClient');

/**
 * Generate GitHub OAuth authorization URL
 * @param {string} state - Random state string for CSRF mitigation
 * @returns {string} - Authorization URL
 */
function getOAuthUrl(state) {
  const scope = 'read:user user:email repo';
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth authorization code for an access token
 * @param {string} code - Authorization code from GitHub callback
 * @returns {Promise<string>} - Access token
 */
async function exchangeCodeForToken(code) {
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    },
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (response.data.error) {
    throw new Error(`GitHub OAuth error: ${response.data.error_description || response.data.error}`);
  }

  return response.data.access_token;
}

/**
 * Fetch authenticated GitHub user's profile and primary email
 * @param {string} token - GitHub access token
 * @returns {Promise<object>} - Normalized user profile
 */
async function getGitHubUserProfile(token) {
  const client = createGitHubClient(token);
  const { data: user } = await client.get('/user');

  let primaryEmail = user.email || '';
  if (!primaryEmail) {
    try {
      const { data: emails } = await client.get('/user/emails');
      const primary = emails.find((e) => e.primary && e.verified) || emails[0];
      if (primary) {
        primaryEmail = primary.email;
      }
    } catch {
      // Ignore if user email endpoint is unavailable
    }
  }

  return {
    githubId: String(user.id),
    username: user.login,
    displayName: user.name || user.login,
    avatarUrl: user.avatar_url,
    email: primaryEmail,
  };
}

module.exports = {
  getOAuthUrl,
  exchangeCodeForToken,
  getGitHubUserProfile,
};
