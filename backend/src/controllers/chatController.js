const Repository = require('../models/Repository');
const Conversation = require('../models/Conversation');
const { defaultRAGPipeline } = require('../services/rag/ragPipeline');
const { getAIService } = require('../services/ai');

/**
 * Handle user question with RAG and optional SSE streaming
 */
async function sendChatMessage(req, res) {
  try {
    const user = req.user;
    const { id: repositoryId } = req.params;
    const { question, conversationId, stream = true } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Question text is required' });
    }

    // 1. Verify repository ownership
    const repo = await Repository.findOne({ _id: repositoryId, userId: user._id });
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found or access denied' });
    }

    if (repo.indexingStatus !== 'indexed') {
      return res.status(400).json({
        success: false,
        error: 'This repository has not been indexed yet. Please click "Index Repository" first before asking questions.',
        status: repo.indexingStatus,
      });
    }

    // 2. Load or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId: user._id, repositoryId });
    }

    if (!conversation) {
      // Create new conversation with auto-generated title
      const title = question.slice(0, 45) + (question.length > 45 ? '...' : '');
      conversation = new Conversation({
        userId: user._id,
        repositoryId: repo._id,
        title,
        messages: [],
      });
    }

    // 3. Retrieve context using RAG pipeline
    const { chunks, citations, contextText } = await defaultRAGPipeline.retrieveContext({
      question,
      repositoryId: repo._id,
      userId: user._id,
      repoInfo: {
        owner: repo.owner,
        name: repo.name,
        language: repo.language,
        defaultBranch: repo.defaultBranch,
        githubUrl: repo.githubUrl,
      },
    });

    const aiService = getAIService();
    const history = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // If client requested streaming
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      // Send citations immediately so UI can display them
      res.write(
        `data: ${JSON.stringify({
          type: 'citations',
          citations,
          retrievedChunksCount: chunks.length,
          conversationId: conversation._id,
        })}\n\n`
      );

      let accumulatedAnswer = '';

      try {
        accumulatedAnswer = await aiService.generateInvestigation({
          question,
          contextText,
          conversationHistory: history,
          repoInfo: repo,
          onToken: (token) => {
            res.write(
              `data: ${JSON.stringify({
                type: 'token',
                token,
              })}\n\n`
            );
          },
        });

        // Save conversation turn to MongoDB
        conversation.messages.push({
          role: 'user',
          content: question,
          citations: [],
          retrievedChunksCount: 0,
        });

        conversation.messages.push({
          role: 'assistant',
          content: accumulatedAnswer,
          citations,
          retrievedChunksCount: chunks.length,
        });

        await conversation.save();

        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            conversationId: conversation._id,
            messageId: conversation.messages[conversation.messages.length - 1]._id,
          })}\n\n`
        );
        res.write('data: [DONE]\n\n');
        return res.end();
      } catch (genErr) {
        console.error('[AI Generation Error in stream]:', genErr);
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: genErr.message || 'Error generating AI response',
          })}\n\n`
        );
        return res.end();
      }
    }

    // Non-streaming response
    const answer = await aiService.generateInvestigation({
      question,
      contextText,
      conversationHistory: history,
      repoInfo: repo,
    });

    conversation.messages.push({
      role: 'user',
      content: question,
      citations: [],
      retrievedChunksCount: 0,
    });

    conversation.messages.push({
      role: 'assistant',
      content: answer,
      citations,
      retrievedChunksCount: chunks.length,
    });

    await conversation.save();

    return res.json({
      success: true,
      answer,
      citations,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error('[Chat Controller Error]:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

/**
 * List all conversations for a repository
 */
async function listConversations(req, res) {
  try {
    const user = req.user;
    const { id: repositoryId } = req.params;

    const conversations = await Conversation.find(
      { userId: user._id, repositoryId },
      { title: 1, createdAt: 1, updatedAt: 1, 'messages.content': { $slice: 1 } }
    )
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('[List Conversations Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get a specific conversation with all messages
 */
async function getConversation(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const conversation = await Conversation.findOne({ _id: id, userId: user._id });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    return res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('[Get Conversation Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Delete a conversation
 */
async function deleteConversation(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const result = await Conversation.deleteOne({ _id: id, userId: user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    return res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('[Delete Conversation Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  sendChatMessage,
  listConversations,
  getConversation,
  deleteConversation,
};
