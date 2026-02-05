import { documentProcessor } from '../document-processor/document-processor.service';
import { inMemoryVectorStore } from '../vectorstore/in-memory-store';
import { wsManager } from '../../utils/ws-manager';
import type { IndexingStatus } from '../../types';

/**
 * 인덱싱 서비스
 * 문서 수집, 처리, ChromaDB 저장
 */
export class IndexingService {
  private status: IndexingStatus = {
    isIndexing: false,
    progress: 0,
    totalFiles: 0,
    processedFiles: 0,
    errors: [],
  };

  private abortController: AbortController | null = null;

  /**
   * 인덱싱 시작
   */
  async startIndexing(signal?: AbortSignal): Promise<void> {
    if (this.status.isIndexing) {
      throw new Error('이미 인덱싱이 진행 중입니다.');
    }

    this.abortController = new AbortController();
    const finalSignal = signal || this.abortController.signal;

    this.status = {
      isIndexing: true,
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      errors: [],
    };

    try {
      // 1. 모든 파일 검색
      const files = await documentProcessor.getAllFiles();
      this.status.totalFiles = files.length;

      if (files.length === 0) {
        wsManager.broadcastIndexComplete();
        return;
      }

      // 2. 저장소 초기화
      await inMemoryVectorStore.initialize();

      // 3. 파일 배치 처리
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        if (finalSignal.aborted) {
          throw new Error('인덱싱이 취소되었습니다.');
        }

        const batch = files.slice(i, i + batchSize);
        await this.processBatch(batch);
      }

      wsManager.broadcastIndexComplete();
    } catch (error) {
      console.error('인덱싱 오류:', error);
      wsManager.broadcastError(error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    } finally {
      this.status.isIndexing = false;
      this.abortController = null;
    }
  }

  /**
   * 배치 처리
   */
  private async processBatch(files: Array<{ path: string; name: string }>): Promise<void> {
    for (const file of files) {
      try {
        // 진행률 브로드캐스트
        this.status.processedFiles++;
        this.status.progress = Math.round(
          (this.status.processedFiles / this.status.totalFiles) * 100,
        );

        wsManager.broadcastIndexProgress(
          this.status.progress,
          file.name,
          this.status.processedFiles,
          this.status.totalFiles,
        );

        // 파일 처리
        const chunks = await documentProcessor.processFile(file.path);

        // ChromaDB에 저장
        if (chunks.length > 0) {
          await inMemoryVectorStore.addChunks(chunks);
        }
      } catch (error) {
        console.error(`파일 처리 오류 (${file.path}):`, error);
        this.status.errors.push({
          filePath: file.path,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * 인덱싱 취소
   */
  cancelIndexing(): void {
    this.abortController?.abort();
    this.status.isIndexing = false;
  }

  /**
   * 인덱싱 상태 조회
   */
  getStatus(): IndexingStatus {
    return { ...this.status };
  }

  /**
   * 단일 파일 재인덱싱
   */
  async reindexFile(filePath: string): Promise<void> {
    try {
      // 기존 문서 삭제
      await inMemoryVectorStore.deleteByFilePath(filePath);

      // 파일 재처리
      const chunks = await documentProcessor.processFile(filePath);

      // ChromaDB에 저장
      if (chunks.length > 0) {
        await inMemoryVectorStore.addChunks(chunks);
      }

      wsManager.broadcastFileChanged(filePath, 'modified');
    } catch (error) {
      console.error(`파일 재인덱싱 오류 (${filePath}):`, error);
      throw error;
    }
  }

  /**
   * 모든 인덱스 삭제
   */
  async clearIndex(): Promise<void> {
    await inMemoryVectorStore.clear();
    this.status = {
      isIndexing: false,
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      errors: [],
    };
  }
}

export const indexingService = new IndexingService();
