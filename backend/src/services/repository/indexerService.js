const Repository = require('../../models/Repository');
const User = require('../../models/User');
const { getRepositoryDetails, getLatestCommit } = require('../github/githubRepositories');
const { getRepositoryTree, getBlobContent, getFileContent } = require('../github/githubFiles');
const { getDemoFileTree, getDemoFileContent } = require('../github/demoRepoData');
const { defaultFileFilter } = require('../parser/fileFilter');
const { defaultCodeChunker } = require('../parser/codeChunker');
const { getEmbeddingProvider } = require('../embeddings');
const { getVectorStore } = require('../vector');

// In-memory EventEmitter / subscriber map for real-time SSE progress streaming
const progressListeners = new Map();

function subscribeProgress(repositoryId, callback) {
  const key = String(repositoryId);
  if (!progressListeners.has(key)) {
    progressListeners.set(key, new Set());
  }
  progressListeners.get(key).add(callback);

  return () => {
    const set = progressListeners.get(key);
    if (set) {
      set.delete(callback);
      if (set.size === 0) progressListeners.delete(key);
    }
  };
}

function broadcastProgress(repositoryId, progressData) {
  const key = String(repositoryId);
  const listeners = progressListeners.get(key);
  if (listeners) {
    for (const cb of listeners) {
      try {
        cb(progressData);
      } catch (err) {
        console.error('Error in progress listener:', err);
      }
    }
  }
}

class IndexerService {
  constructor() {
    this.embeddingProvider = getEmbeddingProvider();
    this.vectorStore = getVectorStore();
    this.fileFilter = defaultFileFilter;
    this.chunker = defaultCodeChunker;
  }

  /**
   * Update and persist indexing progress
   */
  async updateProgress(repo, progress) {
    const updatedProgress = {
      ...repo.indexingProgress.toObject(),
      ...progress,
      updatedAt: new Date(),
    };

    if (progress.totalFiles > 0) {
      const pct = Math.min(100, Math.round((progress.processedFiles / progress.totalFiles) * 100));
      updatedProgress.percentage = pct;
    }

    repo.indexingProgress = updatedProgress;
    await repo.save();

    broadcastProgress(repo._id, {
      status: repo.indexingStatus,
      progress: updatedProgress,
    });
  }

  /**
   * Run full repository indexing pipeline
   */
  async indexRepository(repositoryId, userId, token) {
    const repo = await Repository.findOne({ _id: repositoryId, userId });
    if (!repo) {
      throw new Error('Repository not found or unauthorized');
    }

    if (repo.indexingStatus === 'indexing') {
      return repo;
    }

    repo.indexingStatus = 'indexing';
    await repo.save();

    // Run indexing asynchronously
    this.runIndexingPipeline(repo, userId, token).catch(async (err) => {
      console.error(`[Indexing Failure for ${repo.fullName}]:`, err);
      repo.indexingStatus = 'failed';
      repo.indexingProgress.error = err.message || 'Indexing failed';
      repo.indexingProgress.step = 'Failed';
      await repo.save();

      broadcastProgress(repo._id, {
        status: 'failed',
        error: repo.indexingProgress.error,
        progress: repo.indexingProgress,
      });
    });

    return repo;
  }

  async runIndexingPipeline(repo, userId, token) {
    const { owner, name: repoName, defaultBranch } = repo;

    const user = await User.findById(userId);
    const isDemo = Boolean(user?.isDemoUser || token === 'mock_github_access_token_demo_mode');

    // STEP 1: Fetch metadata & latest commit
    await this.updateProgress(repo, {
      step: 'Fetching repository metadata',
      currentStepIndex: 1,
      totalSteps: 6,
      message: 'Checking latest commit and branch configuration...',
      processedFiles: 0,
      totalFiles: 0,
      percentage: 5,
    });

    let commitSha = 'main';
    if (!isDemo) {
      try {
        const commit = await getLatestCommit(token, owner, repoName, defaultBranch);
        commitSha = commit.sha;
      } catch {
        commitSha = 'latest';
      }
    } else {
      commitSha = 'demo-head-commit-9281';
    }

    // STEP 2: Read Git Tree
    await this.updateProgress(repo, {
      step: 'Reading file tree',
      currentStepIndex: 2,
      message: `Fetching tree hierarchy from ${defaultBranch}...`,
      percentage: 15,
    });

    let treeItems = [];
    try {
      if (isDemo) {
        treeItems = getDemoFileTree(repo.fullName);
      } else {
        treeItems = await getRepositoryTree(token, owner, repoName, defaultBranch);
      }
    } catch (treeError) {
      throw new Error(`Failed to read repository file tree: ${treeError.message}`);
    }

    // Filter only blobs (files)
    const blobItems = treeItems.filter((item) => item.type === 'blob');

    // STEP 3: Filtering files
    await this.updateProgress(repo, {
      step: 'Filtering files',
      currentStepIndex: 3,
      message: `Filtering ${blobItems.length} repository items...`,
      percentage: 25,
    });

    const indexableFiles = blobItems.filter((item) => this.fileFilter.isIndexable(item.path, item.size || 0));

    // Limit maximum indexable files per repo to 150 to keep processing fast and respect API limits
    const filesToProcess = indexableFiles.slice(0, 150);

    await this.updateProgress(repo, {
      step: 'Processing source files',
      currentStepIndex: 4,
      totalFiles: filesToProcess.length,
      processedFiles: 0,
      message: `Discovered ${filesToProcess.length} indexable files. Fetching contents...`,
      percentage: 30,
    });

    // STEP 4: Fetch contents & Chunk
    const allChunks = [];
    const BATCH_CONCURRENCY = 5;

    for (let i = 0; i < filesToProcess.length; i += BATCH_CONCURRENCY) {
      const slice = filesToProcess.slice(i, i + BATCH_CONCURRENCY);

      await Promise.all(
        slice.map(async (fileItem) => {
          try {
            let content = '';
            if (isDemo) {
              const df = getDemoFileContent(repo.fullName, fileItem.path);
              content = df.content;
            } else if (fileItem.sha) {
              const blob = await getBlobContent(token, owner, repoName, fileItem.sha);
              content = blob.content;
            } else {
              const fc = await getFileContent(token, owner, repoName, fileItem.path, defaultBranch);
              content = fc.content;
            }

            const language = this.fileFilter.getLanguage(fileItem.path);
            const chunks = this.chunker.chunkFile(content, {
              owner,
              repo: repoName,
              branch: defaultBranch,
              commitSha,
              filePath: fileItem.path,
              language,
              fileExtension: require('path').extname(fileItem.path).toLowerCase(),
            });

            allChunks.push(...chunks);
          } catch (err) {
            console.warn(`[Skip file ${fileItem.path}]:`, err.message);
          }
        })
      );

      const processedCount = Math.min(i + BATCH_CONCURRENCY, filesToProcess.length);
      await this.updateProgress(repo, {
        processedFiles: processedCount,
        message: `Processed ${processedCount} / ${filesToProcess.length} files (${allChunks.length} chunks generated)`,
        percentage: 30 + Math.round((processedCount / filesToProcess.length) * 35),
      });

      // Small throttling delay to avoid GitHub API abuse
      await new Promise((r) => setTimeout(r, 50));
    }

    if (allChunks.length === 0) {
      throw new Error('No indexable code files could be processed in this repository.');
    }

    // STEP 5: Generate Embeddings
    await this.updateProgress(repo, {
      step: 'Generating vector embeddings',
      currentStepIndex: 5,
      message: `Generating embeddings for ${allChunks.length} semantic code chunks...`,
      percentage: 70,
    });

    const EMBED_BATCH = 15;
    for (let i = 0; i < allChunks.length; i += EMBED_BATCH) {
      const batch = allChunks.slice(i, i + EMBED_BATCH);
      const texts = batch.map((c) => `${c.filePath} (${c.language})\n${c.content}`);
      const vectors = await this.embeddingProvider.embedBatch(texts);

      for (let j = 0; j < batch.length; j++) {
        batch[j].embedding = vectors[j];
        batch[j].embeddingModel = this.embeddingProvider.getName();
      }

      const progressPct = 70 + Math.round((Math.min(i + EMBED_BATCH, allChunks.length) / allChunks.length) * 20);
      await this.updateProgress(repo, {
        message: `Embedding ${Math.min(i + EMBED_BATCH, allChunks.length)} / ${allChunks.length} chunks`,
        percentage: progressPct,
      });
    }

    // STEP 6: Store in Vector Database & Finalize
    await this.updateProgress(repo, {
      step: 'Building search index',
      currentStepIndex: 6,
      message: 'Writing records to vector store and synthesizing repository map...',
      percentage: 92,
    });

    await this.vectorStore.upsertChunks(repo._id, userId, allChunks);

    // Generate repository overview
    const { generateRepositoryOverview } = require('./overviewService');
    const overview = await generateRepositoryOverview(allChunks, repo);
    repo.overview = overview;

    repo.indexingStatus = 'indexed';
    repo.lastIndexedCommit = commitSha;
    repo.totalChunks = allChunks.length;
    await this.updateProgress(repo, {
      step: 'Complete',
      currentStepIndex: 6,
      message: `Repository indexed successfully (${allChunks.length} code chunks ready for investigation).`,
      percentage: 100,
    });

    console.log(`[Indexer] Successfully indexed ${repo.fullName}: ${allChunks.length} chunks.`);
  }
}

module.exports = {
  IndexerService,
  defaultIndexerService: new IndexerService(),
  subscribeProgress,
  broadcastProgress,
};
