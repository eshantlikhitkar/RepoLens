const http = require('http');
const app = require('./src/app');
const { connectDB, mongoose } = require('./src/config/db');

const TEST_PORT = 5098;

async function testSSE() {
  console.log('--- TESTING SSE CHAT STREAMING ---');
  await connectDB();
  const server = app.listen(TEST_PORT);

  try {
    // 1. Login demo user
    const loginRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/demo`, { method: 'POST' });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 2. Select repository
    const selRes = await fetch(`http://localhost:${TEST_PORT}/api/repositories/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ owner: 'octocat', name: 'job-portal-mern' }),
    });
    const repo = (await selRes.json()).repository;

    // 3. Send streaming chat request
    const chatRes = await fetch(`http://localhost:${TEST_PORT}/api/repositories/${repo._id}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question: 'How does authentication work in this project?',
        stream: true,
      }),
    });

    if (!chatRes.ok) {
      throw new Error(`Chat stream failed with status ${chatRes.status}`);
    }

    const reader = chatRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let receivedCitations = false;
    let tokenCount = 0;
    let doneReceived = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            doneReceived = true;
            continue;
          }
          try {
            const data = JSON.parse(raw);
            if (data.type === 'citations') {
              receivedCitations = true;
              console.log(`[PASS] SSE received ${data.citations.length} citations immediately.`);
            } else if (data.type === 'token') {
              tokenCount++;
            } else if (data.type === 'done') {
              console.log('[PASS] SSE received done event with messageId:', data.messageId);
            }
          } catch {}
        }
      }
    }

    console.log(`[PASS] Stream finished: received citations=${receivedCitations}, streamed tokens=${tokenCount}, [DONE]=${doneReceived}`);

    if (!receivedCitations || tokenCount === 0 || !doneReceived) {
      throw new Error('SSE stream did not complete properly');
    }

    console.log('🎉 SSE STREAMING TEST PASSED 100%!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testSSE().catch((err) => {
  console.error('SSE Test Error:', err);
  process.exit(1);
});
