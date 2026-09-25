import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { repoService } from '../services/repoService';
import { chatService } from '../services/chatService';
import { API_BASE_URL } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { RepoHeader } from '../components/repository/RepoHeader';
import { FileTree } from '../components/repository/FileTree';
import { CodeViewer } from '../components/repository/CodeViewer';
import { ChatWindow } from '../components/chat/ChatWindow';
import { IndexingProgress } from '../components/repository/IndexingProgress';
import { RepoOverviewModal } from '../components/repository/RepoOverviewModal';
import { QuickSearchModal } from '../components/repository/QuickSearchModal';
import { Modal } from '../components/common/Modal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { FolderTree, Code2, MessageSquare, AlertCircle } from 'lucide-react';

export function InvestigationPage() {
  const { owner, repo: repoName } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [repo, setRepo] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [activeFile, setActiveFile] = useState(null); // { path, content, language }
  const [activeFilePath, setActiveFilePath] = useState('');
  const [highlightRange, setHighlightRange] = useState(null); // { startLine, endLine }

  // Indexing state
  const [isIndexingModalOpen, setIsIndexingModalOpen] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState({});

  // Overview state
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState(null);

  // Quick Search state
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  // Layout tabs for smaller screens: 'explorer' | 'code' | 'chat'
  const [mobileTab, setMobileTab] = useState('chat');

  const abortControllerRef = useRef(null);

  // Global Cmd+K / Ctrl+P listener for quick file switcher
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'p')) {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading states
  const [loadingRepo, setLoadingRepo] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState(null);

  // Initialize repository
  const initRepository = useCallback(async () => {
    try {
      setLoadingRepo(true);
      setError(null);

      // Select / register repository
      const repository = await repoService.selectRepository(owner, repoName);
      setRepo(repository);

      if (repository.indexingProgress) {
        setIndexingProgress(repository.indexingProgress);
      }

      // Load file tree
      loadTree(repository._id);

      // Load conversations
      loadConversations(repository._id);

      // If currently indexing, open progress modal and listen
      if (repository.indexingStatus === 'indexing') {
        setIsIndexingModalOpen(true);
        listenIndexingSSE(repository._id);
      }
    } catch (err) {
      console.error('Error initializing repository:', err);
      setError(err.response?.data?.error || err.message || 'Failed to initialize repository');
    } finally {
      setLoadingRepo(false);
    }
  }, [owner, repoName]);

  useEffect(() => {
    if (!authLoading) {
      initRepository();
    }
  }, [authLoading, initRepository]);

  // Load tree
  const loadTree = async (repoId) => {
    try {
      setLoadingTree(true);
      const tree = await repoService.getFileTree(repoId);
      setFileTree(tree || []);

      // If README exists, auto-load it
      const readme = (tree || []).find((t) => t.path.toLowerCase() === 'readme.md');
      if (readme) {
        loadFileContent(repoId, readme.path);
      }
    } catch (err) {
      console.warn('Could not load tree:', err.message);
    } finally {
      setLoadingTree(false);
    }
  };

  // Load specific file content
  const loadFileContent = async (repoId, path) => {
    try {
      setLoadingFile(true);
      setActiveFilePath(path);
      const fileData = await repoService.getFileContent(repoId, path);
      setActiveFile(fileData);
    } catch (err) {
      console.error(`Failed to load ${path}:`, err);
      addToast(`Could not load ${path}`, 'error');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSelectFile = (path) => {
    if (!repo) return;
    setHighlightRange(null);
    loadFileContent(repo._id, path);
    setMobileTab('code');
  };

  // Citation click handler
  const handleCitationClick = ({ filePath, startLine, endLine }) => {
    if (!repo || !filePath) return;

    // Load file if not already active
    if (!activeFile || activeFile.path !== filePath) {
      loadFileContent(repo._id, filePath);
    }

    setHighlightRange({ startLine, endLine });
    setMobileTab('code');
    addToast(`Navigating to ${filePath}:${startLine}`, 'info');
  };

  // Load conversations
  const loadConversations = async (repoId) => {
    try {
      const convs = await chatService.listConversations(repoId);
      setConversations(convs || []);
      if (convs && convs.length > 0 && !activeConversationId) {
        // Load latest conversation
        loadSingleConversation(convs[0]._id);
      }
    } catch (err) {
      console.warn('Could not load conversations:', err.message);
    }
  };

  const loadSingleConversation = async (convId) => {
    try {
      const conv = await chatService.getConversation(convId);
      if (conv) {
        setActiveConversationId(conv._id);
        setMessages(conv.messages || []);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    addToast('Started new investigation session', 'info');
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await chatService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeConversationId === convId) {
        handleNewConversation();
      }
      addToast('Conversation deleted', 'success');
    } catch (err) {
      addToast('Could not delete conversation', 'error');
    }
  };

  // Trigger Indexing
  const handleStartIndexing = async () => {
    if (!repo) return;
    try {
      setIsIndexingModalOpen(true);
      const res = await repoService.startIndexing(repo._id);
      setRepo((prev) => ({
        ...prev,
        indexingStatus: res.status,
        indexingProgress: res.progress,
      }));
      setIndexingProgress(res.progress || {});
      listenIndexingSSE(repo._id);
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'error');
    }
  };

  // Real-time SSE listener for Indexing Progress
  const listenIndexingSSE = (repoId) => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/repositories/${repoId}/status/stream`);

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        if (payload.status) {
          setRepo((prev) => ({
            ...prev,
            indexingStatus: payload.status,
            indexingProgress: payload.progress || prev?.indexingProgress,
            totalChunks: payload.totalChunks || prev?.totalChunks,
          }));
        }

        if (payload.progress) {
          setIndexingProgress(payload.progress);
        }

        if (payload.status === 'indexed') {
          addToast('Repository indexing completed successfully!', 'success');
          // Reload tree to reflect all files
          loadTree(repoId);
          setTimeout(() => {
            setIsIndexingModalOpen(false);
          }, 1500);
          eventSource.close();
        } else if (payload.status === 'failed') {
          addToast(`Indexing failed: ${payload.error || 'Unknown error'}`, 'error');
          eventSource.close();
        }
      } catch (e) {
        // SSE fragment parse error
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  // Send question with SSE streaming
  const handleSendMessage = async (question) => {
    if (!repo) return;

    if (repo.indexingStatus !== 'indexed') {
      addToast('Please index this repository before asking questions.', 'warning');
      setIsIndexingModalOpen(true);
      return;
    }

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Optimistically add user message to list
    const userMsg = {
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Initial streaming placeholder
    setStreamingMessage({
      role: 'assistant',
      content: '',
      citations: [],
      createdAt: new Date().toISOString(),
    });

    let currentAnswer = '';
    let currentCitations = [];

    try {
      await chatService.sendMessageStream({
        repositoryId: repo._id,
        question,
        conversationId: activeConversationId,
        signal: abortControllerRef.current.signal,
        onCitations: (citations, convId) => {
          currentCitations = citations || [];
          if (convId && !activeConversationId) {
            setActiveConversationId(convId);
            loadConversations(repo._id);
          }
          setStreamingMessage((prev) => ({
            ...prev,
            citations: currentCitations,
          }));
        },
        onToken: (token) => {
          currentAnswer += token;
          setStreamingMessage((prev) => ({
            ...prev,
            content: currentAnswer,
          }));
        },
        onDone: () => {
          // Finalize assistant message
          const assistantMsg = {
            role: 'assistant',
            content: currentAnswer,
            citations: currentCitations,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingMessage(null);
          setIsStreaming(false);
          abortControllerRef.current = null;
          loadConversations(repo._id);
        },
        onError: (streamErr) => {
          if (streamErr.name === 'AbortError') {
            console.log('Stream was aborted by user');
            return;
          }
          console.error('Chat streaming failed:', streamErr);
          addToast(streamErr.message || 'Failed to complete AI response', 'error');
          setStreamingMessage(null);
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        addToast(err.message || 'Failed to send message', 'error');
      }
      setStreamingMessage(null);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (streamingMessage) {
      const stoppedMsg = {
        role: 'assistant',
        content: (streamingMessage.content || '') + ' _[Generation stopped by user]_',
        citations: streamingMessage.citations || [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, stoppedMsg]);
    }

    setStreamingMessage(null);
    setIsStreaming(false);
    addToast('Stopped response generation', 'info');
  };

  const handleRetryMessage = () => {
    if (isStreaming) return;
    // Find last user question
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;

    // Remove last assistant message
    setMessages((prev) => {
      const idx = prev.map((m) => m.role).lastIndexOf('assistant');
      if (idx !== -1) {
        return [...prev.slice(0, idx)];
      }
      return prev;
    });

    handleSendMessage(lastUser.content);
  };

  if (loadingRepo) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0d1117] text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading repository workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0d1117] text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h2 className="text-lg font-bold mb-1">Repository Unavailable</h2>
          <p className="text-xs text-gray-400 mb-6">{error || 'Could not access repository.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-200 h-screen overflow-hidden">
      <Navbar currentRepo={repo} />

      {/* Top Workspace Header */}
      <RepoHeader
        repo={repo}
        onStartIndexing={handleStartIndexing}
        isIndexing={repo.indexingStatus === 'indexing'}
        onOpenOverview={() => setIsOverviewOpen(true)}
      />

      {/* Mobile Tab Selector */}
      <div className="md:hidden flex border-b border-[#30363d] bg-[#161b22] text-xs">
        <button
          onClick={() => setMobileTab('explorer')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 ${
            mobileTab === 'explorer' ? 'text-indigo-400 border-b-2 border-indigo-500 font-medium' : 'text-gray-400'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setMobileTab('code')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 ${
            mobileTab === 'code' ? 'text-indigo-400 border-b-2 border-indigo-500 font-medium' : 'text-gray-400'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code</span>
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 ${
            mobileTab === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-500 font-medium' : 'text-gray-400'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Chat</span>
        </button>
      </div>

      {/* Main IDE Workspace Pane */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Pane: Collapsible File Tree (Hidden on mobile if not active) */}
        <div
          className={`w-64 shrink-0 h-full border-r border-[#30363d] ${
            mobileTab === 'explorer' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <FileTree
            tree={fileTree}
            activeFile={activeFilePath}
            onSelectFile={handleSelectFile}
            loading={loadingTree}
            onOpenFileSearch={() => setIsQuickSearchOpen(true)}
          />
        </div>

        {/* Center Pane: Code Viewer (Hidden on mobile if not active) */}
        <div
          className={`flex-1 min-w-0 h-full border-r border-[#30363d] ${
            mobileTab === 'code' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <ErrorBoundary>
            <CodeViewer
              file={activeFile}
              highlightRange={highlightRange}
              onClearHighlight={() => setHighlightRange(null)}
              repo={repo}
              loading={loadingFile}
              onOpenFileSearch={() => setIsQuickSearchOpen(true)}
            />
          </ErrorBoundary>
        </div>

        {/* Right Pane: AI Chat & Investigation (Full width on mobile when active) */}
        <div
          className={`w-full lg:w-[480px] xl:w-[540px] shrink-0 h-full ${
            mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <ChatWindow
            repo={repo}
            messages={messages}
            isStreaming={isStreaming}
            streamingMessage={streamingMessage}
            onSendMessage={handleSendMessage}
            onCitationClick={handleCitationClick}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={loadSingleConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onStartIndexing={handleStartIndexing}
            onStopGeneration={handleStopGeneration}
            onRetryMessage={handleRetryMessage}
          />
        </div>
      </div>

      {/* Quick File Search Modal (Cmd+K / Ctrl+P) */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        fileTree={fileTree}
        onSelectFile={handleSelectFile}
      />

      {/* Indexing Progress Modal */}
      <Modal
        isOpen={isIndexingModalOpen}
        onClose={() => setIsIndexingModalOpen(false)}
        title="Repository Indexing Pipeline"
        maxWidth="max-w-xl"
      >
        <IndexingProgress
          status={repo.indexingStatus}
          progress={indexingProgress}
          onRetry={handleStartIndexing}
        />
      </Modal>

      {/* Architecture Overview Modal */}
      <RepoOverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        overview={repo.overview}
        repoName={repo.fullName}
      />
    </div>
  );
}
