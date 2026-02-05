import { FiMessageSquare, FiSettings, FiRefreshCw } from 'react-icons/fi';
import { useSettingsStore } from '../../store/settings-store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { SettingsModal } from '../Settings/SettingsModal';

export function Sidebar() {
  const { toggleRightPanel } = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  const handleIndexing = async () => {
    setIsIndexing(true);
    try {
      // TODO: 인덱싱 API 호출
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <>
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        className="w-60 bg-sidebar border-r border-gray-200 flex flex-col"
      >
        {/* 로고 영역 */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">제프리</h1>
          <p className="text-xs text-gray-500 mt-1">AI 문서 어시스턴트</p>
        </div>

        {/* 새 대화 버튼 */}
        <div className="p-3">
          <button className="w-full bg-primary text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-blue-600 transition-colors">
            + 새 대화
          </button>
        </div>

        {/* 대화 목록 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          <div className="text-xs text-gray-400 font-medium">최근 대화</div>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700">
            프로젝트 일정 문의
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700">
            코드 리뷰 요청
          </button>
        </div>

        {/* 하단 메뉴 */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <button
            onClick={handleIndexing}
            disabled={isIndexing}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700 disabled:opacity-50"
          >
            <FiRefreshCw className={isIndexing ? 'animate-spin' : ''} />
            {isIndexing ? '인덱싱 중...' : '재학습'}
          </button>
          <button
            onClick={toggleRightPanel}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700"
          >
            <FiMessageSquare />
            문서 목록
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700"
          >
            <FiSettings />
            설정
          </button>
        </div>
      </motion.aside>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
