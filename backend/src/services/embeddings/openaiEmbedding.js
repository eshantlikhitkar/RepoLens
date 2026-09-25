const { EmbeddingProvider } = require('./embeddingProvider');
const axios = require('axios');

class OpenAIEmbeddingProvider extends EmbeddingProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.model = 'text-embedding-3-small';
  }

  getName() {
    return 'openai';
  }

  getDimension() {
    return 1536;
  }

  async embedText(text) {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: this.model,
          input: texts.map((t) => t.slice(0, 8000)),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return response.data.data.map((item) => item.embedding);
    } catch (error) {
      console.error('[OpenAI Embedding Error]:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = {
  OpenAIEmbeddingProvider,
};
