const mongoose = require('mongoose');

const repoChunkSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
    },
    repo: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      default: 'main',
    },
    commitSha: {
      type: String,
      default: '',
    },
    filePath: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileExtension: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'text',
      index: true,
    },
    startLine: {
      type: Number,
      required: true,
    },
    endLine: {
      type: Number,
      required: true,
    },
    chunkIndex: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: true,
    },
    // Vector embedding representation
    embedding: {
      type: [Number],
      default: undefined,
    },
    embeddingModel: {
      type: String,
      default: 'local',
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    symbols: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Compound index for querying chunks by repo and user
repoChunkSchema.index({ repositoryId: 1, userId: 1 });
repoChunkSchema.index({ repositoryId: 1, filePath: 1 });

module.exports = mongoose.model('RepoChunk', repoChunkSchema);
