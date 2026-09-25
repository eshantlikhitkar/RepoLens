const { defaultQueryExpander } = require('./queryExpander');
const { getEmbeddingProvider } = require('../embeddings');
const { getVectorStore } = require('../vector');

class RAGPipeline {
  constructor(options = {}) {
    this.topK = options.topK || 8;
    this.vectorStore = options.vectorStore || getVectorStore();
    this.embeddingProvider = options.embeddingProvider || getEmbeddingProvider();
    this.queryExpander = options.queryExpander || defaultQueryExpander;
  }

  /**
   * Retrieve relevant chunks from the repository for a given user question
   * @param {object} params - { question, repositoryId, userId, repoInfo }
   * @returns {Promise<{ chunks: Array<object>, contextText: string, citations: Array<object> }>}
   */
  async retrieveContext(params) {
    const { question, repositoryId, userId, repoInfo = {} } = params;

    // 1. Expand question
    const expansion = this.queryExpander.expand(question);

    // 2. Embed the expanded query
    const queryVector = await this.embeddingProvider.embedText(expansion.expandedQuery || question);

    // 3. Search vector store
    const rawChunks = await this.vectorStore.search(
      queryVector,
      { repositoryId, userId },
      this.topK,
      {
        keywords: expansion.keywords,
        targetFiles: expansion.targetFiles,
      }
    );

    // 4. Format citations and context
    const citations = [];
    const formattedChunkTexts = [];

    const githubBaseUrl = repoInfo.githubUrl || '';
    const branch = repoInfo.defaultBranch || 'main';

    for (let i = 0; i < rawChunks.length; i++) {
      const c = rawChunks[i];

      const githubUrl = githubBaseUrl
        ? `${githubBaseUrl}/blob/${c.branch || branch}/${c.filePath}#L${c.startLine}-L${c.endLine}`
        : '';

      const citation = {
        filePath: c.filePath,
        startLine: c.startLine,
        endLine: c.endLine,
        language: c.language || 'text',
        snippet: c.content.slice(0, 200),
        githubUrl,
      };
      citations.push(citation);

      // Build context text with strict demarcation for prompt injection defense
      formattedChunkTexts.push(
        `--- BEGIN REPOSITORY FILE CHUNK [File: ${c.filePath} | Lines: ${c.startLine}-${c.endLine} | Language: ${c.language}] ---
${c.content}
--- END REPOSITORY FILE CHUNK ---`
      );
    }

    const contextText = formattedChunkTexts.join('\n\n');

    return {
      chunks: rawChunks,
      citations,
      contextText,
      expansion,
    };
  }
}

module.exports = {
  RAGPipeline,
  defaultRAGPipeline: new RAGPipeline(),
};
