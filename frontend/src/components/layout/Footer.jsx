import React from 'react';
import { Terminal, Shield, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#21262d] bg-[#0d1117] py-6 px-4 text-xs text-gray-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-gray-300">RepoLens AI</span>
          <span className="text-gray-600">·</span>
          <span>RAG-Powered GitHub Repository Investigator</span>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Zero-Token Leakage & AES-256 Storage
          </span>
          <span className="text-gray-600">·</span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Precise Code Citations
          </span>
        </div>
      </div>
    </footer>
  );
}
