const axios = require('axios');

/**
 * Creates an Axios instance pre-configured for GitHub API
 * @param {string} token - Decrypted GitHub personal access token or OAuth token
 */
function createGitHubClient(token = null) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'RepoLens-AI-Investigator',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const client = axios.create({
    baseURL: 'https://api.github.com',
    headers,
    timeout: 15000,
  });

  // Interceptor to handle GitHub rate limit warnings and informative errors
  client.interceptors.response.use(
    (response) => {
      const remaining = response.headers['x-ratelimit-remaining'];
      if (remaining && parseInt(remaining, 10) < 5) {
        console.warn(`[GitHub API] Warning: rate limit low (${remaining} requests remaining)`);
      }
      return response;
    },
    (error) => {
      if (error.response) {
        const status = error.response.status;
        const msg = error.response.data?.message || error.message;
        if (status === 403 && msg.includes('rate limit')) {
          const resetTime = error.response.headers['x-ratelimit-reset'];
          const resetDate = resetTime ? new Date(resetTime * 1000).toLocaleTimeString() : 'soon';
          const err = new Error(`GitHub API rate limit exceeded. Resets at ${resetDate}.`);
          err.status = 429;
          return Promise.reject(err);
        }
        if (status === 404) {
          const err = new Error('GitHub repository or resource not found. Check repository visibility and permissions.');
          err.status = 404;
          return Promise.reject(err);
        }
        if (status === 401) {
          const err = new Error('GitHub authentication token expired or invalid.');
          err.status = 401;
          return Promise.reject(err);
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

module.exports = {
  createGitHubClient,
};
