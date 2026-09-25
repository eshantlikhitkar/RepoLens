import React from 'react';
import { HelpCircle } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  'How does authentication work in this project?',
  'Where is JWT generated?',
  'Explain the login flow.',
  'Which files handle database connections?',
  'Where is the user model defined?',
  'Explain this repository’s folder structure.',
  'Find potential security issues in the authentication implementation.',
];

export function SuggestedPrompts({ onSelectPrompt }) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 font-medium">
        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
        <span>Suggested Investigations:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left text-xs bg-[#161b22] hover:bg-[#21262d] text-gray-300 hover:text-indigo-300 border border-[#30363d] hover:border-indigo-500/50 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
