const { VectorStore } = require('./vectorStore');
const RepoChunk = require('../../models/RepoChunk');

class MongoVectorStore extends VectorStore {
  /**
   * Insert chunks for a repository
   */
  async upsertChunks(repositoryId, userId, chunks) {
    if (!chunks || chunks.length === 0) return 0;

    // First delete any existing chunks for this repository to ensure fresh index
    await this.deleteRepositoryChunks(repositoryId, userId);

    // Prepare documents
    const docs = chunks.map((chunk) => ({
      repositoryId,
      userId,
      owner: chunk.owner,
      repo: chunk.repo,
      branch: chunk.branch || 'main',
      commitSha: chunk.commitSha || '',
      filePath: chunk.filePath,
      fileName: chunk.fileName,
      fileExtension: chunk.fileExtension || '',
      language: chunk.language || 'text',
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding: chunk.embedding,
      embeddingModel: chunk.embeddingModel || 'local',
      tokenCount: chunk.tokenCount || 0,
      symbols: chunk.symbols || [],
    }));

    // Insert in batches of 200
    const BATCH_SIZE = 200;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      await RepoChunk.insertMany(batch, { ordered: false });
    }

    return docs.length;
  }

  /**
   * Search chunks by cosine similarity + keyword hybrid score
   */
  async search(queryVector, filter, topK = 8, options = {}) {
    const { repositoryId, userId } = filter;
    if (!repositoryId || !userId) {
      throw new Error('repositoryId and userId are required to isolate search');
    }

    // Query chunks for this specific repository and user
    const chunks = await RepoChunk.find(
      {
        repositoryId,
        userId,
      },
      {
        repositoryId: 1,
        owner: 1,
        repo: 1,
        branch: 1,
        commitSha: 1,
        filePath: 1,
        fileName: 1,
        language: 1,
        startLine: 1,
        endLine: 1,
        content: 1,
        symbols: 1,
        embedding: 1,
      }
    ).lean();

    if (!chunks || chunks.length === 0) {
      return [];
    }

    const keywords = (options.keywords || []).map((k) => k.toLowerCase());
    const queryDim = queryVector ? queryVector.length : 0;

    // Compute scores for each chunk
    const scoredChunks = chunks.map((chunk) => {
      let vectorScore = 0;

      // Cosine similarity (dot product of normalized vectors)
      if (queryVector && chunk.embedding && chunk.embedding.length === queryDim) {
        let dot = 0;
        const emb = chunk.embedding;
        for (let i = 0; i < queryDim; i++) {
          dot += queryVector[i] * emb[i];
        }
        vectorScore = dot;
      }

      // Lexical / Path / Symbol boost
      let keywordBoost = 0;
      const lowerPath = chunk.filePath.toLowerCase();
      const lowerContent = chunk.content.toLowerCase();

      for (const kw of keywords) {
        if (!kw || kw.length < 2) continue;
        if (lowerPath.includes(kw)) {
          keywordBoost += 0.25; // Matching file path is a strong signal
        }
        if (chunk.symbols && chunk.symbols.some((s) => s.toLowerCase().includes(kw))) {
          keywordBoost += 0.15; // Matching function/class name
        }
        if (lowerContent.includes(kw)) {
          keywordBoost += 0.05;
        }
      }

      const totalScore = vectorScore + keywordBoost;

      return {
        ...chunk,
        score: totalScore,
        vectorScore,
        keywordBoost,
      };
    });

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);

    // Take topK
    const topChunks = scoredChunks.slice(0, topK).map((c) => {
      // Remove raw embedding array to keep payload compact
      delete c.embedding;
      return c;
    });

    return topChunks;
  }

  /**
   * Delete repository chunks
   */
  async deleteRepositoryChunks(repositoryId, userId) {
    return RepoChunk.deleteMany({ repositoryId, userId });
  }
}

module.exports = {
  MongoVectorStore,
};
