import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Layers, Server, Layout, Database, KeyRound, Network, FolderTree, Terminal } from 'lucide-react';

export function RepoOverviewModal({ isOpen, onClose, overview, repoName }) {
  if (!overview) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Architecture Map — ${repoName || 'Repository'}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Project Summary */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <Layers className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Project Type</h4>
          </div>
          <p className="text-sm font-medium text-white mb-2">{overview.projectType || 'Full-Stack Application'}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{overview.summary}</p>
        </div>

        {/* Technologies Grid */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Detected Technologies
          </h4>
          <div className="flex flex-wrap gap-2">
            {(overview.technologies || []).map((tech) => (
              <Badge key={tech} variant="primary" size="sm">
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        {/* Core Architecture Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Frontend */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1 text-xs">
              <Layout className="w-3.5 h-3.5 text-blue-400" />
              <span>Frontend Layer</span>
            </div>
            <p className="text-xs font-semibold text-gray-200">{overview.frontend || 'None'}</p>
          </div>

          {/* Backend */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1 text-xs">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backend Service</span>
            </div>
            <p className="text-xs font-semibold text-gray-200">{overview.backend || 'None'}</p>
          </div>

          {/* Database */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1 text-xs">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Database / Storage</span>
            </div>
            <p className="text-xs font-semibold text-gray-200">{overview.database || 'None'}</p>
          </div>

          {/* Authentication */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1 text-xs">
              <KeyRound className="w-3.5 h-3.5 text-rose-400" />
              <span>Authentication Strategy</span>
            </div>
            <p className="text-xs font-semibold text-gray-200">{overview.authentication || 'Not detected'}</p>
          </div>

          {/* API Layer */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1 text-xs">
              <Network className="w-3.5 h-3.5 text-purple-400" />
              <span>API Layer</span>
            </div>
            <p className="text-xs font-semibold text-gray-200">{overview.apiLayer || 'REST API'}</p>
          </div>

          {/* Testing */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1 text-xs">
              <span className="text-emerald-400 text-xs">🧪</span>
              <span>Testing Framework</span>
            </div>
            <p className="text-xs font-semibold text-gray-200">{overview.testing || 'None detected'}</p>
          </div>

          {/* Deployment */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1 text-xs">
              <span className="text-blue-400 text-xs">🚀</span>
              <span>Deployment / Runtime</span>
            </div>
            <p className="text-xs font-semibold text-gray-200">{overview.deployment || 'Standard Node.js'}</p>
          </div>

          {/* Configuration */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1 text-xs">
              <span className="text-amber-400 text-xs">⚙️</span>
              <span>Configuration</span>
            </div>
            <p className="text-xs font-semibold text-gray-200">{overview.configuration || 'Environment variables'}</p>
          </div>
        </div>

        {/* Entry Points & Important Directories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Entry points */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Primary Entry Points</span>
            </div>
            <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5 space-y-1">
              {overview.entryPoints && overview.entryPoints.length > 0 ? (
                overview.entryPoints.map((ep) => (
                  <div key={ep} className="text-xs font-mono text-gray-300 flex items-center gap-1.5">
                    <span className="text-indigo-400">→</span>
                    <span>{ep}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-500">None detected</span>
              )}
            </div>
          </div>

          {/* Key directories */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
              <span>Key Directories</span>
            </div>
            <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5 space-y-1">
              {overview.keyDirectories && overview.keyDirectories.length > 0 ? (
                overview.keyDirectories.map((dir) => (
                  <div key={dir} className="text-xs font-mono text-gray-300 flex items-center gap-1.5">
                    <span className="text-gray-500">📁</span>
                    <span>{dir}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-500">None detected</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
