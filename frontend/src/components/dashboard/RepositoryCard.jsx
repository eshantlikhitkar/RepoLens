import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, GitFork, Lock, Globe, Clock, Sparkles, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '../common/Badge';

// Language colors matching GitHub standards
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  PHP: '#4F5D95',
  Ruby: '#701516',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Shell: '#89e051',
};

export function RepositoryCard({ repo }) {
  const navigate = useNavigate();

  const handleInvestigate = () => {
    navigate(`/repositories/${repo.owner}/${repo.name}`);
  };

  const formatUpdatedTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 30) return `Updated ${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `Updated ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  const langColor = LANGUAGE_COLORS[repo.language] || '#8b949e';

  return (
    <div className="flex flex-col justify-between bg-[#161b22] border border-[#30363d] hover:border-indigo-500/50 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 group">
      <div>
        {/* Header: Title and Visibility */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors text-base break-words">
            {repo.name}
          </h3>
          <div className="shrink-0 flex items-center gap-1.5">
            {repo.private ? (
              <Badge variant="secondary" size="xs">
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            ) : (
              <Badge variant="secondary" size="xs">
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
            )}
          </div>
        </div>

        {/* Owner */}
        <p className="text-xs text-gray-500 mb-2 font-mono">
          {repo.owner}
        </p>

        {/* Description */}
        <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed h-9">
          {repo.description || 'No description provided for this repository.'}
        </p>
      </div>

      <div>
        {/* Meta Stats: Language, Stars, Forks, Updated */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 py-3 border-t border-[#21262d] mb-4">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: langColor }}
              />
              <span>{repo.language}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-gray-400" />
            <span>{repo.stars.toLocaleString()}</span>
          </div>

          {repo.forks > 0 && (
            <div className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5 text-gray-400" />
              <span>{repo.forks.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-gray-500 ml-auto">
            <Clock className="w-3 h-3" />
            <span>{formatUpdatedTime(repo.updatedAt)}</span>
          </div>
        </div>

        {/* Index Status & Action Button */}
        <div className="flex items-center justify-between gap-3">
          <div>
            {repo.indexingStatus === 'indexed' ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-medium">
                  Indexed {repo.totalChunks ? `(${repo.totalChunks} chunks)` : ''}
                </span>
              </div>
            ) : repo.indexingStatus === 'indexing' ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-medium">Indexing...</span>
              </div>
            ) : repo.indexingStatus === 'failed' ? (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="font-medium">Index Failed</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not Indexed</span>
            )}
          </div>

          <button
            onClick={handleInvestigate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-lg shadow-sm shadow-indigo-600/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Investigate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
