/**
 * Zhipu AI 임베딩 서비스
 * Zhipu AI 전용 임베딩 API 직접 호출
 */
import jwt from 'jsonwebtoken';

export class ZhipuEmbeddingsService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.apiKey = process.env.ZHIPU_API_KEY || '';
    this.baseUrl = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
    this.model = process.env.ZHIPU_EMBEDDING_MODEL || 'embedding-2';
  }

  /**
   * JWT 토큰 생성
   * Zhipu AI는 JWT 토큰을 사용하여 인증
   */
  private generateToken(): string {
    const now = Date.now(); // Milliseconds
    // 캐시된 토큰이 있고 만료되지 않았으면 재사용
    if (this.cachedToken && now < this.tokenExpiry) {
      return this.cachedToken;
    }

    const [id, secret] = this.apiKey.split('.');
    if (!id || !secret) {
      throw new Error('유효하지 않은 Zhipu API Key 형식입니다. (id.secret 형식이어야 합니다)');
    }

    // 토큰 페이로드
    const payload = {
      api_key: id,
      exp: now + 3600 * 1000, // 1시간 후 만료 (ms)
      timestamp: now, // ms
    };

    // JWT 토큰 생성
    const token = jwt.sign(payload, secret, {
      algorithm: 'HS256',
      header: { alg: 'HS256', sign_type: 'SIGN' }
    });

    // 토큰 캐시 (5분 전에 만료로 간주하여 갱신)
    this.cachedToken = token;
    this.tokenExpiry = now + 3600 * 1000 - 300 * 1000; // ms

    return token;
  }

  setConfig(apiKey: string, baseUrl?: string, model?: string): void {
    this.apiKey = apiKey;
    if (baseUrl) this.baseUrl = baseUrl.replace(/\/$/, '');
    if (model) this.model = model;
  }

  async embedText(text: string): Promise<{ embedding: number[]; text: string }> {
    if (!this.apiKey) {
      throw new Error('Zhipu API Key가 설정되지 않았습니다.');
    }

    try {
      const requestBody = {
        model: this.model,
        input: text,
      };
      console.log('[Zhipu Embedding] Request:', JSON.stringify(requestBody, null, 2));

      const token = this.generateToken();
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zhipu API 오류: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as { data?: Array<{ embedding: number[] }> };
      const embedding = data.data?.[0]?.embedding;

      if (!embedding) {
        throw new Error('임베딩 결과가 없습니다.');
      }

      return { embedding, text };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`임베딩 생성 실패: ${error.message}`);
      }
      throw new Error('임베딩 생성 실패: 알 수 없는 오류');
    }
  }

  /**
   * 배치 텍스트 임베딩
   */
  async embedBatch(texts: string[], onProgress?: () => Promise<void>): Promise<Array<{ embedding: number[]; text: string }>> {
    if (!this.apiKey) {
      throw new Error('Zhipu API Key가 설정되지 않았습니다.');
    }

    const results: Array<{ embedding: number[]; text: string }> = [];
    for (const text of texts) {
      if (onProgress) {
        await onProgress();
      }
      results.push(await this.embedText(text));
    }
    return results;
  }

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

export const zhipuEmbeddingsService = new ZhipuEmbeddingsService();
