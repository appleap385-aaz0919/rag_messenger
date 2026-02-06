import { OpenAI } from 'openai';
import config from '../../config/app.config';
import type { EmbeddingResult } from '../../types';

/**
 * OpenAI 호환 임베딩 서비스
 * Zhipu AI 등 OpenAI 호환 API를 지원하는 공급자 사용 가능
 */
export class OpenAIEmbeddingsService {
  private client: OpenAI | null = null;
  private model: string;

  constructor() {
    this.model = config.embeddings.model || 'text-embedding-3-small';
    this.initializeClient();
  }

  private initializeClient(): void {
    const apiKey = config.embeddings.apiKey || config.llm.apiKey;
    const baseUrl = config.embeddings.baseUrl || config.llm.baseUrl;
    const finalBaseUrl = baseUrl || 'https://api.openai.com/v1';

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: finalBaseUrl,
      });
    }
  }

  /**
   * 단일 텍스트 임베딩
   */
  async embedText(text: string): Promise<EmbeddingResult> {
    if (!this.client) {
      throw new Error('임베딩 API Key가 설정되지 않았습니다. 설정에서 API Key를 입력해주세요.');
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('임베딩 결과가 없습니다.');
      }

      return {
        embedding,
        text,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`임베딩 생성 실패: ${error.message}`);
      }
      throw new Error(`임베딩 생성 실패: 알 수 없는 오류`);
    }
  }

  /**
   * 배치 텍스트 임베딩
   */
  async embedBatch(texts: string[], onProgress?: () => Promise<void>): Promise<EmbeddingResult[]> {
    if (!this.client) {
      throw new Error('임베딩 API Key가 설정되지 않았습니다. 설정에서 API Key를 입력해주세요.');
    }

    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      if (onProgress) {
        await onProgress();
      }
      results.push(await this.embedText(text));
    }
    return results;
  }

  /**
   * 코사인 유사도 계산
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('임베딩 차원이 일치하지 않습니다.');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  setModel(model: string): void {
    this.model = model;
  }

  reinitialize(): void {
    this.initializeClient();
  }
}

export const openAIEmbeddingsService = new OpenAIEmbeddingsService();
