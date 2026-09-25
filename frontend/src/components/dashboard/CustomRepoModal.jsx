import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { FolderGit2, AlertCircle } from 'lucide-react';

export function CustomRepoModal({ isOpen, onClose }) {
  const [repoInput, setRepoInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = repoInput.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');

    const parts = trimmed.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError('Please provide a valid repository in the format "owner/repo" (e.g. facebook/react)');
      return;
    }

    const [owner, name] = parts;
    setError('');
    onClose();
    navigate(`/repositories/${owner}/${name}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Investigate Any Public Repository" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          Want to investigate a public open-source project or custom repository? Enter the GitHub repository path below.
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Repository Path (owner/repo or GitHub URL)
          </label>
          <div className="relative">
            <FolderGit2 className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => {
                setRepoInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. expressjs/express or facebook/react"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#21262d]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-[#21262d] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 transition-all"
          >
            Open Repository
          </button>
        </div>
      </form>
    </Modal>
  );
}
