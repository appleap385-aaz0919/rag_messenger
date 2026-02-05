// 메시지 타입
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
  timestamp: string;
}

// 파일 정보 타입
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modifiedTime: string;
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
  createdAt: string;
  updatedAt: string;
}

// LLM 설정 타입
export interface LLMSettings {
  provider: 'ollama' | 'openai';
  model: string;
  baseUrl: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
}

// WebSocket 이벤트 타입
export interface WSEvent {
  type: 'index_progress' | 'index_complete' | 'file_changed' | 'error';
  data: unknown;
}

// 인덱싱 진행률 이벤트 타입
export interface IndexProgressEvent {
  type: 'index_progress';
  data: {
    progress: number;
    currentFile: string;
    processedFiles: number;
    totalFiles: number;
  };
}

// 파일 변경 이벤트 타입
export interface FileChangedEvent {
  type: 'file_changed';
  data: {
    filePath: string;
    action: 'added' | 'modified' | 'deleted';
  };
}
