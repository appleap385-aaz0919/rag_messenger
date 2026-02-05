import { motion } from 'framer-motion';
import { FiFileText } from 'react-icons/fi';
import type { DocumentSource } from '../../types';

interface FileReferenceCardProps {
  source: DocumentSource;
}

export function FileReferenceCard({ source }: FileReferenceCardProps) {
  const handleOpen = () => {
    // 파일 경로로 열기
    window.open(`file://${source.filePath}`, '_blank');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      onClick={handleOpen}
      className="w-full flex items-start gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all text-left group"
    >
      <FiFileText className="text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 truncate group-hover:text-primary">
          {source.fileName}
        </div>
        <div className="text-xs text-gray-400 truncate">
          {source.filePath}
        </div>
      </div>
      {source.relevance !== undefined && (
        <div className="text-xs text-gray-400 flex-shrink-0">
          {Math.round(source.relevance * 100)}%
        </div>
      )}
    </motion.button>
  );
}
