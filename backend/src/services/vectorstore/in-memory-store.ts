import type { DocumentChunk, VectorSearchResult } from '../../types';
import fs from 'fs/promises';
import path from 'path';
import { embeddingsService } from '../embeddings/embeddings.factory';
import { v4 as uuidv4 } from 'uuid';

/**
 * 인메모리 벡터 저장소 서비스
 * ChromaDB 대신 사용하는 간단한 구현
 */
export class InMemoryVectorStore {
  private documents: Map<string, DocumentChunk> = new Map();
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(process.cwd(), 'data', 'vectorstore.json');
  }

  /**
   * 컬렉션 초기화 (인메모리이므로 별도 초기화 불필요)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const data = await fs.readFile(this.filePath, 'utf-8');
      const json = JSON.parse(data);
      this.documents = new Map(json);
      console.log(`Loaded ${this.documents.size} documents from ${this.filePath}`);
    } catch (error) {
      console.log('No existing vector store found, starting fresh.');
    }
  }

  private saveTimeout: NodeJS.Timeout | null = null;

  private isSaving = false;

  async save(force = false): Promise<void> {
    // If not forced and something like indexing is happening, we might want to skip
    // For now, let's keep the debounce but make sure it doesn't overlap
    if (this.isSaving) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    return new Promise((resolve) => {
      this.saveTimeout = setTimeout(async () => {
        try {
          this.isSaving = true;
          // Use setImmediate to let other tasks run before stringification
          await new Promise(resolve => setImmediate(resolve));

          console.log('[InMemoryStore] Starting serialization...');
          const start = Date.now();
          const entries = Array.from(this.documents.entries());
          const json = JSON.stringify(entries);
          const end = Date.now();
          console.log(`[InMemoryStore] Serialization took ${end - start}ms`);

          await fs.writeFile(this.filePath, json, 'utf-8');
          console.log(`Saved ${this.documents.size} documents to ${this.filePath}`);

          this.isSaving = false;
          this.saveTimeout = null;
          resolve();
        } catch (error) {
          console.error('Failed to save vector store:', error);
          this.isSaving = false;
          this.saveTimeout = null;
          resolve();
        }
      }, force ? 0 : 5000); // 5 second debounce for regular saves
    });
  }

  async addDocuments(documents: { pageContent: string; metadata: any }[], shouldSave = true, onProgress?: () => Promise<void>) {
    if (!documents.length) return;

    // 1. Generate embeddings
    const texts = documents.map(doc => doc.pageContent);
    const embeddingResults = await embeddingsService.embedBatch(texts, onProgress);

    // 2. Create chunks and add to map
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const embedding = embeddingResults?.[i]?.embedding; // Safety check
      if (!embedding) continue;

      const id = uuidv4();

      const chunk: DocumentChunk = {
        id,
        content: doc.pageContent,
        metadata: doc.metadata,
        embedding: embedding
      };

      this.documents.set(id, chunk);
    }

    // 3. Save conditionally
    if (shouldSave) {
      await this.save();
    }
    console.log(`Added ${documents.length} documents to In-Memory store (Total: ${this.documents.size})`);
  }

  /**
   * 문서 청크 추가 (Low level)
   */
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.documents.set(chunk.id, chunk);
    }
    await this.save();
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
   * 키워드 기반 검색 (파일명/경로/내용에서 키워드 매칭, TF 기반)
   */
  searchByKeyword(keywords: string[], nResults: number = 5): VectorSearchResult[] {
    if (!keywords.length) return [];

    const results: Array<{ chunk: DocumentChunk; score: number }> = [];

    // 키워드를 공백 제거 버전도 준비 (위키드 스톰 → 위키드스톰)
    const joinedKeywords = keywords.join('').toLowerCase();
    const kwLowerList = keywords.map(k => k.toLowerCase());

    let maxScore = 0; // 정규화를 위한 최대 점수 추적

    for (const doc of this.documents.values()) {
      let score = 0;
      const fileName = (doc.metadata.fileName || doc.metadata.filename || '').toLowerCase();
      const filePath = (doc.metadata.filePath || doc.metadata.source || '').toLowerCase();
      const content = doc.content.toLowerCase();
      // 공백 제거 버전 (파일명/경로)
      const fileNameNoSpace = fileName.replace(/\s+/g, '');
      const filePathNoSpace = filePath.replace(/\s+/g, '');

      for (const kw of kwLowerList) {
        // 파일명 매칭 (가중치 5)
        if (fileName.includes(kw)) {
          score += 5;
        }
        // 파일 경로(폴더명) 매칭 (가중치 3)
        else if (filePath.includes(kw)) {
          score += 3;
        }
        // 콘텐츠 매칭 (TF 기반, 빈도 반영, 최대 가중치 3)
        const contentMatches = content.split(kw).length - 1;
        if (contentMatches > 0) {
          score += Math.min(1 + Math.log2(contentMatches), 3); // log 기반 TF, 최대 3
        }
      }

      // 키워드 결합 매칭 (공백 무시): "위키드 스톰" → "위키드스톰" 매칭
      if (joinedKeywords.length >= 3) {
        if (fileNameNoSpace.includes(joinedKeywords)) {
          score += 7;
        } else if (filePathNoSpace.includes(joinedKeywords)) {
          score += 4;
        }
      }

      if (score > 0) {
        results.push({ chunk: doc, score });
        if (score > maxScore) maxScore = score;
      }
    }

    // 점수 순으로 정렬
    results.sort((a, b) => b.score - a.score);

    // 최대 점수 기반 정규화 (0-1 범위)
    const normalizer = maxScore > 0 ? maxScore : 1;

    return results.slice(0, nResults).map((r) => ({
      content: r.chunk.content,
      metadata: r.chunk.metadata,
      similarity: r.score / normalizer,
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
    await this.save();
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
  async deleteByFilePath(filePath: string, shouldSave = true): Promise<void> {
    let deleted = 0;
    for (const [id, doc] of this.documents.entries()) {
      if (doc.metadata.filePath === filePath) {
        this.documents.delete(id);
        deleted++;
      }
    }
    if (deleted > 0) {
      console.log(`[InMemoryStore] Deleted ${deleted} chunks for: ${filePath.split(/[/\\]/).pop()}`);
    }
    if (shouldSave) {
      await this.save();
    }
  }
}

export const inMemoryVectorStore = new InMemoryVectorStore();
