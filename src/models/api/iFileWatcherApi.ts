import { FSWatcher } from 'chokidar';

export interface IFileWatcherApi {
  createWatcher(folderName: string, action: () => Promise<void>): FSWatcher
}