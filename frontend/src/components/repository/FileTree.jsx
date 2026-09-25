import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  ChevronRight,
  ChevronDown,
  Search,
} from 'lucide-react';

function getFileIcon(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'go':
    case 'rs':
    case 'java':
    case 'c':
    case 'cpp':
      return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-gray-400 shrink-0" />;
  }
}

// Convert flat git tree items into nested directory tree structure
function buildNestedTree(items = []) {
  if (!Array.isArray(items)) return [];
  const root = { name: '', path: '', type: 'tree', children: {} };

  for (const item of items) {
    if (!item || typeof item.path !== 'string') continue;
    const parts = item.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const partPath = parts.slice(0, i + 1).join('/');

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: partPath,
          type: isLast ? item.type : 'tree',
          size: item.size,
          sha: item.sha,
          children: {},
        };
      }
      current = current.children[part];
    }
  }

  function toArray(node) {
    const sorted = Object.values(node.children).sort((a, b) => {
      // Folders first, then files
      if (a.type === 'tree' && b.type !== 'tree') return -1;
      if (a.type !== 'tree' && b.type === 'tree') return 1;
      return a.name.localeCompare(b.name);
    });

    for (const child of sorted) {
      if (child.type === 'tree') {
        child.childrenArray = toArray(child);
      }
    }
    return sorted;
  }

  return toArray(root);
}

function TreeNode({ node, activeFile, onSelectFile, expandedPaths, toggleExpand, filterQuery }) {
  const isExpanded = expandedPaths.has(node.path);
  const isFolder = node.type === 'tree';
  const isActive = activeFile === node.path;

  // If search filter is active and matches
  const matchesSearch = !filterQuery || node.name.toLowerCase().includes(filterQuery.toLowerCase());

  if (isFolder) {
    return (
      <div>
        <div
          onClick={() => toggleExpand(node.path)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-[#21262d] rounded cursor-pointer select-none group transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 shrink-0" />
          )}

          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-indigo-400/80 shrink-0" />
          )}

          <span className="truncate">{node.name}</span>
        </div>

        {isExpanded && node.childrenArray && (
          <div className="pl-3.5 ml-2 border-l border-[#21262d]">
            {node.childrenArray.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                expandedPaths={expandedPaths}
                toggleExpand={toggleExpand}
                filterQuery={filterQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectFile(node.path)}
      className={`flex items-center gap-2 px-2 py-1 text-xs rounded cursor-pointer select-none transition-colors ${
        isActive
          ? 'bg-indigo-950/70 text-indigo-300 border-l-2 border-indigo-500 font-medium'
          : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'
      }`}
    >
      <span className="pl-3">{getFileIcon(node.name)}</span>
      <span className="truncate">{node.name}</span>
    </div>
  );
}

export function FileTree({ tree = [], activeFile, onSelectFile, loading = false, onOpenFileSearch }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState(() => new Set(['src', 'controllers', 'routes', 'middleware', 'models']));

  const nestedTree = useMemo(() => buildNestedTree(tree), [tree]);

  const toggleExpand = (path) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allDirs = new Set();
    (tree || []).forEach((item) => {
      if (item && item.type === 'tree' && item.path) allDirs.add(item.path);
    });
    setExpandedPaths(allDirs);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-r border-[#30363d] overflow-hidden select-none">
      {/* Search Header */}
      <div className="p-2.5 border-b border-[#21262d] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Files
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <button
              onClick={expandAll}
              className="hover:text-white transition-colors"
              title="Expand All"
            >
              Expand
            </button>
            <span>·</span>
            <button
              onClick={collapseAll}
              className="hover:text-white transition-colors"
              title="Collapse All"
            >
              Collapse
            </button>
          </div>
        </div>

        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter tree..."
            className="w-full bg-[#161b22] border border-[#30363d] rounded pl-7 pr-9 py-1 text-xs text-gray-300 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
          {onOpenFileSearch && (
            <button
              onClick={onOpenFileSearch}
              className="absolute right-1.5 px-1 py-0.5 text-[9px] font-mono text-gray-400 hover:text-white bg-[#0d1117] border border-[#30363d] rounded transition-colors"
              title="Quick File Search (Cmd+K / Ctrl+P)"
            >
              ⌘K
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          <div className="p-4 text-center text-xs text-gray-400">
            Loading file tree...
          </div>
        ) : nestedTree.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            No files available.
          </div>
        ) : (
          nestedTree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              activeFile={activeFile}
              onSelectFile={onSelectFile}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
              filterQuery={filterQuery}
            />
          ))
        )}
      </div>
    </div>
  );
}
