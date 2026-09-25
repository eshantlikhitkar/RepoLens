const Repository = require('../models/Repository');
const { getUserRepositories, getRepositoryDetails } = require('../services/github/githubRepositories');
const { getRepositoryTree, getFileContent } = require('../services/github/githubFiles');
const { getDemoRepositories, getDemoFileTree, getDemoFileContent } = require('../services/github/demoRepoData');

/**
 * List repositories accessible to the user
 */
async function listRepositories(req, res) {
  try {
    const user = req.user;
    let repos = [];

    if (user.isDemoUser) {
      repos = getDemoRepositories();
    } else {
      const token = user.getToken();
      if (!token) {
        return res.status(401).json({ success: false, error: 'GitHub access token not found for user.' });
      }
      repos = await getUserRepositories(token, {
        page: parseInt(req.query.page, 10) || 1,
        perPage: parseInt(req.query.perPage, 10) || 100,
        sort: req.query.sort || 'updated',
      });
    }

    // Merge with our local database indexing status
    const fullNames = repos.map((r) => r.fullName);
    const existingIndexed = await Repository.find({
      userId: user._id,
      fullName: { $in: fullNames },
    }).lean();

    const indexedMap = new Map();
    for (const r of existingIndexed) {
      indexedMap.set(r.fullName, r);
    }

    const merged = repos.map((repo) => {
      const local = indexedMap.get(repo.fullName);
      return {
        ...repo,
        _id: local?._id || null,
        indexingStatus: local?.indexingStatus || 'not_indexed',
        indexingProgress: local?.indexingProgress || null,
        lastIndexedCommit: local?.lastIndexedCommit || '',
        totalChunks: local?.totalChunks || 0,
        hasOverview: Boolean(local?.overview?.projectType),
      };
    });

    return res.json({
      success: true,
      count: merged.length,
      repositories: merged,
    });
  } catch (error) {
    console.error('[List Repositories Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get or register a repository in our local MongoDB
 */
async function selectRepository(req, res) {
  try {
    const user = req.user;
    const { owner, name } = req.body;

    if (!owner || !name) {
      return res.status(400).json({ success: false, error: 'Owner and repo name are required' });
    }

    const fullName = `${owner}/${name}`;
    let repo = await Repository.findOne({ userId: user._id, fullName });

    if (!repo) {
      let details;
      if (user.isDemoUser) {
        const demoList = getDemoRepositories();
        const foundDemo = demoList.find((r) => r.fullName.toLowerCase() === fullName.toLowerCase());
        if (foundDemo) {
          details = foundDemo;
        } else {
          try {
            details = await getRepositoryDetails(null, owner, name);
          } catch (e) {
            details = demoList[0];
          }
        }
      } else {
        const token = user.getToken();
        details = await getRepositoryDetails(token, owner, name);
      }

      repo = await Repository.findOneAndUpdate(
        { userId: user._id, fullName },
        {
          $setOnInsert: {
            githubRepoId: details.githubRepoId || String(Date.now()),
            owner: details.owner,
            name: details.name,
            fullName: details.fullName,
            description: details.description || '',
            defaultBranch: details.defaultBranch || 'main',
            private: details.private || false,
            language: details.language || 'JavaScript',
            stars: details.stars || 0,
            forks: details.forks || 0,
            githubUrl: details.githubUrl || `https://github.com/${fullName}`,
            userId: user._id,
            indexingStatus: 'not_indexed',
          },
        },
        { upsert: true, new: true }
      );
    }

    return res.json({
      success: true,
      repository: repo,
    });
  } catch (error) {
    console.error('[Select Repository Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get single repository details by owner and repo or ID
 */
async function getRepository(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    let query = { userId: user._id };
    if (id.includes('/')) {
      query.fullName = id;
    } else if (require('mongoose').Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.fullName = id;
    }

    let repo = await Repository.findOne(query);

    // If not found in DB yet, attempt to fetch and create on demand
    if (!repo && id.includes('/')) {
      const [owner, name] = id.split('/');
      let details;
      if (user.isDemoUser) {
        const demoList = getDemoRepositories();
        details = demoList.find((r) => r.fullName.toLowerCase() === id.toLowerCase()) || demoList[0];
      } else {
        const token = user.getToken();
        details = await getRepositoryDetails(token, owner, name);
      }

      repo = await Repository.findOneAndUpdate(
        { userId: user._id, fullName: details.fullName },
        {
          $setOnInsert: {
            githubRepoId: details.githubRepoId || String(Date.now()),
            owner: details.owner,
            name: details.name,
            fullName: details.fullName,
            description: details.description || '',
            defaultBranch: details.defaultBranch || 'main',
            private: details.private || false,
            language: details.language || 'JavaScript',
            stars: details.stars || 0,
            forks: details.forks || 0,
            githubUrl: details.githubUrl || `https://github.com/${id}`,
            userId: user._id,
            indexingStatus: 'not_indexed',
          },
        },
        { upsert: true, new: true }
      );
    }

    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found or access denied' });
    }

    return res.json({
      success: true,
      repository: repo,
    });
  } catch (error) {
    console.error('[Get Repository Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Fetch repository file tree
 */
async function getFileTree(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const repo = await Repository.findOne({ _id: id, userId: user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    let tree = [];
    if (user.isDemoUser) {
      tree = getDemoFileTree(repo.fullName);
      if (!tree || tree.length === 0) {
        try {
          tree = await getRepositoryTree(null, repo.owner, repo.name, repo.defaultBranch);
        } catch (e) {
          tree = getDemoFileTree('octocat/job-portal-mern');
        }
      }
    } else {
      const token = user.getToken();
      tree = await getRepositoryTree(token, repo.owner, repo.name, repo.defaultBranch);
    }

    return res.json({
      success: true,
      tree,
      branch: repo.defaultBranch,
    });
  } catch (error) {
    console.error('[Get File Tree Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Fetch raw content of a specific file
 */
async function getFile(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const filePath = req.query.path || req.params[0];

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    const repo = await Repository.findOne({ _id: id, userId: user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    let fileData;
    if (user.isDemoUser) {
      fileData = getDemoFileContent(repo.fullName, filePath);
      if (!fileData) {
        try {
          fileData = await getFileContent(null, repo.owner, repo.name, filePath, repo.defaultBranch);
        } catch (e) {
          fileData = { content: '// File content not available in offline demo mode', size: 0, sha: 'none' };
        }
      }
    } else {
      const token = user.getToken();
      fileData = await getFileContent(token, repo.owner, repo.name, filePath, repo.defaultBranch);
    }

    return res.json({
      success: true,
      file: {
        path: filePath,
        content: fileData.content,
        size: fileData.size,
        sha: fileData.sha,
        language: require('../services/parser/fileFilter').defaultFileFilter.getLanguage(filePath),
      },
    });
  } catch (error) {
    console.error('[Get File Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Fetch repository architecture overview
 */
async function getOverview(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const repo = await Repository.findOne({ _id: id, userId: user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    return res.json({
      success: true,
      overview: repo.overview || null,
      indexingStatus: repo.indexingStatus,
    });
  } catch (error) {
    console.error('[Get Overview Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  listRepositories,
  selectRepository,
  getRepository,
  getFileTree,
  getFile,
  getOverview,
};
