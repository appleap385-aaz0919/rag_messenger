import { EmbeddingsService } from './embeddings.service';
import { openAIEmbeddingsService } from './openai-embeddings.service';
import { zhipuEmbeddingsService } from './zhipu-embeddings.service';

/**
 * 임베딩 서비스 인터페이스 (공통 메서드)
 */
interface IEmbeddingsService {
  embedText(text: string): Promise<{ embedding: number[]; text: string }>;
  embedBatch(texts: string[]): Promise<{ embedding: number[]; text: string }[]>;
}

/**
 * 임베딩 서비스 팩토리
 * 설정에 따라 다른 임베딩 공급자를 반환
 */
export class EmbeddingsFactory {
  private static instance: IEmbeddingsService | null = null;

  static getInstance(): IEmbeddingsService {
    if (!this.instance) {
      // config를 매번 다시 import하여 최신값 사용
      const freshConfig = require('../../config/app.config').default;

      switch (freshConfig.embeddings.provider) {
        case 'ollama':
          this.instance = new EmbeddingsService();
          break;
        case 'openai':
          this.instance = openAIEmbeddingsService;
          break;
        case 'zhipu':
          // Zhipu는 전용 서비스 사용 (JWT 토큰 인증 필요)
          zhipuEmbeddingsService.setConfig(
            freshConfig.embeddings.apiKey || freshConfig.llm.apiKey || '',
            freshConfig.embeddings.baseUrl || freshConfig.llm.baseUrl,
            freshConfig.embeddings.model,
          );
          this.instance = zhipuEmbeddingsService;
          break;
        default:
          this.instance = new EmbeddingsService();
      }
    }
    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
    // OpenAI 서비스는 재초기화 필요
    openAIEmbeddingsService.reinitialize();
    // Zhipu 서비스는 다음 getInstance에서 config 재로드
  }
}

// 기본 내보내기
export const embeddingsService = EmbeddingsFactory.getInstance();
