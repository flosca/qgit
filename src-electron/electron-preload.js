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

    getCurrentDiffLines: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options).clean(CleanOptions.FORCE);
       const diff = await git.diff();
       return diff.split('\n')
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

    showCurrentBranchName: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options).clean(CleanOptions.FORCE);
       return await git.raw(['rev-parse', '--abbrev-ref', 'HEAD'])
    },

    listAllBranches: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options).clean(CleanOptions.FORCE);
       const branchNamesByNewLine = await git.raw(['for-each-ref', '--format=\'%(refname:short)\'', 'refs/heads/'])
       return branchNamesByNewLine.split('\n');
    }
  })

contextBridge.exposeInMainWorld('fileWatcherAPI', {
    createWatcher: async (folderName, action) => {
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(folderName, {
        ignoreInitial: true,
        ignored: ['/node_modules/']// todo extend with.gitignore
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      watcher.on('change', (path, stats) => {
        console.log(path, stats)
        action()
      })
    }
  })  
