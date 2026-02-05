import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { LLMSettings } from './LLMSettings';
import { FolderSettings } from './FolderSettings';

interface SettingsModalProps {
  onClose: () => void;
}

type Tab = 'llm' | 'folders';

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('llm');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          {/* 헤더 */}
          <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6">
            <h2 className="text-lg font-semibold">설정</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX />
            </button>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('llm')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'llm'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              LLM 설정
            </button>
            <button
              onClick={() => setActiveTab('folders')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'folders'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              폴더 관리
            </button>
          </div>

          {/* 내용 */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'llm' ? <LLMSettings /> : <FolderSettings />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
