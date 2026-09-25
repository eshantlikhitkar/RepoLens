import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Plus, History, AlertCircle, Square, Download } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import { ConversationSidebar } from './ConversationSidebar';

export function ChatWindow({
  repo,
  messages,
  isStreaming,
  streamingMessage,
  onSendMessage,
  onCitationClick,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onStartIndexing,
  onStopGeneration,
  onRetryMessage,
}) {
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Export current conversation to Markdown
  const handleExportMarkdown = () => {
    if (!messages || messages.length === 0) return;

    const repoName = repo?.fullName || repo?.name || 'repository';
    const timestamp = new Date().toISOString().split('T')[0];

    let md = `# RepoLens AI Codebase Investigation Report\n\n`;
    md += `**Repository**: ${repo?.githubUrl ? `[${repoName}](${repo.githubUrl})` : repoName}\n`;
    if (repo?.defaultBranch) md += `**Branch**: \`${repo.defaultBranch}\`\n`;
    md += `**Date**: ${new Date().toLocaleString()}\n`;
    md += `**Total Messages**: ${messages.length}\n\n`;
    md += `---\n\n`;

    messages.forEach((msg) => {
      if (msg.role === 'user') {
        md += `### ❓ Question\n\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        md += `### 🤖 Answer\n\n${msg.content}\n\n`;
        if (msg.citations && msg.citations.length > 0) {
          md += `#### 📌 Citations\n`;
          msg.citations.forEach((cit) => {
            const lineStr = cit.startLine ? `:${cit.startLine}${cit.endLine ? `-${cit.endLine}` : ''}` : '';
            const label = `${cit.filePath}${lineStr}`;
            if (cit.githubUrl) {
              md += `* [${label}](${cit.githubUrl})\n`;
            } else {
              md += `* \`${label}\`\n`;
            }
          });
          md += `\n`;
        }
        md += `---\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repolens-investigation-${(repo?.name || 'repo').toLowerCase()}-${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isStreaming) return;
    onSendMessage(inputQuestion.trim());
    setInputQuestion('');
  };

  const handleSelectSuggested = (prompt) => {
    if (isStreaming) return;
    onSendMessage(prompt);
  };

  const isIndexed = repo?.indexingStatus === 'indexed';

  return (
    <div className="relative flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden">
      {/* Top Chat Bar */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
            AI Codebase Investigator
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-300 hover:text-white bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded transition-colors"
              title="Export investigation session to Markdown"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <button
            onClick={onNewConversation}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-300 hover:text-white bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded transition-colors"
            title="Start fresh conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-300 hover:text-white bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded transition-colors"
            title="View investigation history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>

      {/* History Sidebar Drawer */}
      <ConversationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
      />

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#21262d]/40">
        {messages.length === 0 && !streamingMessage ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 border border-indigo-500/30 flex items-center justify-center mb-3 text-indigo-400 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white mb-2">
              Investigate {repo?.name || 'Repository'} with AI
            </h4>
            <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
              Ask natural-language questions about this repository’s architecture, authentication flow, database models, or security. Every answer is grounded in actual repository code with citations.
            </p>

            {/* If repository is not indexed yet, display callout */}
            {!isIndexed && (
              <div className="w-full max-w-md bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Repository Needs Indexing</span>
                </div>
                <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                  Before asking questions, index this repository so RepoLens AI can parse the file tree, extract functions, and build the vector search index.
                </p>
                <button
                  onClick={onStartIndexing}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
                >
                  Index Repository Now
                </button>
              </div>
            )}

            {/* Suggested Prompts */}
            <div className="w-full max-w-md text-left">
              <SuggestedPrompts onSelectPrompt={handleSelectSuggested} />
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isLast = index === messages.length - 1;
              return (
                <ChatMessage
                  key={msg._id || index}
                  message={msg}
                  onCitationClick={onCitationClick}
                  onRetry={isLast && msg.role === 'assistant' ? onRetryMessage : null}
                />
              );
            })}

            {/* Streaming message chunk */}
            {streamingMessage && (
              <ChatMessage
                message={streamingMessage}
                onCitationClick={onCitationClick}
                isStreaming={true}
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 bg-[#161b22] border-t border-[#30363d]">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isStreaming}
            placeholder={
              !isIndexed
                ? 'Index this repository to begin asking questions...'
                : 'Ask anything about this repository (e.g., How does auth work?)...'
            }
            className="flex-1 bg-[#0d1117] border border-[#30363d] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition-colors disabled:opacity-50"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="inline-flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-all shadow-sm shadow-red-600/20 active:scale-95 shrink-0"
              title="Stop Generation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputQuestion.trim()}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-sm shadow-indigo-600/20 active:scale-95 shrink-0"
              title="Send Question"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
