import React, { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import { Copy, Check, ExternalLink, Code2, Sparkles, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '../common/Badge';

export function CodeViewer({
  file,
  highlightRange,
  onClearHighlight,
  repo,
  loading = false,
  onOpenFileSearch,
}) {
  const [copied, setCopied] = useState(false);
  const targetLineRef = useRef(null);

  // In-file search state
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const findInputRef = useRef(null);
  const matchLineRef = useRef(null);

  // Compute lines and path segments safely
  const lines = React.useMemo(() => (file?.content || '').split('\n'), [file?.content]);
  const pathSegments = React.useMemo(() => (file?.path || '').split('/'), [file?.path]);

  // Find matching lines for in-file search
  const matchingLines = React.useMemo(() => {
    if (!searchTerm.trim() || !lines.length) return [];
    const term = searchTerm.toLowerCase();
    const result = [];
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(term)) {
        result.push(idx + 1);
      }
    });
    return result;
  }, [lines, searchTerm]);

  // Auto-scroll to target line range when citation is clicked
  useEffect(() => {
    if (highlightRange?.startLine && targetLineRef.current) {
      setTimeout(() => {
        targetLineRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [highlightRange, file]);

  // Keyboard shortcut listener for Cmd+F / Ctrl+F (Find in file)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindOpen(true);
        setTimeout(() => findInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll active match into view
  useEffect(() => {
    if (isFindOpen && matchingLines.length > 0 && matchLineRef.current) {
      matchLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeMatchIndex, isFindOpen, matchingLines]);

  const handleCopy = () => {
    if (!file?.content) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextMatch = () => {
    if (matchingLines.length === 0) return;
    setActiveMatchIndex((prev) => (prev < matchingLines.length - 1 ? prev + 1 : 0));
  };

  const handlePrevMatch = () => {
    if (matchingLines.length === 0) return;
    setActiveMatchIndex((prev) => (prev > 0 ? prev - 1 : matchingLines.length - 1));
  };

  const handleFindKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFindOpen(false);
    }
  };

  // Safe Prism grammar detection
  const langKey = (file?.language || 'text').toLowerCase();
  const grammarLang =
    langKey === 'javascript' || langKey === 'jsx' || langKey === 'js'
      ? Prism.languages.javascript
      : langKey === 'typescript' || langKey === 'tsx' || langKey === 'ts'
      ? Prism.languages.typescript || Prism.languages.javascript
      : langKey === 'python' || langKey === 'py'
      ? Prism.languages.python
      : langKey === 'json'
      ? Prism.languages.json
      : langKey === 'markdown' || langKey === 'md'
      ? Prism.languages.markdown
      : Prism.languages[langKey] || Prism.languages.clike || null;

  const renderHighlightedLine = (text) => {
    if (!grammarLang) return text || ' ';
    try {
      return Prism.highlight(text || ' ', grammarLang, langKey || 'clike');
    } catch {
      return text || ' ';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] text-gray-500 p-8">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">Loading file content...</span>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] text-gray-400 p-8 select-none">
        <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-3 text-indigo-400">
          <Code2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-gray-300 mb-1">No File Selected</h4>
        <p className="text-xs text-gray-400 text-center max-w-sm mb-4">
          Select a file from the repository tree on the left, or click on any citation in the AI conversation to inspect code.
        </p>
        {onOpenFileSearch && (
          <button
            onClick={onOpenFileSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-lg transition-colors"
          >
            <span>Quick File Search</span>
            <kbd className="px-1.5 py-0.5 bg-[#0d1117] rounded text-[10px] text-gray-400 border border-[#30363d]">
              ⌘K
            </kbd>
          </button>
        )}
      </div>
    );
  }

  // Build GitHub line anchor URL
  const githubLineUrl =
    repo?.githubUrl && file?.path
      ? `${repo.githubUrl}/blob/${repo.defaultBranch || 'main'}/${file.path}${
          highlightRange?.startLine
            ? `#L${highlightRange.startLine}${highlightRange.endLine ? `-L${highlightRange.endLine}` : ''}`
            : ''
        }`
      : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden">
      {/* Top File Bar with Breadcrumbs */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1 min-w-0 font-mono text-xs overflow-hidden">
            {pathSegments.map((segment, idx) => {
              const isLast = idx === pathSegments.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-600">/</span>}
                  <span
                    className={`truncate ${
                      isLast
                        ? 'font-semibold text-gray-100'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {segment}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          <Badge variant="secondary" size="xs">
            {file.language || 'text'}
          </Badge>
          <span className="text-xs text-gray-500 hidden sm:inline">
            {lines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick File Search Button */}
          {onOpenFileSearch && (
            <button
              onClick={onOpenFileSearch}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded transition-colors"
              title="Quick File Search (Cmd+K / Ctrl+P)"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Find File</span>
              <kbd className="hidden md:inline px-1 py-0.2 bg-[#161b22] text-[10px] text-gray-500 rounded font-mono">
                ⌘K
              </kbd>
            </button>
          )}

          {/* In-File Find Button */}
          <button
            onClick={() => {
              setIsFindOpen((prev) => !prev);
              setTimeout(() => findInputRef.current?.focus(), 50);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded transition-colors ${
              isFindOpen
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'text-gray-400 hover:text-white bg-[#0d1117] hover:bg-[#21262d] border-[#30363d]'
            }`}
            title="Find in this file (Cmd+F / Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Find</span>
            <kbd className="hidden md:inline px-1 py-0.2 bg-[#161b22] text-[10px] text-gray-500 rounded font-mono">
              ⌘F
            </kbd>
          </button>

          {/* Citation range banner if active */}
          {highlightRange?.startLine && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-xs text-indigo-300 animate-fade-in">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>
                Lines {highlightRange.startLine}–{highlightRange.endLine || highlightRange.startLine}
              </span>
              <button
                onClick={onClearHighlight}
                className="hover:text-white p-0.5"
                title="Clear Citation Highlight"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded transition-colors"
            title="Copy File Content"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* GitHub link */}
          {githubLineUrl && (
            <a
              href={githubLineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded transition-colors"
              title="Open on GitHub"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          )}
        </div>
      </div>

      {/* Code Text Area Container */}
      <div className="relative flex-1 overflow-hidden flex flex-col">
        {/* Floating In-File Search Bar */}
        {isFindOpen && (
          <div className="absolute top-3 right-6 z-20 flex items-center gap-1.5 p-1.5 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl animate-fade-in text-xs">
            <Search className="w-3.5 h-3.5 text-indigo-400 ml-1.5 shrink-0" />
            <input
              ref={findInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveMatchIndex(0);
              }}
              onKeyDown={handleFindKeyDown}
              placeholder="Find in file..."
              className="bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
            />
            <span className="text-[11px] text-gray-400 px-1 font-mono shrink-0">
              {matchingLines.length === 0
                ? searchTerm ? '0/0' : ''
                : `${activeMatchIndex + 1}/${matchingLines.length}`}
            </span>
            <button
              onClick={handlePrevMatch}
              disabled={matchingLines.length === 0}
              className="p-1 hover:text-white text-gray-400 disabled:opacity-30 rounded hover:bg-[#21262d]"
              title="Previous Match (Shift+Enter)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMatch}
              disabled={matchingLines.length === 0}
              className="p-1 hover:text-white text-gray-400 disabled:opacity-30 rounded hover:bg-[#21262d]"
              title="Next Match (Enter)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFindOpen(false)}
              className="p-1 hover:text-white text-gray-400 rounded hover:bg-[#21262d] ml-0.5"
              title="Close (Escape)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto font-mono text-xs leading-5">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((lineText, idx) => {
                const lineNum = idx + 1;
                const isTargetLine = highlightRange && lineNum === highlightRange.startLine;
                const isInRange =
                  highlightRange &&
                  lineNum >= highlightRange.startLine &&
                  lineNum <= (highlightRange.endLine || highlightRange.startLine);

                const isSearchMatch = isFindOpen && matchingLines.includes(lineNum);
                const isActiveSearchMatch = isFindOpen && matchingLines[activeMatchIndex] === lineNum;

                const highlightedHtml = renderHighlightedLine(lineText);

                return (
                  <tr
                    key={lineNum}
                    ref={(el) => {
                      if (isTargetLine) targetLineRef.current = el;
                      if (isActiveSearchMatch) matchLineRef.current = el;
                    }}
                    className={`transition-colors ${
                      isActiveSearchMatch
                        ? 'bg-amber-500/25 border-l-2 border-amber-400'
                        : isSearchMatch
                        ? 'bg-amber-500/10'
                        : isTargetLine
                        ? 'code-line-highlight-target'
                        : isInRange
                        ? 'code-line-highlight'
                        : 'hover:bg-[#161b22]/70'
                    }`}
                  >
                    {/* Line Number */}
                    <td className="w-12 py-0.5 px-3 text-right text-gray-600 select-none border-r border-[#21262d] bg-[#0d1117]">
                      {lineNum}
                    </td>

                    {/* Code Line */}
                    <td className="py-0.5 px-4 whitespace-pre text-gray-200">
                      <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
