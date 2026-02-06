import path from 'path';
import fs from 'fs/promises';
import config from '../../config/app.config';
import { ParserFactory } from '../document-processor/parser.factory';
import { chunkingService } from '../document-processor/chunking.service';
// import { chromaService } from '../vectorstore/chroma.service';
// import { hnswService } from '../vectorstore/hnsw.service';
import { inMemoryVectorStore } from '../vectorstore/in-memory-store';

export class IndexingService {
  private status: 'idle' | 'indexing' | 'error' = 'idle';
  private progress = { current: 0, total: 0 };
  private stopRequested = false;
  private isPaused = false;
  private readonly IGNORED_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', 'out', 'target', 'vendor', '.venv', 'env', '.gemini', 'brain', 'data'];

  pauseIndexing() {
    this.isPaused = true;
    console.log('[Indexing] Paused for higher priority task (Chat)');
  }

  resumeIndexing() {
    this.isPaused = false;
    console.log('[Indexing] Resumed');
  }

  stopIndexing() {
    if (this.status === 'indexing') {
      this.stopRequested = true;
      console.log('[Indexing] Stop requested by user.');
    }
  }

  getStatus() {
    return {
      status: this.status,
      progress: this.progress
    };
  }

  async indexFile(filePath: string, shouldSave = true) {
    try {
      console.log(`[Indexing] Processing file: ${filePath}`);

      // Aggressive pause check function
      const checkPause = async () => {
        while (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (this.stopRequested) break;
        }
      };

      // 1. Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        console.warn(`[Indexing] File not found or inaccessible: ${filePath}`);
        return;
      }

      // 2. Parse
      const parser = ParserFactory.getParser(filePath);
      const text = await parser.parse(filePath);

      if (!text || text.trim().length === 0) {
        console.warn(`[Indexing] Empty content for file: ${filePath}`);
        return;
      }

      // 3. Chunk
      const chunks = await chunkingService.createChunks(text, {
        filePath,
        fileName: path.basename(filePath),
        indexedAt: new Date().toISOString(),
      });

      if (chunks.length === 0) {
        console.warn(`[Indexing] No chunks created for file: ${filePath}`);
        return;
      }

      // 4. Store (with aggressive pause checking during embeddings)
      await inMemoryVectorStore.addDocuments(chunks, shouldSave, checkPause);
      console.log(`[Indexing] Successfully indexed: ${path.basename(filePath)} (${chunks.length} chunks)`);
    } catch (error) {
      console.error(`[Indexing] Failed to index file ${filePath}:`, error);
    }
  }

  async indexFolders(folders: string[]) {
    if (this.status === 'indexing') {
      console.warn('[Indexing] Indexing already in progress. Skipping.');
      return;
    }

    console.log(`[Indexing] Starting index for ${folders.length} folders...`);
    this.status = 'indexing';
    this.progress = { current: 0, total: 0 };
    this.stopRequested = false;

    try {
      // 1. Collect all files first
      const allFiles: string[] = [];
      const supportedExts = config.supportedFormats;

      for (const folder of folders) {
        try {
          await fs.access(folder);
          const files = await this.getAllFiles(folder);
          const supportedFiles = files.filter(file =>
            supportedExts.includes(path.extname(file).toLowerCase())
          );
          allFiles.push(...supportedFiles);
        } catch {
          console.warn(`[Indexing] Skipping inexistent or inaccessible folder: ${folder}`);
        }
      }

      this.progress.total = allFiles.length;
      console.log(`[Indexing] Found ${allFiles.length} supported files to index`);

      // ⚠️ Keep existing data to stay responsive. 
      // If user wants fresh start, they should use /clear or clear button.

      // 3. Index each file
      for (const file of allFiles) {
        if (this.stopRequested) {
          console.log('[Indexing] Indexing aborted by user.');
          break;
        }

        // If paused (due to chat), wait longer
        while (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2s
          if (this.stopRequested) break;
        }

        if (this.stopRequested) break;

        await this.indexFile(file, false);
        this.progress.current++;

        // Yield to event loop. Larger gap to let Ollama breathe.
        // Use setImmediate multiple times to ensure other tasks get a turn
        await new Promise(resolve => setImmediate(resolve));
        await new Promise(resolve => setImmediate(resolve));

        const yieldTime = allFiles.length > 500 ? 500 : 200;
        await new Promise(resolve => setTimeout(resolve, yieldTime));
      }

      // 4. Final save
      await inMemoryVectorStore.save(true);
      this.status = 'idle';
      this.stopRequested = false;
      console.log('[Indexing] Indexing completed.');
    } catch (error) {
      this.status = 'error';
      this.stopRequested = false;
      console.error(`[Indexing] Failed during folder indexing:`, error);
    }
  }

  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const MAX_FILES_PER_SCAN = 1000; // Prevent runaway indexing

    const scan = async (currentPath: string) => {
      if (files.length >= MAX_FILES_PER_SCAN) return;

      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          if (files.length >= MAX_FILES_PER_SCAN) break;

          // Skip hidden and heavy directories/files
          if (entry.name.startsWith('.') ||
            this.IGNORED_DIRS.includes(entry.name) ||
            entry.name.endsWith('.md') && ['implementation_plan', 'walkthrough', 'task', 'compact_knowledge'].some(p => entry.name.includes(p))) {
            continue;
          }

          const fullPath = path.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            await scan(fullPath);
            // Yield every directory to keep event loop alive
            await new Promise(resolve => setImmediate(resolve));
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (err) {
        console.warn(`[Indexing] Failed to read ${currentPath}:`, err);
      }
    };

    await scan(dirPath);
    return files;
  }
}

export const indexingService = new IndexingService();
