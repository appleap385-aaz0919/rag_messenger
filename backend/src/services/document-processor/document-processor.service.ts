import fs from 'fs/promises';
import path from 'path';
import { ParserFactory } from './parser.factory';
import { chunkingService } from './chunking.service';
import { embeddingsService } from '../embeddings/embeddings.service';
import config from '../../config/app.config';
import type { FileInfo, DocumentChunk } from '../../types';
import { glob } from 'glob';

/**
 * 문서 처리 서비스
 * 파일 검색, 파싱, 청킹, 임베딩 처리
 */
export class DocumentProcessor {
  /**
   * 모든 폴더에서 지원되는 파일 검색
   */
  async getAllFiles(): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = [];

    for (const folder of config.folders) {
      try {
        const files = await this.getFilesInFolder(folder);
        allFiles.push(...files);
      } catch (error) {
        console.error(`폴더 스캔 오류 (${folder}):`, error);
      }
    }

    return allFiles;
  }

  /**
   * 특정 폴더에서 파일 검색
   */
  async getFilesInFolder(folderPath: string): Promise<FileInfo[]> {
    const pattern = path.join(folderPath, '**/*').replace(/\\/g, '/');
    const filePaths = await glob(pattern, { nodir: true });

    const files: FileInfo[] = [];

    for (const filePath of filePaths) {
      if (ParserFactory.isSupported(filePath)) {
        try {
          const stats = await fs.stat(filePath);
          files.push({
            path: filePath,
            name: path.basename(filePath),
            size: stats.size,
            modifiedTime: stats.mtime,
            type: path.extname(filePath),
          });
        } catch (error) {
          console.error(`파일 정보 가져오기 오류 (${filePath}):`, error);
        }
      }
    }

    return files;
  }

  /**
   * 단일 파일 처리
   */
  async processFile(filePath: string): Promise<DocumentChunk[]> {
    // 파일 파싱
    const parser = ParserFactory.getParser(filePath);
    const text = await parser.parse(filePath);

    if (!text || text.trim().length === 0) {
      return [];
    }

    // 청킹
    const chunks = chunkingService.chunkText(text, {
      filePath,
      fileName: path.basename(filePath),
      chunkIndex: 0,
      fileType: path.extname(filePath),
    });

    // 임베딩
    for (const chunk of chunks) {
      const result = await embeddingsService.embedText(chunk.content);
      chunk.embedding = result.embedding;
    }

    return chunks;
  }

  /**
   * 여러 파일 배치 처리
   */
  async processFiles(filePaths: string[]): Promise<DocumentChunk[]> {
    const allChunks: DocumentChunk[] = [];

    for (const filePath of filePaths) {
      try {
        const chunks = await this.processFile(filePath);
        allChunks.push(...chunks);
      } catch (error) {
        console.error(`파일 처리 오류 (${filePath}):`, error);
      }
    }

    return allChunks;
  }

  /**
   * 파일이 지원되는 형식인지 확인
   */
  isSupported(filePath: string): boolean {
    return ParserFactory.isSupported(filePath);
  }
}

export const documentProcessor = new DocumentProcessor();
