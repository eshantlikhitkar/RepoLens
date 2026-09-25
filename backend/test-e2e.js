const axios = require('axios');
const app = require('./src/app');
const { connectDB, mongoose } = require('./src/config/db');

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('--- STARTING REPOLENS AI E2E INTEGRATION TEST ---');
  let server;

  try {
    // 1. Connect DB and start server
    await connectDB();
    server = app.listen(TEST_PORT);
    console.log(`[PASS] Server started on port ${TEST_PORT}`);

    // 2. Health check
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    console.log('[PASS] Healthcheck response:', healthRes.data);

    // 3. Demo Login
    const loginRes = await axios.post(`${BASE_URL}/api/auth/demo`);
    if (!loginRes.data.success || !loginRes.data.token) {
      throw new Error('Demo login failed');
    }
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log(`[PASS] Demo user logged in: ${loginRes.data.user.username}`);

    // 4. Verify /me
    const meRes = await axios.get(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
    if (meRes.data.user.username !== 'octocat-demo') {
      throw new Error('/me returned unexpected user');
    }
    console.log('[PASS] Verified /api/auth/me endpoint');

    // 5. List repositories
    const listRes = await axios.get(`${BASE_URL}/api/repositories`, { headers: authHeaders });
    if (!Array.isArray(listRes.data.repositories) || listRes.data.repositories.length === 0) {
      throw new Error('List repositories failed');
    }
    console.log(`[PASS] Repositories listed: ${listRes.data.repositories.length} found`);
    const targetRepo = listRes.data.repositories[0];

    // 6. Select / register repository
    const selectRes = await axios.post(
      `${BASE_URL}/api/repositories/select`,
      { owner: targetRepo.owner, name: targetRepo.name },
      { headers: authHeaders }
    );
    const repoId = selectRes.data.repository._id;
    console.log(`[PASS] Selected repository: ${selectRes.data.repository.fullName} (ID: ${repoId})`);

    // 7. Fetch file tree
    const treeRes = await axios.get(`${BASE_URL}/api/repositories/${repoId}/tree`, { headers: authHeaders });
    if (!Array.isArray(treeRes.data.tree) || treeRes.data.tree.length === 0) {
      throw new Error('File tree is empty');
    }
    console.log(`[PASS] File tree loaded: ${treeRes.data.tree.length} items`);

    // 8. Fetch file content
    const fileRes = await axios.get(
      `${BASE_URL}/api/repositories/${repoId}/file?path=src/controllers/authController.js`,
      { headers: authHeaders }
    );
    if (!fileRes.data.file.content.includes('loginUser')) {
      throw new Error('File content did not contain loginUser');
    }
    console.log(`[PASS] File content retrieved: ${fileRes.data.file.path} (${fileRes.data.file.size} bytes)`);

    // 9. Start Indexing
    console.log('Initiating repository indexing...');
    const indexRes = await axios.post(`${BASE_URL}/api/repositories/${repoId}/index`, {}, { headers: authHeaders });
    console.log(`[PASS] Indexing status triggered: ${indexRes.data.status}`);

    // 10. Wait for indexing to complete (poll status)
    let isIndexed = false;
    for (let attempt = 0; attempt < 25; attempt++) {
      const statusRes = await axios.get(`${BASE_URL}/api/repositories/${repoId}/status`, { headers: authHeaders });
      console.log(`  -> Indexing progress: ${statusRes.data.status} (${statusRes.data.progress?.percentage || 0}%) - ${statusRes.data.progress?.step || ''}`);
      if (statusRes.data.status === 'indexed') {
        isIndexed = true;
        break;
      }
      if (statusRes.data.status === 'failed') {
        throw new Error(`Indexing failed: ${statusRes.data.progress?.error}`);
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    if (!isIndexed) {
      throw new Error('Indexing timed out');
    }
    console.log('[PASS] Indexing pipeline completed successfully!');

    // 11. Architecture Overview
    const overviewRes = await axios.get(`${BASE_URL}/api/repositories/${repoId}/overview`, { headers: authHeaders });
    console.log('[PASS] Architecture Overview:', {
      projectType: overviewRes.data.overview.projectType,
      technologies: overviewRes.data.overview.technologies,
      authentication: overviewRes.data.overview.authentication,
      database: overviewRes.data.overview.database,
    });

    // 12. RAG AI Question Answering (Non-streaming test)
    console.log('Testing RAG Question Answering: "How does authentication work in this project?"');
    const chatRes = await axios.post(
      `${BASE_URL}/api/repositories/${repoId}/chat`,
      {
        question: 'How does authentication work in this project?',
        stream: false,
      },
      { headers: authHeaders }
    );

    if (!chatRes.data.success || !chatRes.data.answer) {
      throw new Error('Chat failed to generate answer');
    }
    console.log('[PASS] AI Response generated successfully!');
    console.log('Answer excerpt:\n', chatRes.data.answer.slice(0, 300) + '...\n');
    console.log('[PASS] Citations returned:', chatRes.data.citations.map((c) => `${c.filePath}:${c.startLine}-${c.endLine}`));

    const conversationId = chatRes.data.conversationId;

    // 13. Test Follow-up question (Conversational memory)
    console.log('Testing follow-up question: "Where is the token generated?"');
    const followUpRes = await axios.post(
      `${BASE_URL}/api/repositories/${repoId}/chat`,
      {
        question: 'Where is the token generated?',
        conversationId,
        stream: false,
      },
      { headers: authHeaders }
    );
    console.log('[PASS] Follow-up answer generated!');
    console.log('Follow-up citations:', followUpRes.data.citations.map((c) => `${c.filePath}:${c.startLine}-${c.endLine}`));

    // 14. Verify Conversation Persistence
    const convListRes = await axios.get(`${BASE_URL}/api/repositories/${repoId}/conversations`, { headers: authHeaders });
    if (convListRes.data.conversations.length === 0) {
      throw new Error('No conversations persisted');
    }
    console.log(`[PASS] Persisted conversations verified: ${convListRes.data.conversations.length} found`);

    const convDetail = await axios.get(`${BASE_URL}/api/conversations/${conversationId}`, { headers: authHeaders });
    if (convDetail.data.conversation.messages.length < 4) {
      throw new Error('Conversation turns missing in DB');
    }
    console.log(`[PASS] Conversation history verified: ${convDetail.data.conversation.messages.length} messages preserved`);

    // 15. Security: Unauthenticated request should be rejected (401)
    try {
      await axios.get(`${BASE_URL}/api/repositories`);
      throw new Error('Expected 401 for unauthenticated request');
    } catch (authErr) {
      if (authErr.response?.status === 401) {
        console.log('[PASS] Security verification: unauthenticated request rejected with 401');
      } else {
        throw authErr;
      }
    }

    console.log('\n======================================================');
    console.log('🎉 ALL REPOLENS AI E2E INTEGRATION TESTS PASSED 100%!');
    console.log('======================================================');
  } catch (error) {
    console.error('\n❌ E2E TEST FAILED:', error.response?.data || error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
}

runTests();
