import { ChromaClient, Collection } from 'chromadb';
import config from '../../config/app.config';
import type { DocumentChunk, VectorSearchResult } from '../../types';

/**
 * ChromaDB 벡터 저장소 서비스
 * 인메모리 모드 사용 (서버 재시작 시 데이터 초기화됨)
 */
export class ChromaDBService {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName: string;
  private documents: Map<string, { id: string; content: string; embedding: number[]; metadata: Record<string, any> }> = new Map();

  constructor() {
    // 인메모리 모드로 ChromaDB 클라이언트 초기화
    this.client = new ChromaClient({
      path: undefined, // 인메모리 모드
    });
    this.collectionName = config.vectorStore.collectionName;
  }

  /**
   * 컬렉션 초기화
   */
  async initialize(): Promise<void> {
    try {
      // 기존 컬렉션이 있으면 가져오기
      this.collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: undefined as any,
      });
    } catch {
      // 없으면 새로 생성
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: { description: '제프리 문서 컬렉션' },
      });
    }
  }

  /**
   * 문서 청크 추가
   */
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    const ids = chunks.map((c) => c.id);
    const embeddings = chunks.map((c) => c.embedding || []);
    const documents = chunks.map((c) => c.content);
    const metadatas = chunks.map((c) => ({
      filePath: c.metadata.filePath,
      fileName: c.metadata.fileName,
      chunkIndex: c.metadata.chunkIndex,
      fileType: c.metadata.fileType,
    }));

    // 로컬 메모리에도 저장
    for (const chunk of chunks) {
      this.documents.set(chunk.id, {
        id: chunk.id,
        content: chunk.content,
        embedding: chunk.embedding || [],
        metadata: {
          filePath: chunk.metadata.filePath,
          fileName: chunk.metadata.fileName,
          chunkIndex: chunk.metadata.chunkIndex,
          fileType: chunk.metadata.fileType,
        },
      });
    }

    await this.collection!.add({
      ids,
      embeddings: embeddings.length > 0 ? embeddings : undefined,
      documents,
      metadatas,
    });
  }

  /**
   * 유사도 검색
   */
  async search(
    queryEmbedding: number[],
    nResults: number = 5,
  ): Promise<VectorSearchResult[]> {
    if (!this.collection) {
      await this.initialize();
    }

    const results = await this.collection!.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
    });

    const searchResults: VectorSearchResult[] = [];

    if (results.documents[0] && results.metadatas[0] && results.distances?.[0]) {
      for (let i = 0; i < results.documents[0].length; i++) {
        const content = results.documents[0][i];
        if (content !== null) {
          searchResults.push({
            content,
            metadata: results.metadatas[0][i] as {
              filePath: string;
              fileName: string;
              chunkIndex: number;
              fileType: string;
            },
            similarity: 1 - (results.distances[0]?.[i] ?? 0),
          });
        }
      }
    }

    return searchResults;
  }

  /**
   * 모든 문서 삭제
   */
  async clear(): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    await this.collection!.delete({
      where: {},
    });
    this.documents.clear();
  }

  /**
   * 컬렉션 크기 확인
   */
  async count(): Promise<number> {
    if (!this.collection) {
      await this.initialize();
    }

    const results = await this.collection!.get();
    return results.ids.length;
  }

  /**
   * 특정 파일의 문서 삭제
   */
  async deleteByFilePath(filePath: string): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    await this.collection!.delete({
      where: { filePath },
    });

    // 로컬 메모리에서도 삭제
    for (const [id, doc] of this.documents.entries()) {
      if (doc.metadata.filePath === filePath) {
        this.documents.delete(id);
      }
    }
  }
}

export const chromaDBService = new ChromaDBService();
