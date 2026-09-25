const axios = require('axios');
const { AIService, SYSTEM_PROMPT } = require('./aiProvider');

class OpenAIService extends AIService {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.model = 'gpt-4o-mini';
  }

  getName() {
    return 'openai';
  }

  async generateInvestigation({ question, contextText, conversationHistory = [], repoInfo = {}, onToken = null }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is missing');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    for (const msg of conversationHistory.slice(-6)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    const userPrompt = `Repository Under Investigation:
${repoInfo.owner}/${repoInfo.name} (${repoInfo.language || 'Codebase'})

RELEVANT REPOSITORY CODE CONTEXT:
${contextText || 'No relevant code chunks found.'}

Developer's Question:
"${question}"

Provide a detailed, grounded technical explanation referencing actual files and line ranges.`;

    messages.push({ role: 'user', content: userPrompt });

    const isStreaming = typeof onToken === 'function';

    if (isStreaming) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages,
          stream: true,
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout: 45000,
        }
      );

      let fullText = '';
      return new Promise((resolve, reject) => {
        let buffer = '';

        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  onToken(delta);
                }
              } catch {}
            }
          }
        });

        response.data.on('end', () => resolve(fullText));
        response.data.on('error', (err) => reject(err));
      });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.model,
        messages,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const answer = response.data.choices?.[0]?.message?.content || 'Unable to generate response.';
    if (onToken) onToken(answer);
    return answer;
  }
}

module.exports = {
  OpenAIService,
};
