import React from 'react';
import { FolderGit2, GitBranch, Star, Globe, Lock, ExternalLink, Map, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../common/Badge';

export function RepoHeader({
  repo,
  onStartIndexing,
  isIndexing,
  onOpenOverview,
}) {
  if (!repo) return null;

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Repo title, branch, and metadata */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-white">
          <FolderGit2 className="w-5 h-5 text-indigo-400" />
          <span className="text-gray-400">{repo.owner}</span>
          <span className="text-gray-600">/</span>
          <span className="text-white">{repo.name}</span>
        </div>

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

        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded">
          <GitBranch className="w-3 h-3 text-gray-400" />
          <span>{repo.defaultBranch || 'main'}</span>
        </div>

        {repo.stars > 0 && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
            <Star className="w-3 h-3 text-amber-400" />
            <span>{repo.stars.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Architecture Overview */}
        <button
          onClick={onOpenOverview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-[#21262d] hover:bg-[#30363d] hover:text-white rounded-lg border border-[#30363d] transition-colors"
          title="View architectural breakdown and technology map"
        >
          <Map className="w-3.5 h-3.5 text-indigo-400" />
          <span>Architecture Map</span>
        </button>

        {/* Index / Re-Index Button */}
        <button
          onClick={onStartIndexing}
          disabled={isIndexing}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all shadow-sm ${
            repo.indexingStatus === 'indexed'
              ? 'text-gray-200 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d]'
              : 'text-white bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
          } ${isIndexing ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
        >
          {isIndexing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Indexing...</span>
            </>
          ) : repo.indexingStatus === 'indexed' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Re-Index Code</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Index Repository</span>
            </>
          )}
        </button>

        {/* GitHub Link */}
        {repo.githubUrl && (
          <a
            href={repo.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
            title="View on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
