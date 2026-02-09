import { create } from 'zustand';
import type { LLMSettings } from '../types';

interface SettingsStore {
  folders: string[];
  llmSettings: LLMSettings;
  rightPanelOpen: boolean;
  setFolders: (folders: string[]) => void;
  setLLMSettings: (settings: LLMSettings) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
}

const defaultLLMSettings: LLMSettings = {
  provider: 'zhipu',
  model: 'glm-4',
  baseUrl: 'https://api.z.ai/api/anthropic',
  temperature: 0.7,
  maxTokens: 2000,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  folders: [],
  llmSettings: defaultLLMSettings,
  rightPanelOpen: false,
  setFolders: (folders) => set({ folders }),
  setLLMSettings: (llmSettings) => set({ llmSettings }),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
}));
