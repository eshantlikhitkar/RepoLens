const crypto = require('crypto');
const { EmbeddingProvider } = require('./embeddingProvider');

const DIMENSION = 384;

/**
 * High-performance deterministic semantic embedding generator for local / offline development.
 * Produces 384-dimensional unit-normalized dense vectors using subword tokenization and hashed projections.
 */
class LocalEmbeddingProvider extends EmbeddingProvider {
  constructor() {
    super();
  }

  getName() {
    return 'local-hashing';
  }

  getDimension() {
    return DIMENSION;
  }

  /**
   * Embed a single text string
   */
  async embedText(text) {
    return this.generateVector(text);
  }

  /**
   * Embed a batch of texts
   */
  async embedBatch(texts) {
    return texts.map((t) => this.generateVector(t));
  }

  /**
   * Generates a 384-dimensional dense vector with L2 normalization
   */
  generateVector(text) {
    const vector = new Float32Array(DIMENSION);
    if (!text || typeof text !== 'string') {
      return Array.from(vector);
    }

    // Split text into tokens (camelCase, snake_case, words, symbols)
    const normalized = text.toLowerCase();
    const tokens = normalized.match(/[a-z0-9_]{2,}/g) || [];

    // Also extract character n-grams (3-grams, 4-grams) for subword semantic matching
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Whole token weight
      this.hashIntoVector(token, vector, 1.5);

      // Subwords
      if (token.length > 4) {
        for (let j = 0; j <= token.length - 3; j++) {
          const gram = token.slice(j, j + 3);
          this.hashIntoVector(gram, vector, 0.4);
        }
      }
    }

    // L2 Normalize
    let sumSq = 0;
    for (let i = 0; i < DIMENSION; i++) {
      sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < DIMENSION; i++) {
        vector[i] /= norm;
      }
    }

    return Array.from(vector);
  }

  hashIntoVector(str, vector, weight = 1.0) {
    // Generate two independent hashes using SHA-256
    const hash = crypto.createHash('sha256').update(str).digest();
    const idx1 = (hash.readUInt16BE(0) ^ hash.readUInt16BE(4)) % DIMENSION;
    const idx2 = (hash.readUInt16BE(8) ^ hash.readUInt16BE(12)) % DIMENSION;
    const sign1 = (hash[2] & 1) === 0 ? 1 : -1;
    const sign2 = (hash[6] & 1) === 0 ? 1 : -1;

    vector[idx1] += sign1 * weight;
    vector[idx2] += sign2 * (weight * 0.7);
  }
}

module.exports = {
  LocalEmbeddingProvider,
};
