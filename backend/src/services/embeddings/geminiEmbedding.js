const { EmbeddingProvider } = require('./embeddingProvider');
const axios = require('axios');

class GeminiEmbeddingProvider extends EmbeddingProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.model = 'gemini-embedding-001';
  }

  getName() {
    return 'gemini';
  }

  getDimension() {
    return 3072;
  }

  async embedText(text) {
    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }

    const candidateModels = [this.model, 'gemini-embedding-2'];
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${this.apiKey}`;
        const response = await axios.post(
          url,
          {
            model: `models/${model}`,
            content: {
              parts: [{ text: text.slice(0, 10000) }],
            },
          },
          { timeout: 10000 }
        );

        const embedding = response.data?.embedding?.values;
        if (embedding && Array.isArray(embedding)) {
          this.model = model;
          return embedding;
        }
      } catch (error) {
        lastError = error;
        console.warn(`[Gemini Embedding] Model ${model} failed (${error.response?.status || error.message}), trying next...`);
      }
    }

    console.error('[Gemini Embedding Error]:', lastError?.response?.data || lastError?.message);
    throw lastError || new Error('Failed to generate embedding with Gemini');
  }

  async embedBatch(texts) {
    // Process batch sequentially or in small chunks of 5 to avoid rate limits
    const results = [];
    for (let i = 0; i < texts.length; i++) {
      const vec = await this.embedText(texts[i]);
      results.push(vec);
      // Small delay between calls
      if (i < texts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    }
    return results;
  }
}

module.exports = {
  GeminiEmbeddingProvider,
};
