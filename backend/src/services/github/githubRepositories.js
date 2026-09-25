const { createGitHubClient } = require('./githubClient');

/**
 * Fetch repositories accessible to the user
 * @param {string} token - GitHub access token
 * @param {object} options - Pagination options
 * @returns {Promise<Array>}
 */
async function getUserRepositories(token, options = {}) {
  const { page = 1, perPage = 100, sort = 'updated', affiliation = 'owner,collaborator,organization_member' } = options;
  const client = createGitHubClient(token);

  const { data } = await client.get('/user/repos', {
    params: {
      sort,
      direction: 'desc',
      page,
      per_page: perPage,
      affiliation,
    },
  });

  return data.map((repo) => normalizeRepo(repo));
}

/**
 * Fetch a single repository's details
 * @param {string} token - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 */
async function getRepositoryDetails(token, owner, repo) {
  const client = createGitHubClient(token);
  const { data } = await client.get(`/repos/${owner}/${repo}`);
  return normalizeRepo(data);
}

/**
 * Get latest commit SHA for a branch
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 */
async function getLatestCommit(token, owner, repo, branch = 'main') {
  const client = createGitHubClient(token);
  try {
    const { data } = await client.get(`/repos/${owner}/${repo}/commits/${branch}`);
    return {
      sha: data.sha,
      message: data.commit?.message,
      date: data.commit?.author?.date,
    };
  } catch (error) {
    console.warn(`[GitHub] Could not fetch latest commit for ${owner}/${repo}@${branch}:`, error.message);
    return {
      sha: 'unknown',
      message: 'Initial index',
      date: new Date().toISOString(),
    };
  }
}

/**
 * Normalize repository response
 */
function normalizeRepo(repo) {
  return {
    githubRepoId: String(repo.id),
    name: repo.name,
    owner: repo.owner?.login || '',
    fullName: repo.full_name,
    description: repo.description || '',
    defaultBranch: repo.default_branch || 'main',
    private: Boolean(repo.private),
    language: repo.language || 'Unknown',
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    githubUrl: repo.html_url,
    updatedAt: repo.updated_at,
    createdAt: repo.created_at,
    size: repo.size, // Size in KB
    openIssues: repo.open_issues_count || 0,
  };
}

module.exports = {
  getUserRepositories,
  getRepositoryDetails,
  getLatestCommit,
  normalizeRepo,
};
