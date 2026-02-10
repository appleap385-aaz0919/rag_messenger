import chokidar from 'chokidar';
import { indexingService } from '../indexing/indexing.service';

export class WatcherService {
  private watcher: any = null;
  private watchedPaths: string[] = [];

  constructor() {
    try {
      this.watcher = chokidar.watch([], {
        persistent: true,
        ignoreInitial: true,
        ignored: [/(^|[\/\\])\.\./, '**/node_modules/**'],
      });

      this.setupListeners();
    } catch (e) {
      console.warn('[Watcher] Failed to initialize chokidar:', e);
    }
  }

  private setupListeners() {
    if (!this.watcher) return;

    this.watcher
      .on('add', (filePath: string) => {
        console.log(`File added: ${filePath}`);
        indexingService.indexFile(filePath);
      })
      .on('change', (filePath: string) => {
        console.log(`File changed: ${filePath}`);
        // reindex = delete old + add new
        indexingService.indexFile(filePath);
      })
      .on('unlink', (_filePath: string) => {
        console.log(`File removed: ${_filePath}`);
        // Removal from vectorstore is handled at next reindex
      })
      .on('error', (error: Error) => {
        console.error(`Watcher error: ${error}`);
      });
  }

  addFolder(folderPath: string) {
    if (!this.watchedPaths.includes(folderPath)) {
      this.watcher?.add(folderPath);
      this.watchedPaths.push(folderPath);
      console.log(`Started watching: ${folderPath}`);
    }
  }

  removeFolder(folderPath: string) {
    if (this.watchedPaths.includes(folderPath)) {
      this.watcher?.unwatch(folderPath);
      this.watchedPaths = this.watchedPaths.filter(p => p !== folderPath);
      console.log(`Stopped watching: ${folderPath}`);
    }
  }

  getWatchedPaths() {
    return this.watchedPaths;
  }
}

export const watcherService = new WatcherService();
