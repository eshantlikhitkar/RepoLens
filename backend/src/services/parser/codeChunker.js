const path = require('path');

// Patterns that typically denote logical boundaries in code
const CODE_BOUNDARY_PATTERNS = [
  /^(export\s+)?(async\s+)?function\s+([a-zA-Z0-9_$]+)/,
  /^(export\s+)?class\s+([a-zA-Z0-9_$]+)/,
  /^(export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(async\s*)?\(/,
  /^(export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*function/,
  /^(router|app)\.(get|post|put|delete|patch|use)\s*\(/,
  /^\s*(def|class|async\s+def)\s+([a-zA-Z0-9_]+)/, // Python
  /^\s*(pub\s+)?fn\s+([a-zA-Z0-9_]+)/,            // Rust
  /^\s*func\s+([a-zA-Z0-9_]+)/,                   // Go
  /^\s*(public|private|protected)?\s*(static\s+)?(async\s+)?([a-zA-Z0-9_<>]+)\s+([a-zA-Z0-9_]+)\s*\(/, // Java / C#
];

const MARKDOWN_HEADER_PATTERN = /^#{1,4}\s+(.+)$/;

class CodeChunker {
  constructor(options = {}) {
    this.targetChunkLines = options.targetChunkLines || 50;
    this.maxChunkLines = options.maxChunkLines || 100;
    this.minChunkLines = options.minChunkLines || 10;
    this.overlapLines = options.overlapLines || 8;
  }

  /**
   * Split a file's content into semantic, code-aware chunks
   * @param {string} content - Raw source code or document
   * @param {object} metadata - File metadata (filePath, language, repo, owner, etc.)
   * @returns {Array<object>} - Array of chunk objects with startLine and endLine
   */
  chunkFile(content, metadata = {}) {
    if (!content || typeof content !== 'string') return [];

    const lines = content.split(/\r?\n/);
    const totalLines = lines.length;

    // If file is small, keep as a single chunk
    if (totalLines <= this.maxChunkLines) {
      return [
        {
          ...metadata,
          startLine: 1,
          endLine: totalLines,
          chunkIndex: 0,
          content: lines.join('\n'),
          fileName: path.basename(metadata.filePath || ''),
          symbols: this.extractSymbols(lines),
        },
      ];
    }

    const language = metadata.language || 'text';
    if (language === 'markdown') {
      return this.chunkMarkdown(lines, metadata);
    }

    return this.chunkCode(lines, metadata);
  }

  /**
   * Chunk code files by finding natural block/function boundaries
   */
  chunkCode(lines, metadata) {
    const chunks = [];
    let currentStart = 0;
    let chunkIndex = 0;

    while (currentStart < lines.length) {
      let idealEnd = Math.min(currentStart + this.targetChunkLines, lines.length);

      // Look for a natural boundary near idealEnd (within window of +/- 15 lines)
      let bestEnd = idealEnd;
      const searchStart = Math.max(currentStart + this.minChunkLines, idealEnd - 15);
      const searchEnd = Math.min(lines.length, idealEnd + 15);

      for (let i = searchStart; i < searchEnd; i++) {
        const line = lines[i];
        // Match top-level definition or empty line followed by definition
        const isBoundary = CODE_BOUNDARY_PATTERNS.some((p) => p.test(line));
        if (isBoundary && i > currentStart + this.minChunkLines) {
          bestEnd = i; // Cut right before next function/class starts
          break;
        } else if (line.trim() === '' && i >= idealEnd) {
          bestEnd = i + 1;
          break;
        }
      }

      if (bestEnd >= lines.length) {
        bestEnd = lines.length;
      }

      const chunkLines = lines.slice(currentStart, bestEnd);
      const chunkContent = chunkLines.join('\n');

      if (chunkContent.trim().length > 0) {
        chunks.push({
          ...metadata,
          startLine: currentStart + 1, // 1-indexed
          endLine: bestEnd,            // 1-indexed inclusive
          chunkIndex: chunkIndex++,
          content: chunkContent,
          fileName: path.basename(metadata.filePath || ''),
          symbols: this.extractSymbols(chunkLines),
        });
      }

      if (bestEnd >= lines.length) {
        break;
      }

      // Step forward with overlap
      const nextStart = Math.max(bestEnd - this.overlapLines, currentStart + 1);
      currentStart = nextStart;
    }

    return chunks;
  }

  /**
   * Chunk markdown by heading sections
   */
  chunkMarkdown(lines, metadata) {
    const chunks = [];
    let currentStart = 0;
    let chunkIndex = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = MARKDOWN_HEADER_PATTERN.test(line);

      if (isHeader && i - currentStart >= this.minChunkLines) {
        const chunkLines = lines.slice(currentStart, i);
        chunks.push({
          ...metadata,
          startLine: currentStart + 1,
          endLine: i,
          chunkIndex: chunkIndex++,
          content: chunkLines.join('\n'),
          fileName: path.basename(metadata.filePath || ''),
          symbols: this.extractSymbols(chunkLines),
        });
        currentStart = i;
      }
    }

    // Add trailing markdown chunk
    if (currentStart < lines.length) {
      const chunkLines = lines.slice(currentStart);
      chunks.push({
        ...metadata,
        startLine: currentStart + 1,
        endLine: lines.length,
        chunkIndex: chunkIndex++,
        content: chunkLines.join('\n'),
        fileName: path.basename(metadata.filePath || ''),
        symbols: this.extractSymbols(chunkLines),
      });
    }

    return chunks;
  }

  /**
   * Extract key identifiers/symbols from lines for lexical and semantic boosting
   */
  extractSymbols(lines) {
    const symbols = new Set();
    for (const line of lines) {
      for (const pattern of CODE_BOUNDARY_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          // Grab identifier groups
          const name = match[3] || match[2] || match[5] || match[1];
          if (name && typeof name === 'string' && name.length > 2 && name.length < 50) {
            symbols.add(name);
          }
        }
      }
    }
    return Array.from(symbols);
  }
}

module.exports = {
  CodeChunker,
  defaultCodeChunker: new CodeChunker(),
};
