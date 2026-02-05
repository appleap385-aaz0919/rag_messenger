import config from '../../config/app.config';
import { OllamaService } from './ollama.service';
// import { OpenAIService } from './openai.service'; // 확장용
import type { ILLMService } from './base.interface';

/**
 * LLM 서비스 팩토리
 * 설정에 따라 다른 LLM 공급자를 반환
 */
export class LLMFactory {
  private static instance: ILLMService | null = null;

  static getInstance(): ILLMService {
    if (!this.instance) {
      switch (config.llm.provider) {
        case 'ollama':
          this.instance = new OllamaService();
          break;
        case 'openai':
          // this.instance = new OpenAIService();
          throw new Error('OpenAI 서비스는 아직 구현되지 않았습니다.');
        default:
          this.instance = new OllamaService();
      }
    }
    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }
}

// 기본 내보내기
export const llmService = LLMFactory.getInstance();
