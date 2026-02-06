import chokidar from 'chokidar';
import path from 'path';
import { indexingService } from '../indexing/indexing.service';

export class WatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  private watchedPaths: string[] = [];

  constructor() {
    this.watcher = chokidar.watch([], {
      persistent: true,
      ignoreInitial: true,
      ignored: [/(^|[\/\\])\../, '**/node_modules/**'], // hidden files and node_modules
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.watcher) return;

    this.watcher
      .on('add', (filePath) => {
        console.log(`File added: ${filePath}`);
        indexingService.indexFile(filePath);
      })
      .on('change', (filePath) => {
        console.log(`File changed: ${filePath}`);
        indexingService.reindexFile(filePath);
      })
      .on('unlink', (filePath) => {
        console.log(`File removed: ${filePath}`);
        indexingService.removeFile(filePath);
      })
      .on('error', (error) => {
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
