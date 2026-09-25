const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimitMiddleware');
const {
  sendChatMessage,
  listConversations,
  getConversation,
  deleteConversation,
} = require('../controllers/chatController');

router.use(authMiddleware);

// Repository chat & investigation
router.post('/repositories/:id/chat', chatLimiter, sendChatMessage);
router.get('/repositories/:id/conversations', listConversations);

// Conversation management
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);

module.exports = router;
