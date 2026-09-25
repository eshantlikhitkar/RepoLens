const path = require('path');

// Directories to strictly ignore
const DEFAULT_IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.github',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  'vendor',
  'target',
  'bin',
  'obj',
  '.idea',
  '.vscode',
  '.turbo',
  'venv',
  '.venv',
  '__pycache__',
  'out',
  'tmp',
  'temp',
  'public',
]);

// Binary / media / asset extensions to ignore
const DEFAULT_IGNORED_EXTENSIONS = new Set([
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.bmp', '.tiff',
  // Videos / Audio
  '.mp4', '.mp3', '.wav', '.mov', '.avi', '.ogg', '.flac',
  // Archives / Binaries
  '.zip', '.tar', '.gz', '.7z', '.rar', '.exe', '.dll', '.so', '.dylib', '.bin',
  // Documents / Data binaries
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Fonts
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  // Source maps & database dumps
  '.map', '.sqlite', '.db', '.pcap', '.parquet',
  // Compiled code
  '.pyc', '.pyo', '.class', '.o', '.a',
]);

// Lock files that add noise without semantic value
const DEFAULT_IGNORED_FILENAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'npm-shrinkwrap.json',
  'composer.lock',
  'Gemfile.lock',
  'Cargo.lock',
  'poetry.lock',
  'mix.lock',
  '.DS_Store',
  'Thumbs.db',
]);

// High-priority manifest & documentation files to index first
const PRIORITY_MANIFESTS = new Set([
  'package.json',
  'requirements.txt',
  'pom.xml',
  'build.gradle',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  'Gemfile',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'Makefile',
  'tsconfig.json',
  '.env.example',
]);

const LANGUAGE_MAP = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.xml': 'xml',
  '.proto': 'protobuf',
  '.toml': 'toml',
};

class FileFilter {
  constructor(customConfig = {}) {
    this.ignoredDirs = new Set([...DEFAULT_IGNORED_DIRS, ...(customConfig.ignoredDirs || [])]);
    this.ignoredExtensions = new Set([...DEFAULT_IGNORED_EXTENSIONS, ...(customConfig.ignoredExtensions || [])]);
    this.ignoredFilenames = new Set([...DEFAULT_IGNORED_FILENAMES, ...(customConfig.ignoredFilenames || [])]);
    this.maxFileSize = customConfig.maxFileSize || 200 * 1024; // 200 KB
  }

  /**
   * Determine whether a file path should be indexed
   * @param {string} filePath
   * @param {number} size
   * @returns {boolean}
   */
  isIndexable(filePath, size = 0) {
    if (!filePath) return false;

    // Check size limit
    if (size > this.maxFileSize) {
      return false;
    }

    const normalized = filePath.replace(/\\/g, '/');
    const segments = normalized.split('/');
    const fileName = segments[segments.length - 1];
    const ext = path.extname(fileName).toLowerCase();

    // Check ignored directories
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i].toLowerCase();
      if (this.ignoredDirs.has(seg) || seg.startsWith('.')) {
        return false;
      }
    }

    // Check specific ignored filenames
    if (this.ignoredFilenames.has(fileName)) {
      return false;
    }

    // Check ignored extensions
    if (this.ignoredExtensions.has(ext)) {
      return false;
    }

    // Allow manifests even if they have weird extensions
    if (PRIORITY_MANIFESTS.has(fileName)) {
      return true;
    }

    // Allow documentation
    if (fileName.toLowerCase().startsWith('readme') || fileName.toLowerCase().startsWith('contributing')) {
      return true;
    }

    // Must have a recognized language extension or be in a docs directory
    if (LANGUAGE_MAP[ext] || segments.includes('docs')) {
      return true;
    }

    // Ignore dotfiles like .eslintrc, .prettierrc unless standard
    if (fileName.startsWith('.') && !['.env.example', '.gitignore'].includes(fileName)) {
      return false;
    }

    return true;
  }

  /**
   * Detect programming language of a file
   * @param {string} filePath
   * @returns {string}
   */
  getLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();

    if (fileName === 'dockerfile') return 'dockerfile';
    if (fileName === 'makefile') return 'makefile';
    if (fileName === 'gemfile') return 'ruby';

    return LANGUAGE_MAP[ext] || 'text';
  }

  /**
   * Check if file is a priority architectural manifest or doc
   * @param {string} filePath
   * @returns {boolean}
   */
  isPriorityFile(filePath) {
    const fileName = path.basename(filePath);
    return (
      PRIORITY_MANIFESTS.has(fileName) ||
      fileName.toLowerCase().startsWith('readme') ||
      fileName.toLowerCase().startsWith('contributing')
    );
  }
}

module.exports = {
  FileFilter,
  defaultFileFilter: new FileFilter(),
  LANGUAGE_MAP,
  PRIORITY_MANIFESTS,
};
