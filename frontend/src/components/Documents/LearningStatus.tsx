import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import type { IndexingStatus } from '../../types';

interface LearningStatusProps {
  status: IndexingStatus;
}

export function LearningStatus({ status }: LearningStatusProps) {
  if (!status.isIndexing && status.totalFiles === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        {status.isIndexing ? (
          <FiLoader className="text-primary animate-spin" />
        ) : status.errors.length > 0 ? (
          <FiAlertCircle className="text-yellow-500" />
        ) : (
          <FiCheckCircle className="text-green-500" />
        )}
        <h3 className="font-semibold text-gray-800">
          {status.isIndexing ? '학습 중...' : '학습 완료'}
        </h3>
      </div>

      {/* 진행률 바 */}
      {status.isIndexing && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{status.currentFile || '처리 중...'}</span>
            <span>{status.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {status.processedFiles} / {status.totalFiles} 파일 처리됨
          </div>
        </div>
      )}

      {/* 완료 상태 */}
      {!status.isIndexing && status.totalFiles > 0 && (
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold">{status.totalFiles}</span>개의 파일이 학습되었습니다.
        </div>
      )}

      {/* 오류 목록 */}
      {status.errors.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-2">오류가 발생한 파일:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {status.errors.map((error, index) => (
              <div
                key={index}
                className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded truncate"
                title={`${error.filePath}: ${error.error}`}
              >
                {error.filePath}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
