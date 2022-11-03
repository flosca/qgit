 import { contextBridge } from 'electron'
 import simpleGit, { CleanOptions } from 'simple-git';

 contextBridge.exposeInMainWorld('gitAPI', {
    fetchCommits: async (folderName) => {
      const options = {
          baseDir: folderName,
          binary: 'git',
          maxConcurrentProcesses: 6,
         };  
         const git = simpleGit(options).clean(CleanOptions.FORCE);
         const log = await git.log()         
         return log.all;
    },

    showDiff: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options).clean(CleanOptions.FORCE);
       return await git.diff()         
    },

    stageAllFiles: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options).clean(CleanOptions.FORCE);
       return await git.add('.') 
    },

    commit: async (folderName, message) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options).clean(CleanOptions.FORCE);
       await git.commit(message, {
        '--all': null
      });
    },
  })

contextBridge.exposeInMainWorld('fileWatcherAPI', {
    createWatcher: async (folderName, action) => {
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(folderName)
      watcher.unwatch('/node_modules/') // todo extend

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      watcher.on('change', (path, stats) => {
        console.log(path, stats)
        action()
      })
    }
  })  
