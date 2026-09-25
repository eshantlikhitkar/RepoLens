import React from 'react';
import { FileCode, ExternalLink } from 'lucide-react';

export function CitationChip({ citation, onCitationClick }) {
  if (!citation || !citation.filePath) return null;

  const fileName = citation.filePath.split('/').pop();
  const lineLabel =
    citation.startLine && citation.endLine && citation.startLine !== citation.endLine
      ? `:${citation.startLine}-${citation.endLine}`
      : citation.startLine
      ? `:${citation.startLine}`
      : '';

  return (
    <div className="inline-flex items-center gap-1.5 bg-[#161b22] hover:bg-[#21262d] border border-indigo-500/30 hover:border-indigo-500/70 text-indigo-300 rounded-md px-2 py-1 text-xs font-mono transition-all group shadow-sm">
      <button
        onClick={() => onCitationClick(citation)}
        className="inline-flex items-center gap-1 hover:text-white"
        title={`Open ${citation.filePath} at line ${citation.startLine}`}
      >
        <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="font-semibold">{fileName}</span>
        <span className="text-indigo-400 font-normal">{lineLabel}</span>
      </button>

      {citation.githubUrl && (
        <a
          href={citation.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-gray-500 hover:text-gray-300 pl-1 border-l border-[#30363d] ml-1"
          title="Open line range on GitHub"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
