import type { DocumentChunk, VectorSearchResult } from '../../types';

/**
 * 인메모리 벡터 저장소 서비스
 * ChromaDB 대신 사용하는 간단한 구현
 */
export class InMemoryVectorStore {
  private documents: Map<string, DocumentChunk> = new Map();

  constructor() {
    // 인메모리 저장소
  }

  /**
   * 컬렉션 초기화 (인메모리이므로 별도 초기화 불필요)
   */
  async initialize(): Promise<void> {
    // 인메모리이므로 별도 초기화 불필요
  }

  /**
   * 문서 청크 추가
   */
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.documents.set(chunk.id, chunk);
    }
  }

  /**
   * 유사도 검색 (코사인 유사도)
   */
  async search(
    queryEmbedding: number[],
    nResults: number = 5,
  ): Promise<VectorSearchResult[]> {
    const results: Array<{ chunk: DocumentChunk; similarity: number }> = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({ chunk: doc, similarity });
    }

    // 유사도 순으로 정렬하고 상위 nResults 반환
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, nResults).map((r) => ({
      content: r.chunk.content,
      metadata: r.chunk.metadata,
      similarity: r.similarity,
    }));
  }

  /**
   * 코사인 유사도 계산
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 모든 문서 삭제
   */
  async clear(): Promise<void> {
    this.documents.clear();
  }

  /**
   * 컬렉션 크기 확인
   */
  async count(): Promise<number> {
    return this.documents.size;
  }

  /**
   * 특정 파일의 문서 삭제
   */
  async deleteByFilePath(filePath: string): Promise<void> {
    for (const [id, doc] of this.documents.entries()) {
      if (doc.metadata.filePath === filePath) {
        this.documents.delete(id);
      }
    }
  }
}

export const inMemoryVectorStore = new InMemoryVectorStore();
