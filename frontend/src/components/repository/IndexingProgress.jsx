import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

const INDEXING_STEPS = [
  'Fetching repository metadata',
  'Reading file tree',
  'Filtering files',
  'Processing source files',
  'Generating vector embeddings',
  'Building search index',
];

export function IndexingProgress({
  status,
  progress,
  onRetry,
}) {
  const safeProgress = progress || {};
  const currentStepIndex = safeProgress.currentStepIndex || 0;
  const percentage = safeProgress.percentage || 0;
  const isFailed = status === 'failed';
  const isComplete = status === 'indexed';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-xl max-w-xl mx-auto my-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : isFailed ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          )}
          <h4 className="text-sm font-semibold text-white">
            {isComplete
              ? 'Repository Ready for Investigation'
              : isFailed
              ? 'Indexing Failed'
              : 'Analyzing Repository...'}
          </h4>
        </div>

        <span className="text-xs font-mono font-medium text-indigo-400">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#0d1117] rounded-full h-2 mb-4 overflow-hidden border border-[#30363d]">
        <div
          className={`h-full transition-all duration-300 ${
            isFailed
              ? 'bg-red-500'
              : isComplete
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
          }`}
          style={{ width: `${Math.max(5, percentage)}%` }}
        />
      </div>

      {/* File progress message */}
      {safeProgress.totalFiles > 0 && !isComplete && !isFailed && (
        <p className="text-xs text-indigo-300 font-mono mb-4">
          Processing {safeProgress.processedFiles || 0} / {safeProgress.totalFiles} files
        </p>
      )}

      {/* Checklist of Steps */}
      <div className="space-y-2 mb-4 bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
        {INDEXING_STEPS.map((stepName, idx) => {
          const stepNum = idx + 1;
          const isDone = isComplete || currentStepIndex > stepNum;
          const isCurrent = !isComplete && currentStepIndex === stepNum;

          return (
            <div
              key={stepName}
              className={`flex items-center gap-2 text-xs transition-colors ${
                isDone
                  ? 'text-gray-300 font-medium'
                  : isCurrent
                  ? 'text-indigo-400 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-gray-700 shrink-0" />
              )}
              <span>{stepName}</span>
            </div>
          );
        })}
      </div>

      {/* Error reason and retry button */}
      {isFailed && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-300 mb-1 font-semibold">Reason:</p>
          <p className="text-xs text-red-400 leading-relaxed font-mono">
            {safeProgress.error || 'An unexpected error occurred while parsing repository code.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Indexing</span>
            </button>
          )}
        </div>
      )}

      {/* Informative message */}
      {safeProgress.message && !isFailed && (
        <p className="text-xs text-gray-400 italic">
          {safeProgress.message}
        </p>
      )}
    </div>
  );
}
