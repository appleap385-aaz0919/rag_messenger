import config from '../../config/app.config';
import type { DocumentChunk } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 문서 청킹 서비스
 * 긴 문서를 작은 청크로 분할
 */
export class ChunkingService {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor() {
    this.chunkSize = config.chunking.chunkSize;
    this.chunkOverlap = config.chunking.chunkOverlap;
  }

  /**
   * 텍스트를 청크로 분할
   */
  chunkText(text: string, metadata: DocumentChunk['metadata']): DocumentChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];
    const words = text.split(/\s+/);
    let currentChunk: string[] = [];
    let currentLength = 0;
    let chunkIndex = 0;

    for (const word of words) {
      const wordLength = word.length + 1; // 단어 + 공백

      if (currentLength + wordLength > this.chunkSize && currentChunk.length > 0) {
        // 현재 청크 저장
        chunks.push({
          id: uuidv4(),
          content: currentChunk.join(' '),
          metadata: {
            ...metadata,
            chunkIndex,
          },
        });

        // 오버랩을 위한 이전 청크의 일부 유지
        const overlapWords = this.getOverlapWords(currentChunk);
        currentChunk = overlapWords;
        currentLength = overlapWords.join(' ').length;
        chunkIndex++;
      }

      currentChunk.push(word);
      currentLength += wordLength;
    }

    // 마지막 청크 추가
    if (currentChunk.length > 0) {
      chunks.push({
        id: uuidv4(),
        content: currentChunk.join(' '),
        metadata: {
          ...metadata,
          chunkIndex,
        },
      });
    }

    return chunks;
  }

  /**
   * 오버랩할 단어 계산
   */
  private getOverlapWords(chunk: string[]): string[] {
    if (this.chunkOverlap === 0) {
      return [];
    }

    let overlapLength = 0;
    const overlapWords: string[] = [];

    for (let i = chunk.length - 1; i >= 0; i--) {
      const wordLength = chunk[i].length + 1;
      if (overlapLength + wordLength > this.chunkOverlap) {
        break;
      }
      overlapWords.unshift(chunk[i]);
      overlapLength += wordLength;
    }

    return overlapWords;
  }

  /**
   * 문단 단위로 청킹 (옵션)
   */
  chunkByParagraphs(text: string, metadata: DocumentChunk['metadata']): DocumentChunk[] {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: DocumentChunk[] = [];
    let currentContent = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      if (currentContent.length + trimmed.length > this.chunkSize && currentContent.length > 0) {
        chunks.push({
          id: uuidv4(),
          content: currentContent.trim(),
          metadata: { ...metadata, chunkIndex },
        });
        currentContent = trimmed;
        chunkIndex++;
      } else {
        currentContent += (currentContent ? '\n\n' : '') + trimmed;
      }
    }

    if (currentContent.trim()) {
      chunks.push({
        id: uuidv4(),
        content: currentContent.trim(),
        metadata: { ...metadata, chunkIndex },
      });
    }

    return chunks;
  }
}

export const chunkingService = new ChunkingService();
