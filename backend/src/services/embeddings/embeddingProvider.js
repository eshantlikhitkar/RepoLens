class EmbeddingProvider {
  /**
   * Embed a single string of text
   * @param {string} text
   * @returns {Promise<Array<number>>}
   */
  async embedText(text) {
    throw new Error('embedText() must be implemented by subclass');
  }

  /**
   * Embed a batch of text strings
   * @param {Array<string>} texts
   * @returns {Promise<Array<Array<number>>>}
   */
  async embedBatch(texts) {
    throw new Error('embedBatch() must be implemented by subclass');
  }

  /**
   * Dimension of generated vectors
   * @returns {number}
   */
  getDimension() {
    return 768;
  }

  /**
   * Provider identifier
   * @returns {string}
   */
  getName() {
    return 'generic';
  }
}

module.exports = { EmbeddingProvider };
