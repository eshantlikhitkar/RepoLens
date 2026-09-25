import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationChip } from './CitationChip';
import { Sparkles, User, Copy, Check, Terminal } from 'lucide-react';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');
  const language = className?.replace(/language-/, '') || 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-[#30363d] bg-[#0d1117]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-xs font-mono text-gray-400">
        <span className="text-gray-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
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
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-gray-200">
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

export function ChatMessage({ message, onCitationClick, isStreaming = false, onRetry = null }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`py-4 px-4 sm:px-6 flex gap-3 text-sm transition-colors ${
        isUser ? 'bg-transparent' : 'bg-[#161b22]/40 border-y border-[#21262d]/60'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-xs text-gray-200">
            {isUser ? 'You' : 'RepoLens AI'}
          </span>
          {message.createdAt && (
            <span className="text-[11px] text-gray-400">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {isUser ? (
          <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-invert max-w-none text-gray-200 text-xs sm:text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  if (inline) {
                    return (
                      <code className="bg-[#0d1117] text-indigo-300 px-1.5 py-0.5 rounded font-mono text-xs border border-[#30363d]" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return <CodeBlock className={className}>{children}</CodeBlock>;
                },
                p({ children }) {
                  return <p className="mb-3 leading-relaxed">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-bold text-white mt-4 mb-2">{children}</h3>;
                },
                h4({ children }) {
                  return <h4 className="text-xs font-bold text-gray-200 mt-3 mb-1.5">{children}</h4>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Pulsing cursor while streaming */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle" />
            )}

            {/* Citations block */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#21262d]">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 font-medium">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Code Citations:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.citations.map((citation, idx) => (
                    <CitationChip
                      key={`${citation.filePath}-${citation.startLine}-${idx}`}
                      citation={citation}
                      onCitationClick={onCitationClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Assistant message action toolbar */}
            {!isStreaming && (
              <div className="flex items-center gap-3 mt-3 pt-2 text-[11px] text-gray-400">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                  }}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  title="Copy full answer text"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Answer</span>
                </button>

                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1 hover:text-indigo-300 transition-colors"
                    title="Regenerate this response"
                  >
                    <span>↻ Retry</span>
                  </button>
                )}

                {message.citations?.length > 0 && (
                  <span className="text-gray-500 ml-auto font-mono text-[10px]">
                    {message.citations.length} cited sources
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
