import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import config from '../../config/app.config';

export class ChunkingService {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(
    chunkSize: number = config.chunking?.chunkSize || 1500,
    chunkOverlap: number = config.chunking?.chunkOverlap || 300
  ) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', '。', '. ', ' ', ''],
    });
  }

  async splitText(text: string): Promise<string[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }
    return await this.splitter.splitText(text);
  }

  async createChunks(text: string, metadata: Record<string, any>): Promise<any[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }
    const documents = await this.splitter.createDocuments([text], [metadata]);
    return documents.map(doc => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata
    }));
  }
}

export const chunkingService = new ChunkingService();
