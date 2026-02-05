import type { FSWatcher } from 'chokidar';
import chokidar from 'chokidar';
import fs from 'fs';
import config from '../../config/app.config';
import { indexingService } from '../indexing/indexing.service';
import { wsManager } from '../../utils/ws-manager';
import { documentProcessor } from '../document-processor/document-processor.service';
import { inMemoryVectorStore } from '../vectorstore/in-memory-store';

/**
 * 파일 Watcher 서비스
 * 파일 변경 감지 및 자동 재인덱싱
 */
export class WatcherService {
  private watcher: FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Watcher 시작
   */
  async start(): Promise<void> {
    if (!config.fileWatcher.enabled) {
      console.log('파일 Watcher가 비활성화되어 있습니다.');
      return;
    }

    if (this.watcher) {
      console.log('파일 Watcher가 이미 실행 중입니다.');
      return;
    }

    const watchPaths = config.folders.filter((folder) => {
      // 폴더 존재 여부 확인
      try {
        fs.existsSync(folder);
        return true;
      } catch {
        return false;
      }
    });

    if (watchPaths.length === 0) {
      console.log('감시할 폴더가 없습니다.');
      return;
    }

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\\/])\../, // 숨김 파일 무시
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath: string) => this.handleFileAdd(filePath))
      .on('change', (filePath: string) => this.handleFileChange(filePath))
      .on('unlink', (filePath: string) => this.handleFileDelete(filePath));

    console.log(`파일 Watcher가 시작되었습니다. 감시 중인 폴더: ${watchPaths.join(', ')}`);
  }

  /**
   * Watcher 중지
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('파일 Watcher가 중지되었습니다.');
    }
  }

  /**
   * 파일 추가 처리
   */
  private handleFileAdd(filePath: string): void {
    console.log(`파일 추가 감지: ${filePath}`);

    if (!documentProcessor.isSupported(filePath)) {
      return;
    }

    this.debounceAction(filePath, 'add', async () => {
      try {
        await indexingService.reindexFile(filePath);
        wsManager.broadcastFileChanged(filePath, 'added');
      } catch (error) {
        console.error(`파일 추가 처리 오류 (${filePath}):`, error);
      }
    });
  }

  /**
   * 파일 변경 처리
   */
  private handleFileChange(filePath: string): void {
    console.log(`파일 변경 감지: ${filePath}`);

    if (!documentProcessor.isSupported(filePath)) {
      return;
    }

    this.debounceAction(filePath, 'change', async () => {
      try {
        await indexingService.reindexFile(filePath);
        wsManager.broadcastFileChanged(filePath, 'modified');
      } catch (error) {
        console.error(`파일 변경 처리 오류 (${filePath}):`, error);
      }
    });
  }

  /**
   * 파일 삭제 처리
   */
  private handleFileDelete(filePath: string): void {
    console.log(`파일 삭제 감지: ${filePath}`);

    if (!documentProcessor.isSupported(filePath)) {
      return;
    }

    // ChromaDB에서 문서 삭제
    inMemoryVectorStore.deleteByFilePath(filePath).catch(console.error);

    wsManager.broadcastFileChanged(filePath, 'deleted');
  }

  /**
   * 디바운스 처리
   */
  private debounceAction(
    filePath: string,
    action: string,
    callback: () => Promise<void>,
  ): void {
    const key = `${action}:${filePath}`;

    // 기존 타이머 취소
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 새 타이머 설정
    const timer = setTimeout(async () => {
      try {
        await callback();
      } finally {
        this.debounceTimers.delete(key);
      }
    }, config.fileWatcher.debounceDelay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Watcher 상태 확인
   */
  isRunning(): boolean {
    return this.watcher !== null;
  }
}

export const watcherService = new WatcherService();
