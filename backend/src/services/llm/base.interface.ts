// LLM 공통 인터페이스 정의

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMCompletionResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ILLMService {
  /**
   * 단일 메시지로 완성 생성
   */
  complete(prompt: string, options?: LLMCompletionOptions): Promise<LLMCompletionResult>;

  /**
   * 대화 형식으로 메시지 전송
   */
  chat(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult>;

  /**
   * 스트리밍 완성 (AsyncGenerator 기반)
   */
  streamComplete(
    prompt: string,
    options?: LLMCompletionOptions,
  ): AsyncGenerator<string>;

  /**
   * 모델 정보 확인
   */
  getModelInfo(): Promise<{ name: string; contextSize: number }>;
}
