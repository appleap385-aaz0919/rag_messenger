import axios from 'axios';
import type { ChatRequest, ChatResponse, Conversation, IndexingStatus, FileInfo, LLMSettings } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// 채팅 관련 API
export const chatApi = {
  sendMessage: async (data: ChatRequest) => {
    const response = await api.post<{ success: boolean; data: ChatResponse }>('/chat/message', data);
    return response.data.data;
  },

  sendMessageStream: async (data: ChatRequest, onUpdate: (packet: { type: string; content: any }) => void) => {
    const response = await fetch('/api/chat/message/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Streaming request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.substring(6));
            onUpdate(json);
          } catch (e) {
            console.warn('Failed to parse stream chunk:', e);
          }
        }
      }
    }
  },

  getConversation: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Conversation }>(`/chat/conversation/${id}`);
    return response.data.data;
  },
};

// 문서 관련 API
export const documentsApi = {
  startIndex: async () => {
    const response = await api.post<{ success: boolean; message: string }>('/documents/index');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get<{ success: boolean; data: IndexingStatus }>('/documents/status');
    return response.data.data;
  },

  stopIndex: async () => {
    const response = await api.post<{ success: boolean; message: string }>('/documents/stop-index');
    return response.data;
  },

  clearIndex: async () => {
    const response = await api.post<{ success: boolean; message: string }>('/documents/clear-index');
    return response.data;
  },

  getFiles: async () => {
    const response = await api.get<{ success: boolean; data: FileInfo[] }>('/documents/files');
    return response.data.data;
  },

  searchFiles: async (query: string) => {
    const response = await api.get<{ success: boolean; data: FileInfo[] }>('/documents/search', {
      params: { query },
    });
    return response.data.data;
  },
};

// 설정 관련 API
export const settingsApi = {
  getFolders: async () => {
    const response = await api.get<{ success: boolean; data: string[] }>('/settings/folders');
    return response.data.data;
  },

  addFolder: async (folder: string) => {
    const response = await api.post<{ success: boolean; data: string[] }>('/settings/folders', { folder });
    return response.data.data;
  },

  removeFolder: async (folder: string) => {
    const response = await api.delete<{ success: boolean; data: string[] }>('/settings/folders', {
      data: { folder },
    });
    return response.data.data;
  },

  getLLMConfig: async () => {
    const response = await api.get<{ success: boolean; data: LLMSettings }>('/settings/llm');
    return response.data.data;
  },

  updateLLMConfig: async (settings: Partial<LLMSettings>) => {
    const response = await api.put<{ success: boolean; data: LLMSettings }>('/settings/llm', settings);
    return response.data.data;
  },
};
