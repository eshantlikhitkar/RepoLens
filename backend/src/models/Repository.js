const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema(
  {
    githubRepoId: {
      type: String,
      required: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    private: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: 'Unknown',
    },
    stars: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    githubUrl: {
      type: String,
      default: '',
    },
    lastIndexedCommit: {
      type: String,
      default: '',
    },
    indexingStatus: {
      type: String,
      enum: ['not_indexed', 'indexing', 'indexed', 'failed'],
      default: 'not_indexed',
      index: true,
    },
    indexingProgress: {
      step: { type: String, default: 'Idle' },
      currentStepIndex: { type: Number, default: 0 },
      totalSteps: { type: Number, default: 6 },
      processedFiles: { type: Number, default: 0 },
      totalFiles: { type: Number, default: 0 },
      message: { type: String, default: '' },
      error: { type: String, default: '' },
      percentage: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
    },
    overview: {
      projectType: { type: String, default: '' },
      technologies: [{ type: String }],
      frontend: { type: String, default: '' },
      backend: { type: String, default: '' },
      database: { type: String, default: '' },
      authentication: { type: String, default: '' },
      apiLayer: { type: String, default: '' },
      keyDirectories: [{ type: String }],
      entryPoints: [{ type: String }],
      summary: { type: String, default: '' },
      updatedAt: { type: Date },
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per user and repo
repositorySchema.index({ userId: 1, fullName: 1 }, { unique: true });

module.exports = mongoose.model('Repository', repositorySchema);
