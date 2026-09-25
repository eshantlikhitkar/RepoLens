import React from 'react';
import { MessageSquare, Plus, Trash2, X } from 'lucide-react';

export function ConversationSidebar({
  isOpen,
  onClose,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-72 bg-[#161b22] border-l border-[#30363d] shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>Investigations History</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#21262d]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New conversation button */}
      <div className="p-2.5 border-b border-[#21262d]">
        <button
          onClick={() => {
            onNewConversation();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-center text-xs text-gray-400 p-4">
            No previous investigations yet.
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = activeConversationId === conv._id;
            return (
              <div
                key={conv._id}
                onClick={() => {
                  onSelectConversation(conv._id);
                  onClose();
                }}
                className={`group flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-700/60 font-medium'
                    : 'text-gray-300 hover:text-white hover:bg-[#21262d]'
                }`}
              >
                <div className="truncate flex-1">
                  <p className="truncate">{conv.title || 'Untitled Investigation'}</p>
                  <span className="text-[10px] text-gray-400">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
