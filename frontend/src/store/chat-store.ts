import { create } from 'zustand';
import type { Message } from '../types';

interface ChatStore {
  messages: Message[];
  isTyping: boolean;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setTyping: (isTyping) => set({ isTyping }),
  clearMessages: () => set({ messages: [] }),
}));
