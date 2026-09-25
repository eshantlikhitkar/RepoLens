const env = require('../../config/env');
const { GeminiService } = require('./geminiService');
const { OpenAIService } = require('./openaiService');
const { MockAiService } = require('./mockAiService');

let defaultAIService = null;

function getAIService(providerType = null) {
  const chosen = (providerType || env.AI_PROVIDER || 'mock').toLowerCase();

  if (chosen === 'gemini' && env.GEMINI_API_KEY) {
    return new GeminiService(env.GEMINI_API_KEY);
  }

  if (chosen === 'openai' && env.OPENAI_API_KEY) {
    return new OpenAIService(env.OPENAI_API_KEY);
  }

  if (!defaultAIService) {
    defaultAIService = new MockAiService();
  }
  return defaultAIService;
}

module.exports = {
  getAIService,
  GeminiService,
  OpenAIService,
  MockAiService,
};
