/**
 * Maps common conceptual questions to code keywords, file naming patterns, and symbols
 */
const DOMAIN_EXPANSIONS = {
  auth: ['auth', 'login', 'jwt', 'token', 'session', 'middleware', 'bcrypt', 'password', 'verify', 'oauth', 'register', 'user', 'authenticate', 'authorization', 'bearer'],
  authentication: ['auth', 'login', 'jwt', 'token', 'session', 'middleware', 'bcrypt', 'password', 'verify', 'oauth', 'register', 'user', 'authenticate'],
  authorization: ['auth', 'role', 'permission', 'admin', 'middleware', 'protect', 'rbac', 'access', 'token', 'jwt', 'forbidden'],
  login: ['login', 'auth', 'signin', 'password', 'bcrypt', 'jwt', 'session', 'credentials', 'token', 'user'],
  jwt: ['jwt', 'token', 'sign', 'verify', 'secret', 'bearer', 'authorization', 'payload', 'expires'],
  database: ['database', 'db', 'mongoose', 'schema', 'model', 'connection', 'connect', 'mongo', 'sql', 'query', 'collection'],
  model: ['model', 'schema', 'mongoose.model', 'type', 'interface', 'entity', 'collection', 'user'],
  api: ['api', 'route', 'router', 'controller', 'endpoint', 'handler', 'request', 'response', 'express', 'app.use'],
  route: ['route', 'router', 'routes', 'get', 'post', 'put', 'delete', 'patch', 'endpoint', 'controller'],
  controller: ['controller', 'handle', 'req', 'res', 'service', 'action'],
  frontend: ['frontend', 'client', 'react', 'component', 'page', 'hook', 'state', 'props', 'vite', 'view', 'api.js'],
  backend: ['backend', 'server', 'express', 'api', 'controller', 'middleware', 'route', 'app.js', 'index.js'],
  security: ['security', 'vulnerability', 'csrf', 'xss', 'sanitize', 'injection', 'helmet', 'cors', 'rate', 'salt', 'hash', 'secret'],
  config: ['config', 'configuration', 'env', 'process.env', 'settings', 'options', 'default'],
  middleware: ['middleware', 'next', 'req, res, next', 'use', 'auth', 'cors', 'error', 'logger'],
  folder: ['structure', 'directory', 'src', 'controllers', 'routes', 'models', 'components', 'package.json', 'README.md'],
  architecture: ['architecture', 'overview', 'server', 'index', 'app', 'routes', 'models', 'components', 'package.json', 'README.md'],
};

class QueryExpander {
  /**
   * Expand user question into keywords and extracted target files
   * @param {string} question
   * @returns {{ keywords: Array<string>, targetFiles: Array<string>, expandedQuery: string }}
   */
  expand(question) {
    if (!question || typeof question !== 'string') {
      return { keywords: [], targetFiles: [], expandedQuery: '' };
    }

    const lower = question.toLowerCase();
    const keywords = new Set();
    const targetFiles = [];

    // Extract exact file paths or file names mentioned in question (e.g. `authController.js`, `server.js`)
    const fileMatches = question.match(/[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+/g) || [];
    for (const match of fileMatches) {
      targetFiles.push(match);
      keywords.add(match.toLowerCase());
    }

    // Tokenize question words
    const words = lower.match(/[a-z0-9_]{3,}/g) || [];
    for (const w of words) {
      keywords.add(w);
      if (DOMAIN_EXPANSIONS[w]) {
        for (const exp of DOMAIN_EXPANSIONS[w]) {
          keywords.add(exp);
        }
      }
    }

    // Specific phrase checks
    if (lower.includes('how does auth') || lower.includes('authentication work')) {
      DOMAIN_EXPANSIONS.auth.forEach((k) => keywords.add(k));
    }
    if (lower.includes('folder structure') || lower.includes('project structure')) {
      DOMAIN_EXPANSIONS.folder.forEach((k) => keywords.add(k));
    }
    if (lower.includes('database connection') || lower.includes('connect to db')) {
      DOMAIN_EXPANSIONS.database.forEach((k) => keywords.add(k));
    }

    const keywordList = Array.from(keywords);
    const expandedQuery = `${question} ${keywordList.slice(0, 15).join(' ')}`;

    return {
      keywords: keywordList,
      targetFiles,
      expandedQuery,
    };
  }
}

module.exports = {
  QueryExpander,
  defaultQueryExpander: new QueryExpander(),
};
