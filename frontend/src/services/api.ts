import axios from 'axios';
import type { ChatRequest, ChatResponse, Conversation, IndexingStatus, FileInfo, LLMSettings } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 채팅 관련 API
export const chatApi = {
  sendMessage: async (data: ChatRequest) => {
    const response = await api.post<{ success: boolean; data: ChatResponse }>('/chat/message', data);
    return response.data.data;
  },

  getHistory: async () => {
    const response = await api.get<{ success: boolean; data: Conversation[] }>('/chat/history');
    return response.data.data;
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
