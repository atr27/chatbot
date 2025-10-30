import React from 'react';
import { Message } from '../types';
import { formatTimestamp } from '../utils/helpers';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gray-700'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-xs text-gray-500 mt-1 px-2">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
