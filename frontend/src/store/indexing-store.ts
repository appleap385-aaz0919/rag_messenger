import { create } from 'zustand';
import type { IndexingStatus } from '../types';

interface IndexingStore {
  status: IndexingStatus;
  setStatus: (status: IndexingStatus) => void;
  updateProgress: (progress: number, currentFile: string, processedFiles: number) => void;
}

const initialStatus: IndexingStatus = {
  isIndexing: false,
  progress: 0,
  totalFiles: 0,
  processedFiles: 0,
  errors: [],
};

export const useIndexingStore = create<IndexingStore>((set) => ({
  status: initialStatus,
  setStatus: (status) => set({ status }),
  updateProgress: (progress, currentFile, processedFiles) =>
    set((state) => ({
      status: {
        ...state.status,
        progress,
        currentFile,
        processedFiles,
      },
    })),
}));
