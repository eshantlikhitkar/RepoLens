const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    // Stored strictly encrypted with AES-256-GCM
    githubAccessToken: {
      type: String,
      select: false, // Do not return by default in queries
    },
    isDemoUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Method to safely set encrypted GitHub token
userSchema.methods.setToken = function (token) {
  if (token) {
    this.githubAccessToken = encrypt(token);
  }
};

// Method to get decrypted token for backend GitHub API calls
userSchema.methods.getToken = function () {
  if (!this.githubAccessToken) return null;
  return decrypt(this.githubAccessToken);
};

// Method to return safe JSON (never leaks token)
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    githubId: this.githubId,
    username: this.username,
    displayName: this.displayName || this.username,
    avatarUrl: this.avatarUrl,
    email: this.email,
    isDemoUser: this.isDemoUser,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
