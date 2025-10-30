import React from 'react';
import { ChatHistory as ChatHistoryType } from '../types';
import { MessageSquare, Trash2, Download } from 'lucide-react';
import { generateSessionTitle, formatTimestamp } from '../utils/helpers';

interface ChatHistoryProps {
  sessions: ChatHistoryType[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportSession: (sessionId: string) => void;
  onNewChat: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onExportSession,
  onNewChat,
}) => {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Chat Baru
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Belum ada riwayat chat
          </div>
        ) : (
          <div className="p-2">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`group relative mb-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.sessionId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={() => onSelectSession(session.sessionId)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {generateSessionTitle(session.messages)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(session.updatedAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {session.messages.length} pesan
                    </p>
                  </div>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportSession(session.sessionId);
                    }}
                    className="p-1.5 bg-white rounded hover:bg-gray-100 border border-gray-200"
                    title="Ekspor"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Hapus chat ini?')) {
                        onDeleteSession(session.sessionId);
                      }
                    }}
                    className="p-1.5 bg-white rounded hover:bg-red-50 border border-gray-200"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
