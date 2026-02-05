import { motion } from 'framer-motion';
import { FiUser, FiCpu } from 'react-icons/fi';
import type { Message } from '../../types';
import { FileReferenceCard } from '../Documents/FileReferenceCard';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <FiCpu className="text-white text-sm" />
        </div>
      )}

      <div className={`max-w-2xl ${isUser ? 'order-first' : ''}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-secondary text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="text-xs text-gray-400">참조 문서:</div>
            {message.sources.map((source, index) => (
              <FileReferenceCard key={index} source={source} />
            ))}
          </div>
        )}

        <div className="mt-1 text-xs text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <FiUser className="text-white text-sm" />
        </div>
      )}
    </motion.div>
  );
}
