const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  githubLogin,
  githubCallback,
  getMe,
  demoLogin,
  logout,
} = require('../controllers/authController');

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/me', authMiddleware, getMe);
router.post('/demo', demoLogin);
router.post('/logout', logout);

module.exports = router;
