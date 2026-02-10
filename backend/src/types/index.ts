// 메시지 타입
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
}

// 문서 소스 타입
export interface DocumentSource {
  filePath: string;
  fileName: string;
  chunkIndex: number;
  relevance?: number;
}

// 인덱싱 상태 타입
export interface IndexingStatus {
  isIndexing: boolean;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  errors: IndexingError[];
}

// 인덱싱 오류 타입
export interface IndexingError {
  filePath: string;
  error: string;
  timestamp: Date;
}

// 파일 정보 타입
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modifiedTime: Date;
  type: string;
}

// 채팅 요청 타입
export interface ChatRequest {
  message: string;
  conversationId?: string;
}

// 채팅 응답 타입
export interface ChatResponse {
  messageId: string;
  content: string;
  sources: DocumentSource[];
  timestamp: string;
}

// 대화 기록 타입
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// LLM 응답 타입
export interface LLMResponse {
  content: string;
  sources?: DocumentSource[];
}

// 임베딩 결과 타입
export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

// 문서 청크 타입
export interface DocumentChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    filePath: string;
    fileName: string;
    chunkIndex: number;
    fileType: string;
    source?: string;     // filePath의 대체 필드 (호환성)
    filename?: string;   // fileName의 대체 필드 (호환성)
    [key: string]: any;  // 추가 메타데이터 허용
  };
}

// 벡터 검색 결과 타입
export interface VectorSearchResult {
  content: string;
  metadata: {
    filePath: string;
    fileName: string;
    chunkIndex: number;
    fileType: string;
    source?: string;
    filename?: string;
    [key: string]: any;
  };
  similarity: number;
}

// 명령어 타입
export interface Command {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<CommandResult>;
}

// 명령어 실행 결과 타입
export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// WebSocket 이벤트 타입
export interface WSEvent {
  type: 'index_progress' | 'index_complete' | 'file_changed' | 'error';
  data: unknown;
}

// 인덱싱 진행률 이벤트 타입
export interface IndexProgressEvent extends WSEvent {
  type: 'index_progress';
  data: {
    progress: number;
    currentFile: string;
    processedFiles: number;
    totalFiles: number;
  };
}

// 파일 변경 이벤트 타입
export interface FileChangedEvent extends WSEvent {
  type: 'file_changed';
  data: {
    filePath: string;
    action: 'added' | 'modified' | 'deleted';
  };
}
