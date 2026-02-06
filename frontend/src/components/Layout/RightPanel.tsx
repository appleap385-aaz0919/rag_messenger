import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useSettingsStore } from '../../store/settings-store';
import { useEffect } from 'react';
import { settingsApi } from '../../services/api';

export function RightPanel() {
  const { rightPanelOpen, setRightPanelOpen, folders, setFolders } = useSettingsStore();

  // 패널이 열릴 때 폴더 목록 로드
  useEffect(() => {
    if (rightPanelOpen) {
      settingsApi.getFolders()
        .then(setFolders)
        .catch(console.error);
    }
  }, [rightPanelOpen, setFolders]);

  return (
    <AnimatePresence>
      {rightPanelOpen && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-80 bg-background border-l border-gray-200 flex flex-col"
        >
          {/* 헤더 */}
          <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
            <h3 className="font-semibold text-gray-800">문서 목록</h3>
            <button
              onClick={() => setRightPanelOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX />
            </button>
          </div>

          {/* 폴더 목록 */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            <div className="text-xs text-gray-400 font-medium mb-2">등록된 폴더</div>
            <div className="space-y-2">
              {Array.isArray(folders) && folders.map((folder, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-sidebar rounded-lg text-sm text-gray-700 truncate"
                  title={folder}
                >
                  {folder}
                </div>
              ))}
              {(!Array.isArray(folders) || folders.length === 0) && (
                <div className="text-center text-gray-400 text-sm py-8">
                  등록된 폴더가 없습니다.
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
