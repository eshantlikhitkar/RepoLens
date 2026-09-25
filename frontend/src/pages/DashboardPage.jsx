import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { repoService } from '../services/repoService';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { RepositoryCard } from '../components/dashboard/RepositoryCard';
import { RepositorySearch } from '../components/dashboard/RepositorySearch';
import { CustomRepoModal } from '../components/dashboard/CustomRepoModal';
import { FolderGit2, Plus, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [sortOrder, setSortOrder] = useState('updated');

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      const repos = await repoService.getRepositories();
      setRepositories(repos || []);
    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  // Distinct languages for dropdown
  const languages = useMemo(() => {
    const set = new Set();
    repositories.forEach((r) => {
      if (r.language && r.language !== 'Unknown') set.add(r.language);
    });
    return Array.from(set).sort();
  }, [repositories]);

  // Filtered and sorted repositories
  const filteredRepositories = useMemo(() => {
    return repositories
      .filter((repo) => {
        // Search text
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesName = repo.name.toLowerCase().includes(q);
          const matchesDesc = (repo.description || '').toLowerCase().includes(q);
          if (!matchesName && !matchesDesc) return false;
        }

        // Visibility
        if (selectedVisibility === 'public' && repo.private) return false;
        if (selectedVisibility === 'private' && !repo.private) return false;

        // Language
        if (selectedLanguage !== 'all' && repo.language !== selectedLanguage) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'stars') {
          return (b.stars || 0) - (a.stars || 0);
        }
        if (sortOrder === 'name') {
          return a.name.localeCompare(b.name);
        }
        // Default: updated
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
  }, [repositories, searchQuery, selectedVisibility, selectedLanguage, sortOrder]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Repositories</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#161b22] border border-[#30363d] text-indigo-400">
                {repositories.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Select a repository to index its codebase and begin investigating with AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Investigate Any Repo</span>
            </button>

            <button
              onClick={fetchRepositories}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-lg transition-colors"
              title="Refresh Repositories"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="mb-6">
          <RepositorySearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            selectedVisibility={selectedVisibility}
            onVisibilityChange={setSelectedVisibility}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            languages={languages}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchRepositories}
              className="font-medium underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Repositories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 h-48 animate-pulse flex flex-col justify-between"
              >
                <div>
                  <div className="h-5 bg-[#21262d] rounded w-2/3 mb-3" />
                  <div className="h-3 bg-[#21262d] rounded w-full mb-2" />
                  <div className="h-3 bg-[#21262d] rounded w-4/5" />
                </div>
                <div className="h-8 bg-[#21262d] rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredRepositories.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-xl bg-[#0d1117] border border-[#30363d] text-gray-500 flex items-center justify-center mx-auto mb-3">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No Repositories Found</h3>
            <p className="text-xs text-gray-400 mb-4">
              {searchQuery || selectedLanguage !== 'all' || selectedVisibility !== 'all'
                ? 'No repositories matched your filters. Try clearing the search query.'
                : 'No repositories accessible for this account.'}
            </p>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enter Repository Manually</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRepositories.map((repo) => (
              <RepositoryCard key={repo.fullName} repo={repo} />
            ))}
          </div>
        )}
      </main>

      {/* Custom Repo Modal */}
      <CustomRepoModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
