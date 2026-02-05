import { ReactNode } from 'react';
import { ChatInput } from '../Chat/ChatInput';
import { ChatMessage } from '../Chat/ChatMessage';
import { useChatStore } from '../../store/chat-store';

interface MainChatProps {
  children?: ReactNode;
}

export function MainChat({ children }: MainChatProps) {
  const { messages, isTyping } = useChatStore();

  return (
    <main className="flex-1 flex flex-col bg-background">
      {/* 헤더 */}
      <header className="h-14 border-b border-gray-200 flex items-center px-6">
        <h2 className="font-semibold text-gray-800">새 대화</h2>
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                주인님, 안녕하세요!
              </h3>
              <p className="text-gray-500">
                문서에 대해 궁금한 점을 물어보세요.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200">
        <ChatInput />
      </div>

      {children}
    </main>
  );
}
