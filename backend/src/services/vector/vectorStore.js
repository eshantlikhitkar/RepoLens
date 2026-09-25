class VectorStore {
  /**
   * Save / index an array of chunks
   * @param {string} repositoryId
   * @param {string} userId
   * @param {Array<object>} chunks
   */
  async upsertChunks(repositoryId, userId, chunks) {
    throw new Error('upsertChunks() must be implemented');
  }

  /**
   * Perform vector similarity search
   * @param {Array<number>} queryVector
   * @param {object} filter - { repositoryId, userId }
   * @param {number} topK
   * @param {object} options - { keywords?: Array<string> }
   * @returns {Promise<Array<object>>} - Chunks with similarity score
   */
  async search(queryVector, filter, topK = 8, options = {}) {
    throw new Error('search() must be implemented');
  }

  /**
   * Delete all chunks for a repository
   */
  async deleteRepositoryChunks(repositoryId, userId) {
    throw new Error('deleteRepositoryChunks() must be implemented');
  }
}

module.exports = { VectorStore };
