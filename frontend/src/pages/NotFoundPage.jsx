import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] text-white p-6">
      <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4 text-indigo-400">
        <Terminal className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">404 — Page Not Found</h1>
      <p className="text-xs text-gray-400 max-w-sm text-center mb-6">
        The repository workspace or page you were looking for does not exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
      >
        <Home className="w-4 h-4" />
        <span>Return Home</span>
      </Link>
    </div>
  );
}
