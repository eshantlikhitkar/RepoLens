import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export function RepositorySearch({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedVisibility,
  onVisibilityChange,
  sortOrder,
  onSortChange,
  languages = [],
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] rounded-xl p-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search repositories by name or description..."
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Visibility Filter */}
        <select
          value={selectedVisibility}
          onChange={(e) => onVisibilityChange(e.target.value)}
          className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Visibility</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        {/* Language Filter */}
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        {/* Sort Order */}
        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="updated">Recently Updated</option>
          <option value="stars">Most Stars</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>
    </div>
  );
}
