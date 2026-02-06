import { useState, KeyboardEvent } from 'react';
import { FiSend } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { chatApi } from '../../services/api';
import { useChatStore } from '../../store/chat-store';
import { v4 as uuidv4 } from 'uuid';

export function ChatInput() {
  const [message, setMessage] = useState('');
  const { addMessage, updateMessage, setTyping } = useChatStore();

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setMessage('');
    setTyping(true);

    const assistantId = uuidv4();
    const initialAssistantMessage = {
      id: assistantId,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toISOString(),
      sources: [],
    };
    addMessage(initialAssistantMessage);

    let fullContent = '';

    try {
      await chatApi.sendMessageStream(
        { message: userMessage.content },
        (packet) => {
          if (packet.type === 'chunk') {
            fullContent += packet.content;
            updateMessage(assistantId, { content: fullContent });
          } else if (packet.type === 'sources') {
            updateMessage(assistantId, { sources: packet.content });
          } else if (packet.type === 'error') {
            updateMessage(assistantId, { content: `오류가 발생했습니다: ${packet.content}` });
          }
        }
      );
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      updateMessage(assistantId, {
        content: '죄송합니다. 서버와 연결하는 중 오류가 발생했습니다.'
      });
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-end gap-2 bg-gray-100 rounded-2xl p-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (/명령어)"
          className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-sm max-h-32 min-h-[40px]"
          rows={1}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!message.trim()}
          className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSend />
        </motion.button>
      </div>
      <div className="text-center mt-2">
        <p className="text-xs text-gray-400">
          Enter로 전송, Shift + Enter로 줄바꿈
        </p>
      </div>
    </div>
  );
}
