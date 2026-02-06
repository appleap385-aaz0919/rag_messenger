import { FiMessageSquare, FiSettings, FiRefreshCw, FiPlus } from 'react-icons/fi';
import { useSettingsStore } from '../../store/settings-store';
import { useChatStore } from '../../store/chat-store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { SettingsModal } from '../Settings/SettingsModal';
import { documentsApi } from '../../services/api';

export function Sidebar() {
  const { toggleRightPanel } = useSettingsStore();
  const { clearMessages } = useChatStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  const handleNewChat = () => {
    clearMessages();
  };

  const handleIndexing = async () => {
    setIsIndexing(true);
    try {
      await documentsApi.startIndex();
    } catch (error) {
      console.error('인덱싱 오류:', error);
      const errorMessage = (error as any)?.response?.data?.error?.message || (error as any)?.message || '인덱싱 시작 실패';
      alert(`인덱싱 시작 실패: ${errorMessage}`);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleStopIndexing = async () => {
    try {
      await documentsApi.stopIndex();
    } catch (error) {
      console.error('인덱싱 중단 오류:', error);
    }
  };

  const handleClearIndex = async () => {
    if (window.confirm('모든 인덱스 데이터를 삭제하시겠습니까? 대화가 불가능해질 수 있습니다.')) {
      try {
        await documentsApi.clearIndex();
        alert('인덱스가 초기화되었습니다.');
      } catch (error) {
        console.error('인덱스 초기화 오류:', error);
      }
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
          <button
            onClick={handleNewChat}
            className="w-full bg-primary text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <FiPlus />
            새 대화
          </button>
        </div>

        {/* 대화 목록 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          <div className="text-center text-gray-400 text-sm py-8">
            대화 기록이 없습니다.<br />
            새 대화를 시작해주세요!
          </div>
        </div>

        {/* 하단 메뉴 */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          {isIndexing ? (
            <button
              onClick={handleStopIndexing}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm text-red-600"
            >
              <FiRefreshCw className="animate-spin" />
              중단하기
            </button>
          ) : (
            <button
              onClick={handleIndexing}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700"
            >
              <FiRefreshCw />
              재학습
            </button>
          )}
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
          <button
            onClick={handleClearIndex}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-xs text-red-400 mt-4"
          >
            인덱스 초기화
          </button>
        </div>
      </motion.aside>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
