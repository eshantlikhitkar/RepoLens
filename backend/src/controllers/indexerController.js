const Repository = require('../models/Repository');
const { defaultIndexerService, subscribeProgress } = require('../services/repository/indexerService');

/**
 * Trigger repository indexing
 */
async function startIndexing(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const repo = await Repository.findOne({ _id: id, userId: user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found or access denied' });
    }

    const token = user.getToken();
    const updatedRepo = await defaultIndexerService.indexRepository(repo._id, user._id, token);

    return res.json({
      success: true,
      message: 'Indexing initiated',
      status: updatedRepo.indexingStatus,
      progress: updatedRepo.indexingProgress,
    });
  } catch (error) {
    console.error('[Start Indexing Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Check indexing status and progress
 */
async function getIndexingStatus(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const repo = await Repository.findOne({ _id: id, userId: user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    return res.json({
      success: true,
      status: repo.indexingStatus,
      progress: repo.indexingProgress,
      totalChunks: repo.totalChunks || 0,
      lastIndexedCommit: repo.lastIndexedCommit,
    });
  } catch (error) {
    console.error('[Get Status Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Real-time SSE stream of indexing progress
 */
async function streamIndexingProgress(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const repo = await Repository.findOne({ _id: id, userId: user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial status
    res.write(
      `data: ${JSON.stringify({
        status: repo.indexingStatus,
        progress: repo.indexingProgress,
        totalChunks: repo.totalChunks,
      })}\n\n`
    );

    // If already finished or failed, end stream
    if (repo.indexingStatus === 'indexed' || repo.indexingStatus === 'failed') {
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Subscribe to ongoing indexing progress
    const unsubscribe = subscribeProgress(repo._id, (progressData) => {
      res.write(`data: ${JSON.stringify(progressData)}\n\n`);
      if (progressData.status === 'indexed' || progressData.status === 'failed') {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    req.on('close', () => {
      unsubscribe();
    });
  } catch (error) {
    console.error('[Stream Progress Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = {
  startIndexing,
  getIndexingStatus,
  streamIndexingProgress,
};
