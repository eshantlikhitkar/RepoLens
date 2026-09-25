const axios = require('axios');
const app = require('./src/app');
const { connectDB, mongoose } = require('./src/config/db');

const TEST_PORT = 5097;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function testQuestionTypes() {
  console.log('--- TESTING ALL QUESTION TYPES (SECTION 20) ---');
  await connectDB();
  const server = app.listen(TEST_PORT);

  try {
    // 1. Login demo
    const loginRes = await axios.post(`${BASE_URL}/api/auth/demo`);
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Select repository
    const selRes = await axios.post(
      `${BASE_URL}/api/repositories/select`,
      { owner: 'octocat', name: 'job-portal-mern' },
      { headers: authHeaders }
    );
    const repoId = selRes.data.repository._id;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // 3. Test Security Question
    console.log('1. Testing Security Question: "Are there any obvious security problems with authentication?"');
    const secRes = await axios.post(
      `${BASE_URL}/api/repositories/${repoId}/chat`,
      { question: 'Are there any obvious security problems with authentication?', stream: false },
      { headers: authHeaders }
    );
    const secAnswer = secRes.data.answer.toLowerCase();
    if (!secAnswer.includes('security') && !secAnswer.includes('vulnerabilit') && !secAnswer.includes('concern') && !secAnswer.includes('risk')) {
      throw new Error('Security question did not return security-related findings');
    }
    console.log('  [PASS] Security findings verified.');

    await sleep(5000);

    // 4. Test File Question
    console.log('2. Testing File Question: "What does server.js do?"');
    const fileRes = await axios.post(
      `${BASE_URL}/api/repositories/${repoId}/chat`,
      { question: 'What does server.js do?', stream: false },
      { headers: authHeaders }
    );
    if (!fileRes.data.answer.toLowerCase().includes('server')) {
      throw new Error('File question did not reference server');
    }
    console.log('  [PASS] Specific file analysis verified.');

    await sleep(5000);

    // 5. Test Function Question
    console.log('3. Testing Function Question: "Explain the loginUser function"');
    const funcRes = await axios.post(
      `${BASE_URL}/api/repositories/${repoId}/chat`,
      { question: 'Explain the loginUser function', stream: false },
      { headers: authHeaders }
    );
    const funcAnswer = funcRes.data.answer.toLowerCase();
    if (!funcAnswer.includes('login') && !funcAnswer.includes('function') && !funcAnswer.includes('user')) {
      throw new Error('Function question did not return function analysis');
    }
    console.log('  [PASS] Function analysis verified.');

    await sleep(5000);

    // 6. Test Relationship Question
    console.log('4. Testing Relationship Question: "How does User.js interact with authController.js?"');
    const relRes = await axios.post(
      `${BASE_URL}/api/repositories/${repoId}/chat`,
      { question: 'How does User.js interact with authController.js?', stream: false },
      { headers: authHeaders }
    );
    const relAnswer = relRes.data.answer.toLowerCase();
    if (!relAnswer.includes('user') && !relAnswer.includes('auth') && !relAnswer.includes('interact')) {
      throw new Error('Relationship question did not return interaction analysis');
    }
    console.log('  [PASS] Component interaction flow verified.');

    console.log('\n🎉 ALL QUESTION TYPES TESTED AND VERIFIED SUCCESSFULLY (SECTION 20)!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testQuestionTypes().catch((err) => {
  console.error('Test error:', err.response?.data || err.message);
  process.exit(1);
});
