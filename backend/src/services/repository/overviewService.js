/**
 * Analyzes repository chunks and files to generate a grounded architectural overview
 * @param {Array<object>} chunks - Indexed repository chunks
 * @param {object} repo - Repository document
 * @returns {object} - Repository Overview specification
 */
async function generateRepositoryOverview(chunks, repo) {
  const allPaths = [...new Set(chunks.map((c) => c.filePath))];
  const fileContents = new Map();

  for (const c of chunks) {
    if (!fileContents.has(c.filePath)) {
      fileContents.set(c.filePath, c.content);
    }
  }

  // 1. Analyze package.json or requirements.txt
  let dependencies = {};
  const packageJsonChunk = chunks.find((c) => c.fileName === 'package.json');
  if (packageJsonChunk) {
    try {
      const parsed = JSON.parse(packageJsonChunk.content);
      dependencies = {
        ...(parsed.dependencies || {}),
        ...(parsed.devDependencies || {}),
      };
    } catch {
      // Ignore parse failure on snippet
    }
  }

  const technologies = new Set();
  if (repo.language) technologies.add(repo.language);

  // Check frontend technologies
  let frontend = 'None detected';
  if (dependencies['react'] || allPaths.some((p) => /\.(jsx|tsx)$/.test(p))) {
    frontend = dependencies['vite'] ? 'React + Vite' : dependencies['next'] ? 'Next.js (React)' : 'React';
    technologies.add('React');
  } else if (dependencies['vue'] || allPaths.some((p) => /\.vue$/.test(p))) {
    frontend = 'Vue.js';
    technologies.add('Vue');
  } else if (dependencies['@angular/core']) {
    frontend = 'Angular';
    technologies.add('Angular');
  }

  // Check backend technologies
  let backend = 'None detected';
  if (dependencies['express']) {
    backend = 'Node.js + Express';
    technologies.add('Express');
    technologies.add('Node.js');
  } else if (dependencies['fastify']) {
    backend = 'Node.js + Fastify';
    technologies.add('Fastify');
  } else if (dependencies['@nestjs/core']) {
    backend = 'NestJS';
    technologies.add('NestJS');
  } else if (allPaths.some((p) => p.endsWith('.py'))) {
    backend = 'Python';
    technologies.add('Python');
  } else if (allPaths.some((p) => p.endsWith('.go'))) {
    backend = 'Go';
    technologies.add('Go');
  }

  // Check database
  let database = 'None detected';
  if (dependencies['mongoose'] || dependencies['mongodb']) {
    database = 'MongoDB (via Mongoose)';
    technologies.add('MongoDB');
  } else if (dependencies['pg'] || dependencies['postgres']) {
    database = 'PostgreSQL';
    technologies.add('PostgreSQL');
  } else if (dependencies['mysql'] || dependencies['mysql2']) {
    database = 'MySQL';
    technologies.add('MySQL');
  } else if (dependencies['prisma'] || dependencies['@prisma/client']) {
    database = 'Prisma ORM';
    technologies.add('Prisma');
  }

  // Check authentication
  let authentication = 'Not explicitly defined';
  if (dependencies['jsonwebtoken'] || dependencies['jwt-simple']) {
    authentication = dependencies['bcrypt'] || dependencies['bcryptjs'] ? 'JWT + bcrypt password hashing' : 'JWT (JSON Web Tokens)';
    technologies.add('JWT');
  } else if (dependencies['passport']) {
    authentication = 'Passport.js';
    technologies.add('Passport');
  } else if (dependencies['next-auth']) {
    authentication = 'NextAuth.js';
    technologies.add('NextAuth');
  }

  // Check API layer
  let apiLayer = 'REST Endpoints';
  if (dependencies['graphql'] || dependencies['@apollo/server']) {
    apiLayer = 'GraphQL';
    technologies.add('GraphQL');
  } else if (dependencies['@trpc/server']) {
    apiLayer = 'tRPC';
    technologies.add('tRPC');
  }

  // Check testing
  let testing = 'None detected';
  if (dependencies['jest'] || dependencies['@jest/core']) {
    testing = 'Jest';
    technologies.add('Jest');
  } else if (dependencies['vitest']) {
    testing = 'Vitest';
    technologies.add('Vitest');
  } else if (dependencies['mocha']) {
    testing = 'Mocha';
    technologies.add('Mocha');
  } else if (allPaths.some((p) => p.includes('test') || p.includes('spec'))) {
    testing = 'Unit/Integration Tests';
  }

  // Check deployment & containerization
  let deployment = 'Standard Node.js / Cloud Hosting';
  if (allPaths.some((p) => /dockerfile/i.test(p))) {
    deployment = 'Docker Containerized';
    technologies.add('Docker');
  } else if (allPaths.some((p) => /vercel\.json/i.test(p))) {
    deployment = 'Vercel Serverless';
  } else if (allPaths.some((p) => /procfile/i.test(p))) {
    deployment = 'Heroku / Procfile';
  }

  // Check configuration
  let configuration = 'Environment variables';
  if (dependencies['dotenv']) {
    configuration = 'Dotenv (.env) + process.env';
  }
  if (allPaths.some((p) => p === '.env.example')) {
    configuration += ' with .env.example template';
  }

  // Identify entry points
  const candidateEntryPoints = ['server.js', 'index.js', 'app.js', 'src/server.js', 'src/index.js', 'src/app.js', 'src/main.jsx', 'src/index.jsx', 'src/App.jsx', 'main.py', 'app.py', 'main.go'];
  const entryPoints = allPaths.filter((p) => candidateEntryPoints.includes(p) || p.endsWith('/index.js') || p.endsWith('/main.jsx'));

  // Identify key directories
  const directories = new Set();
  for (const p of allPaths) {
    const parts = p.split('/');
    if (parts.length > 1) {
      directories.add(parts.slice(0, Math.min(2, parts.length - 1)).join('/'));
    }
  }
  const keyDirectories = Array.from(directories).slice(0, 8);

  // Overall project type
  let projectType = 'Application';
  if (frontend !== 'None detected' && backend !== 'None detected') {
    projectType = 'Full-Stack Web Application (MERN/Full-Stack)';
  } else if (backend !== 'None detected') {
    projectType = 'Backend API Service';
  } else if (frontend !== 'None detected') {
    projectType = 'Frontend Web Application';
  } else if (packageJsonChunk) {
    projectType = 'Node.js Package / Module';
  }

  return {
    projectType,
    technologies: Array.from(technologies),
    frontend,
    backend,
    database,
    authentication,
    apiLayer,
    testing,
    deployment,
    configuration,
    keyDirectories,
    entryPoints: entryPoints.slice(0, 6),
    summary: `${projectType} built with ${Array.from(technologies).join(', ') || 'modern web technologies'}. Includes ${allPaths.length} indexed files.`,
    updatedAt: new Date(),
  };
}

module.exports = {
  generateRepositoryOverview,
};
