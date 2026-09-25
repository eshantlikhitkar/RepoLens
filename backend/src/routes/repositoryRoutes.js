const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { indexLimiter } = require('../middleware/rateLimitMiddleware');
const {
  listRepositories,
  selectRepository,
  getRepository,
  getFileTree,
  getFile,
  getOverview,
} = require('../controllers/repositoryController');
const {
  startIndexing,
  getIndexingStatus,
  streamIndexingProgress,
} = require('../controllers/indexerController');

// All repository routes require valid user session
router.use(authMiddleware);

router.get('/', listRepositories);
router.post('/select', selectRepository);
router.get('/:id', getRepository);

// Indexing endpoints
router.post('/:id/index', indexLimiter, startIndexing);
router.get('/:id/status', getIndexingStatus);
router.get('/:id/status/stream', streamIndexingProgress);

// File tree and code viewer endpoints
router.get('/:id/tree', getFileTree);
router.get('/:id/file', getFile);
router.get('/:id/files/*', getFile);

// Architecture overview
router.get('/:id/overview', getOverview);

module.exports = router;
