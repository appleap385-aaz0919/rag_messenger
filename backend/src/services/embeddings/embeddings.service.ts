import { Ollama } from 'ollama';
import config from '../../config/app.config';
import type { EmbeddingResult } from '../../types';

/**
 * 임베딩 서비스
 * Ollama를 사용한 텍스트 임베딩
 */
export class EmbeddingsService {
  private client: Ollama;
  private model: string;

  constructor() {
    this.client = new Ollama({ host: config.embeddings.baseUrl || config.llm.baseUrl });
    this.model = config.embeddings.model;
  }

  /**
   * 단일 텍스트 임베딩 (재시도 로직 추가)
   */
  async embedText(text: string, retries = 3): Promise<EmbeddingResult> {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await this.client.embeddings({
          model: this.model,
          prompt: text,
        });

        clearTimeout(timeoutId);

        return {
          embedding: response.embedding,
          text,
        };
      } catch (error) {
        const isLastRetry = i === retries - 1;
        if (isLastRetry) {
          if (error instanceof Error && 'cause' in error) {
            const cause = (error as { cause: { code?: string } }).cause;
            if (cause?.code === 'ECONNREFUSED') {
              throw new Error(`Ollama 서버에 연결할 수 없습니다 (${config.embeddings.baseUrl}). Ollama 서버가 실행 중인지 확인해주세요.`);
            }
          }
          throw new Error(`임베딩 생성 실패 (최종 시도): ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
        console.warn(`[Embeddings] Attempt ${i + 1} failed, retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('임베딩 생성 실패: 모든 재시도가 실패했습니다.');
  }

  /**
   * 배치 텍스트 임베딩
   */
  async embedBatch(texts: string[], onProgress?: () => Promise<void>): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (const text of texts) {
      if (onProgress) await onProgress();
      const result = await this.embedText(text);
      results.push(result);
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
}

export const embeddingsService = new EmbeddingsService();
