/**
 * Demo repositories and realistic code files for demo / offline mode
 */

const DEMO_REPOSITORIES = [
  {
    githubRepoId: '98234101',
    name: 'job-portal-mern',
    owner: 'octocat',
    fullName: 'octocat/job-portal-mern',
    description: 'Production-ready MERN stack job portal with JWT auth, resume uploads, and role-based permissions',
    defaultBranch: 'main',
    private: false,
    language: 'JavaScript',
    stars: 342,
    forks: 88,
    githubUrl: 'https://github.com/octocat/job-portal-mern',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-10T12:00:00Z',
  },
  {
    githubRepoId: '98234102',
    name: 'auth-service-api',
    owner: 'octocat',
    fullName: 'octocat/auth-service-api',
    description: 'Microservice for authentication, OAuth2, and session token rotation with Redis and MongoDB',
    defaultBranch: 'main',
    private: true,
    language: 'TypeScript',
    stars: 128,
    forks: 19,
    githubUrl: 'https://github.com/octocat/auth-service-api',
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-03-15T09:30:00Z',
  },
  {
    githubRepoId: '98234103',
    name: 'dev-lens-dashboard',
    owner: 'octocat',
    fullName: 'octocat/dev-lens-dashboard',
    description: 'Developer analytics dashboard built with React 18, Vite, Tailwind CSS, and Chart.js',
    defaultBranch: 'main',
    private: false,
    language: 'TypeScript',
    stars: 520,
    forks: 64,
    githubUrl: 'https://github.com/octocat/dev-lens-dashboard',
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-05-20T14:15:00Z',
  },
];

const DEMO_FILES = {
  'octocat/job-portal-mern': {
    'package.json': `{
  "name": "job-portal-mern",
  "version": "1.0.0",
  "description": "Full-stack MERN job portal application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "server": "nodemon server.js",
    "client": "npm start --prefix client",
    "dev": "concurrently \\"npm run server\\" \\"npm run client\\""
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.0",
    "multer": "^1.4.5-lts.1"
  }
}`,
    'README.md': `# Job Portal (MERN Stack)

A comprehensive job search and application platform.

## Features
- JWT-based authentication with bcrypt password hashing
- Role-based authorization for Job Seekers and Employers
- Job postings, application tracking, and profile resumes
- MongoDB schema validation and indexing

## Architecture Overview
- **Backend Entry Point**: \`server.js\`
- **Database Connection**: \`config/db.js\`
- **Authentication Controller**: \`src/controllers/authController.js\`
- **Auth Middleware**: \`src/middleware/auth.js\`
- **User Model**: \`src/models/User.js\`
- **Job Routes**: \`src/routes/jobs.js\`
`,
    'server.js': `const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/jobs', require('./src/routes/jobs'));
app.use('/api/users', require('./src/routes/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`Job Portal Server listening on port \${PORT}\`);
});
`,
    'config/db.js': `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Database connection error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;
`,
    'src/routes/auth.js': `const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes requiring valid JWT
router.get('/me', protect, getCurrentUser);

module.exports = router;
`,
    'src/controllers/authController.js': `const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token helper
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Salt and hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'jobseeker',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  generateToken,
};
`,
    'src/middleware/auth.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes and verify Bearer JWT token
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user from database to request
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed verification' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

/**
 * Middleware for role-based authorization
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: \`User role \${req.user.role} is not authorized to access this route\`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
`,
    'src/models/User.js': `const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['jobseeker', 'employer', 'admin'],
      default: 'jobseeker',
    },
    skills: [{ type: String }],
    resumeUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
`,
    'src/routes/jobs.js': `const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Public route: search all jobs
router.get('/', (req, res) => {
  res.json({ jobs: [], message: 'List of all active job postings' });
});

// Employer-only route: post new job
router.post('/', protect, authorize('employer', 'admin'), (req, res) => {
  res.status(201).json({ message: 'Job created successfully' });
});

module.exports = router;
`,
  },
  'octocat/auth-service-api': {
    'package.json': `{
  "name": "auth-service-api",
  "version": "1.0.0",
  "description": "High-throughput token authentication and session service",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev src/index.ts"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "ioredis": "^5.4.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}`,
    'README.md': `# Auth Service API

High-performance token rotation and session management service.

## Core Architecture
- **Entry point**: \`src/index.ts\`
- **Redis Connection**: \`src/config/redis.ts\`
- **Token Controller**: \`src/controllers/tokenController.ts\`
- **Session Service**: \`src/services/sessionService.ts\`
`,
    'src/index.ts': `import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { tokenRouter } from './controllers/tokenController';

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/tokens', tokenRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(\`Auth Service API running on port \${PORT}\`);
});
`,
    'src/config/redis.ts': `import Redis from 'ioredis';

export const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully for token revocation cache');
});
`,
    'src/controllers/tokenController.ts': `import { Router, Request, Response } from 'express';
import { generateAccessToken, revokeSessionToken } from '../services/sessionService';

export const tokenRouter = Router();

tokenRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const newAccessToken = await generateAccessToken(refreshToken);
    res.json({ accessToken: newAccessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

tokenRouter.post('/revoke', async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  await revokeSessionToken(sessionId);
  res.json({ success: true, message: 'Session invalidated' });
});
`,
    'src/services/sessionService.ts': `import jwt from 'jsonwebtoken';
import { redisClient } from '../config/redis';

export async function generateAccessToken(refreshToken: string): Promise<string> {
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'secret') as any;
  const isRevoked = await redisClient.get(\`revoked:\${decoded.sessionId}\`);

  if (isRevoked) {
    throw new Error('Session has been revoked');
  }

  return jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET || 'jwt_secret', {
    expiresIn: '15m',
  });
}

export async function revokeSessionToken(sessionId: string): Promise<void> {
  await redisClient.set(\`revoked:\${sessionId}\`, 'true', 'EX', 7 * 24 * 60 * 60);
}
`,
  },
  'octocat/dev-lens-dashboard': {
    'package.json': `{
  "name": "dev-lens-dashboard",
  "version": "1.0.0",
  "description": "Developer metrics and code insight dashboard",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "chart.js": "^4.4.3",
    "lucide-react": "^0.395.0",
    "react": "^18.3.1",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.4",
    "vite": "^5.2.11"
  }
}`,
    'README.md': `# DevLens Analytics Dashboard

Interactive dashboard for developer productivity and pull request tracking.
Built with React, Vite, Tailwind CSS, and Chart.js.
`,
    'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    'src/App.tsx': `import React from 'react';
import { MetricCard } from './components/MetricCard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Engineering Health Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Active PRs" value="14" change="+2 from yesterday" />
        <MetricCard title="Merge Time" value="4.2 hrs" change="-1.1 hrs" />
        <MetricCard title="Test Coverage" value="89.4%" change="+0.5%" />
      </div>
    </div>
  );
}
`,
    'src/components/MetricCard.tsx': `import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
}

export function MetricCard({ title, value, change }: MetricCardProps) {
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-sm text-slate-400">{title}</h3>
      <p className="text-2xl font-bold my-2">{value}</p>
      <span className="text-xs text-emerald-400">{change}</span>
    </div>
  );
}
`,
  },
};

function getDemoRepositories() {
  return DEMO_REPOSITORIES;
}

function getDemoFileTree(fullName) {
  const repoFiles = DEMO_FILES[fullName] || DEMO_FILES['octocat/job-portal-mern'];
  const paths = Object.keys(repoFiles);

  const tree = [];
  const addedDirs = new Set();

  for (const p of paths) {
    const parts = p.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      if (!addedDirs.has(currentPath)) {
        addedDirs.add(currentPath);
        tree.push({
          path: currentPath,
          mode: '040000',
          type: 'tree',
          sha: `dir_${currentPath}`,
        });
      }
    }

    tree.push({
      path: p,
      mode: '100644',
      type: 'blob',
      sha: `sha_${p.replace(/[^a-zA-Z0-9]/g, '_')}`,
      size: repoFiles[p].length,
    });
  }

  return tree;
}

function getDemoFileContent(fullName, filePath) {
  const repoFiles = DEMO_FILES[fullName] || DEMO_FILES['octocat/job-portal-mern'];
  const content = repoFiles[filePath];

  if (content === undefined) {
    throw new Error(`File not found: ${filePath}`);
  }

  return {
    content,
    size: content.length,
    sha: `sha_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
    path: filePath,
  };
}

module.exports = {
  DEMO_REPOSITORIES,
  DEMO_FILES,
  getDemoRepositories,
  getDemoFileTree,
  getDemoFileContent,
};
