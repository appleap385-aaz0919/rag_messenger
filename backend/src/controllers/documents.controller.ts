import { Request, Response } from 'express';
import { watcherService } from '../services/file-watcher/watcher.service';
import { indexingService } from '../services/indexing/indexing.service';
import { inMemoryVectorStore } from '../services/vectorstore/in-memory-store';
import { embeddingsService } from '../services/embeddings/embeddings.factory';
import config from '../config/app.config';

// Supported file extensions
const SUPPORTED_EXTENSIONS = [
  '.txt', '.md', '.pdf', '.docx', '.doc',
  '.xlsx', '.xls', '.csv', '.pptx', '.ppt',
  '.json', '.xml'
];

export class DocumentsController {
  async getFiles(req: Request, res: Response) {
    try {
      const count = await inMemoryVectorStore.count();

      res.json({
        folders: config.folders,
        watchedPaths: watcherService.getWatchedPaths(),
        indexedDocuments: count,
        supportedExtensions: SUPPORTED_EXTENSIONS
      });
    } catch (error) {
      console.error('[Documents] Error fetching files:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async indexFiles(req: Request, res: Response) {
    try {
      const status = indexingService.getStatus();
      if (status.status === 'indexing') {
        return res.status(409).json({
          message: 'Indexing already in progress',
          progress: status.progress
        });
      }

      // Get folders from request body or config
      const folders: string[] = req.body.folders || config.folders || [];

      if (folders.length === 0) {
        return res.status(400).json({ error: 'No folders specified for indexing' });
      }

      // Respond immediately
      res.json({
        message: 'Indexing started',
        folders: folders
      });

      // Background indexing via service
      indexingService.indexFolders(folders).catch(err => {
        console.error('[Documents] Indexing failed:', err);
      });

    } catch (error) {
      res.status(500).json({ error: 'Failed to start indexing' });
    }
  }

  async getStatus(req: Request, res: Response) {
    const status = indexingService.getStatus();
    const count = await inMemoryVectorStore.count();

    res.json({
      status: status.status,
      progress: status.progress,
      indexedCount: count
    });
  }

  // Alias for route compatibility
  async startIndex(req: Request, res: Response) {
    return this.indexFiles(req, res);
  }

  async stopIndex(req: Request, res: Response) {
    indexingService.stopIndexing();
    res.json({ message: 'Indexing stop requested' });
  }

  async clearIndex(req: Request, res: Response) {
    try {
      await inMemoryVectorStore.clear();
      await inMemoryVectorStore.save();
      res.json({ message: 'Vector store cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear index' });
    }
  }

  async searchFiles(req: Request, res: Response) {
    try {
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
      }

      // Use embeddings to search
      const queryEmbedding = await embeddingsService.embedText(query);
      const results = await inMemoryVectorStore.search(queryEmbedding.embedding, 10);

      res.json({
        query,
        results: results.map(r => ({
          content: r.content.substring(0, 200) + '...',
          metadata: r.metadata,
          similarity: r.similarity
        }))
      });
    } catch (error) {
      console.error('[Documents] Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }
}

export const documentsController = new DocumentsController();
