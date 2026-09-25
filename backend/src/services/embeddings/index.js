const env = require('../../config/env');
const { LocalEmbeddingProvider } = require('./localEmbedding');
const { GeminiEmbeddingProvider } = require('./geminiEmbedding');
const { OpenAIEmbeddingProvider } = require('./openaiEmbedding');

let defaultProvider = null;

function getEmbeddingProvider(providerType = null) {
  const chosenType = (providerType || env.EMBEDDING_PROVIDER || 'local').toLowerCase();

  if (chosenType === 'gemini' && env.GEMINI_API_KEY) {
    return new GeminiEmbeddingProvider(env.GEMINI_API_KEY);
  }

  if (chosenType === 'openai' && env.OPENAI_API_KEY) {
    return new OpenAIEmbeddingProvider(env.OPENAI_API_KEY);
  }

  // Fallback to high-quality local hashing provider
  if (!defaultProvider) {
    defaultProvider = new LocalEmbeddingProvider();
  }
  return defaultProvider;
}

module.exports = {
  getEmbeddingProvider,
  LocalEmbeddingProvider,
  GeminiEmbeddingProvider,
  OpenAIEmbeddingProvider,
};
