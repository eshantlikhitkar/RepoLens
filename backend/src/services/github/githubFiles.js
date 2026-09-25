const { createGitHubClient } = require('./githubClient');

// Max file size for full content fetch (300 KB)
const MAX_FILE_SIZE_BYTES = 300 * 1024;

/**
 * Fetch full Git Tree recursively
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @returns {Promise<Array<{path: string, mode: string, type: 'blob'|'tree', sha: string, size?: number}>>}
 */
async function getRepositoryTree(token, owner, repo, branch = 'main') {
  const client = createGitHubClient(token);
  
  // First attempt: get tree using branch name
  try {
    const { data } = await client.get(`/repos/${owner}/${repo}/git/trees/${branch}`, {
      params: { recursive: 1 },
    });
    return data.tree || [];
  } catch (error) {
    // If branch name failed, attempt to fetch commit SHA first
    if (error.response?.status === 404) {
      const commitRes = await client.get(`/repos/${owner}/${repo}/commits/${branch}`);
      const treeSha = commitRes.data.commit.tree.sha;
      const { data } = await client.get(`/repos/${owner}/${repo}/git/trees/${treeSha}`, {
        params: { recursive: 1 },
      });
      return data.tree || [];
    }
    throw error;
  }
}

/**
 * Fetch file content from GitHub repository
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} filePath
 * @param {string} branch
 * @returns {Promise<{content: string, size: number, encoding: string, sha: string}>}
 */
async function getFileContent(token, owner, repo, filePath, branch = 'main') {
  const client = createGitHubClient(token);
  
  try {
    const { data } = await client.get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}`, {
      params: { ref: branch },
    });

    if (Array.isArray(data)) {
      throw new Error(`Path ${filePath} is a directory, not a file.`);
    }

    if (data.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File is too large (${Math.round(data.size / 1024)} KB). Maximum supported file size is 300 KB.`);
    }

    let content = '';
    if (data.encoding === 'base64' && data.content) {
      content = Buffer.from(data.content, 'base64').toString('utf8');
    } else if (data.download_url) {
      // Direct raw download fallback
      const rawRes = await client.get(data.download_url, {
        transformResponse: [(d) => d],
      });
      content = String(rawRes.data);
    }

    return {
      content,
      size: data.size,
      sha: data.sha,
      path: data.path,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Fetch file content directly via Blob SHA (useful during indexing)
 */
async function getBlobContent(token, owner, repo, fileSha) {
  const client = createGitHubClient(token);
  const { data } = await client.get(`/repos/${owner}/${repo}/git/blobs/${fileSha}`);
  
  let content = '';
  if (data.encoding === 'base64') {
    content = Buffer.from(data.content, 'base64').toString('utf8');
  } else {
    content = data.content || '';
  }

  return {
    content,
    size: data.size,
    sha: fileSha,
  };
}

module.exports = {
  getRepositoryTree,
  getFileContent,
  getBlobContent,
  MAX_FILE_SIZE_BYTES,
};
