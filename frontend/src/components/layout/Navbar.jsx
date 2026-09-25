import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Terminal, Github, LogOut, Sparkles, FolderGit2, Play } from 'lucide-react';
import { Badge } from '../common/Badge';

export function Navbar({ currentRepo = null }) {
  const { user, isAuthenticated, loginWithGitHub, loginDemo, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d1117]/80">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-tight text-base">RepoLens</span>
              <span className="text-indigo-400 font-bold text-xs px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60">
                AI
              </span>
            </div>
          </Link>

          {currentRepo && (
            <div className="hidden md:flex items-center gap-2 text-sm pl-4 border-l border-[#30363d]">
              <FolderGit2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">{currentRepo.owner}</span>
              <span className="text-gray-600">/</span>
              <span className="font-medium text-gray-200">{currentRepo.name}</span>
            </div>
          )}
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex text-xs font-medium text-gray-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-[#21262d] transition-colors"
              >
                Repositories
              </Link>

              <div className="flex items-center gap-2.5 pl-2 border-l border-[#30363d]">
                {user?.isDemoUser && (
                  <Badge variant="warning" size="xs">
                    Demo Mode
                  </Badge>
                )}

                <div className="flex items-center gap-2">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-7 h-7 rounded-full border border-[#30363d] object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600/40 text-indigo-300 flex items-center justify-center text-xs font-bold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-300 hidden md:inline">
                    {user?.displayName || user?.username}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#21262d] rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={loginDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-[#21262d] hover:bg-[#30363d] hover:text-white rounded-lg border border-[#30363d] transition-colors"
              >
                <Play className="w-3 h-3 text-indigo-400" />
                <span>Try Demo</span>
              </button>

              <button
                onClick={loginWithGitHub}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 transition-all"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Continue with GitHub</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
