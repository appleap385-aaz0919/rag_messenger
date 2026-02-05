import { useState } from 'react';
import { FiFolderPlus, FiTrash2 } from 'react-icons/fi';
import { settingsApi } from '../../services/api';
import { useSettingsStore } from '../../store/settings-store';
import { useEffect } from 'react';

export function FolderSettings() {
  const { folders, setFolders } = useSettingsStore();
  const [newFolder, setNewFolder] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // 폴더 목록 로드
    settingsApi.getFolders().then(setFolders).catch(console.error);
  }, [setFolders]);

  const handleAdd = async () => {
    if (!newFolder.trim()) return;

    setIsAdding(true);
    try {
      const updated = await settingsApi.addFolder(newFolder);
      setFolders(updated);
      setNewFolder('');
    } catch (error) {
      console.error('폴더 추가 오류:', error);
      alert('폴더 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (folder: string) => {
    if (!confirm(`정말로 이 폴더를 제거하시겠습니까?\n${folder}`)) return;

    try {
      const updated = await settingsApi.removeFolder(folder);
      setFolders(updated);
    } catch (error) {
      console.error('폴더 제거 오류:', error);
      alert('폴더 제거에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      {/* 폴더 추가 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
          placeholder="폴더 경로를 입력하세요..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || !newFolder.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <FiFolderPlus />
          추가
        </button>
      </div>

      {/* 폴더 목록 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {folders.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            등록된 폴더가 없습니다.
          </div>
        ) : (
          folders.map((folder, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-sidebar rounded-lg group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-700 truncate" title={folder}>
                  {folder}
                </div>
              </div>
              <button
                onClick={() => handleRemove(folder)}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiTrash2 />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 안내 */}
      <div className="text-xs text-gray-400 p-3 bg-gray-50 rounded-lg">
        등록된 폴더의 문서들이 자동으로 인덱싱됩니다. 지원 형식: PDF, DOCX, Excel, PowerPoint, TXT, MD, JSON, XML
      </div>
    </div>
  );
}
