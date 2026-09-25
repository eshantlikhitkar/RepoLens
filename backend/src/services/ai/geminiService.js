const axios = require('axios');
const { AIService, SYSTEM_PROMPT } = require('./aiProvider');

class GeminiService extends AIService {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.fallbackModels = [
      'gemini-3.8-flash',
      'gemini-3-flash-preview',
      'gemini-flash-latest',
    ];
  }

  getName() {
    return 'gemini';
  }

  async generateInvestigation({ question, contextText, conversationHistory = [], repoInfo = {}, onToken = null }) {
    if (!this.apiKey) {
      throw new Error('Gemini API key is missing');
    }

    // TEST MODE: Return deterministic mock responses to avoid hitting API rate limits during tests.
    // Activate by setting GEMINI_TEST_MODE=1 in the environment.
    if (process.env.GEMINI_TEST_MODE === '1') {
      const q = question.toLowerCase();
      let mockResponse;

      if (q.includes('security') || q.includes('vulnerab')) {
        mockResponse = `## Security Analysis

**Observed code**: The authentication in \`authController.js\` uses bcrypt for password hashing and JWT for session tokens.

**Potential concern**: The JWT secret may be weak or hardcoded if not loaded from environment variables.

**Why it could matter**: A weak secret allows token forgery attacks (risk of unauthorized access).

**Recommendation**: Ensure JWT_SECRET is a cryptographically random 256-bit value loaded from \`.env\`.`;
      } else if (q.includes('server.js') || q.includes('server')) {
        mockResponse = `## server.js Overview

The \`server.js\` file is the application entry point. It initializes Express, connects to MongoDB, registers middleware (CORS, Helmet, rate limiting), mounts API routes, and starts listening on the configured port.`;
      } else if (q.includes('loginuser') || q.includes('login')) {
        mockResponse = `## Function Analysis: loginUser

The \`loginUser\` function in \`authController.js\` handles POST /api/auth/login. It:
1. Validates the request body for email and password
2. Queries MongoDB for a matching user document
3. Uses bcrypt.compare() to verify the password hash
4. Signs a JWT with the user's ID and returns it in the response`;
      } else if (q.includes('interact') || q.includes('user.js') || q.includes('authcontroller')) {
        mockResponse = `## Component Interaction: User.js ↔ authController.js

The \`authController.js\` imports the \`User\` Mongoose model from \`models/User.js\`. During login, it calls \`User.findOne({ email })\` to retrieve the user document, then passes the hashed password to bcrypt for comparison. During registration, it calls \`new User({...}).save()\` to persist the new account.`;
      } else {
        mockResponse = `## Analysis: ${question}

Based on the repository context, this project uses a MERN stack (MongoDB, Express, React, Node.js) with JWT authentication. The authentication flow is handled in \`authController.js\`, which validates credentials and issues tokens stored in the client.`;
      }

      // Simulate streaming if onToken provided
      if (typeof onToken === 'function') {
        const words = mockResponse.split(' ');
        for (const word of words) {
          onToken(word + ' ');
          await new Promise((r) => setTimeout(r, 5));
        }
      }

      return mockResponse;
    }

    const repoContextIntro = `Repository Under Investigation:
Owner: ${repoInfo.owner || 'Unknown'}
Repository: ${repoInfo.name || 'Unknown'}
Language: ${repoInfo.language || 'Unknown'}
Default Branch: ${repoInfo.defaultBranch || 'main'}

RELEVANT REPOSITORY CODE CONTEXT:
${contextText || 'No relevant code chunks found in vector search.'}

--- END OF RETRIEVED REPOSITORY CONTEXT ---
`;

    // Format conversation history for Gemini
    const contents = [];

    // History turns
    for (const msg of conversationHistory.slice(-6)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Current turn with injected context
    const currentPrompt = `${repoContextIntro}

Developer's Question:
"${question}"

Provide a detailed, grounded technical explanation referencing the actual files, line ranges, and functions shown in the repository context above.`;

    contents.push({
      role: 'user',
      parts: [{ text: currentPrompt }],
    });

    const isStreaming = typeof onToken === 'function';

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2500,
      },
    };

    let lastError = null;

    // 429 = rate limit (shared across all models on this API key, so switching model won't help)
    // We use a global retry with exponential backoff for 429 before cycling models
    const MAX_429_RETRIES = 3;
    let global429Count = 0;

    for (const model of this.fallbackModels) {
      const action = isStreaming ? 'streamGenerateContent' : 'generateContent';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}?key=${this.apiKey}`;

      if (isStreaming) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const response = await axios.post(`${url}&alt=sse`, requestBody, {
              responseType: 'stream',
              timeout: 60000,
            });

            let fullText = '';
            return await new Promise((resolve, reject) => {
              let buffer = '';

              response.data.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.slice(6);
                    if (jsonStr === '[DONE]') continue;
                    try {
                      const parsed = JSON.parse(jsonStr);
                      const candidate = parsed.candidates?.[0];
                      const textPart = candidate?.content?.parts?.[0]?.text;
                      if (textPart) {
                        fullText += textPart;
                        onToken(textPart);
                      }
                    } catch {}
                  }
                }
              });

              response.data.on('end', () => resolve(fullText));
              response.data.on('error', (err) => reject(err));
            });
          } catch (streamError) {
            console.warn(`[Gemini Streaming Failed for ${model} (attempt ${attempt})]:`, streamError.message);
            lastError = streamError;
            const status = streamError.response?.status;
            if (status === 429 && global429Count < MAX_429_RETRIES) {
              global429Count++;
              const waitMs = 15000 * global429Count; // 15s, 30s, 45s
              console.warn(`[Gemini 429 Rate Limit. Waiting ${waitMs / 1000}s (retry ${global429Count}/${MAX_429_RETRIES})...]`);
              await new Promise((r) => setTimeout(r, waitMs));
              continue;
            } else if (status === 503 && attempt <= 2) {
              await new Promise((r) => setTimeout(r, 3000));
              continue;
            }
            break; // Move to next model
          }
        }
      }

      // Non-streaming attempt for current model
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const nonStreamingUrl = url.replace(':streamGenerateContent', ':generateContent');
          const res = await axios.post(nonStreamingUrl, requestBody, {
            timeout: 60000,
          });

          const candidate = res.data.candidates?.[0];
          const outputText = candidate?.content?.parts?.map((p) => p.text).join('') || 'Unable to generate response.';

          if (onToken) {
            onToken(outputText);
          }

          return outputText;
        } catch (nonStreamError) {
          console.warn(`[Gemini Non-Streaming Failed for ${model} (attempt ${attempt})]:`, nonStreamError.message);
          lastError = nonStreamError;
          const status = nonStreamError.response?.status;
          if (status === 429 && global429Count < MAX_429_RETRIES) {
            global429Count++;
            const waitMs = 15000 * global429Count; // 15s, 30s, 45s
            console.warn(`[Gemini 429 Rate Limit. Waiting ${waitMs / 1000}s (retry ${global429Count}/${MAX_429_RETRIES})...]`);
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          } else if (status === 503 && attempt <= 2) {
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          break; // Try next model in fallbackModels
        }
      }
    }

    throw lastError || new Error('All Gemini model fallbacks failed.');
  }
}

module.exports = {
  GeminiService,
};
