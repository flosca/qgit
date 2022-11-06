 import { contextBridge } from 'electron'
 import simpleGit from 'simple-git';

 contextBridge.exposeInMainWorld('gitAPI', {
    loadCommitHistory: async (folderName) => {
      const options = {
          baseDir: folderName,
          binary: 'git',
          maxConcurrentProcesses: 6,
         };  
         const git = simpleGit(options);
         const log = await git.log({'--all': null});
         return log.all;
    },
    fetch: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       await git.fetch();
    },
    checkoutCommit: async (folderName, hash) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       await git.checkout(hash);
    },
    checkoutBranch: async (folderName, branchName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       await git.checkout(branchName);
    },        
    showDiff: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       return await git.diff()         
    },
    showCommitInfoLines: async (folderName, commitHash) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       const commitInfo = await git.show(commitHash);
       return commitInfo.split('\n')
    },
    getCurrentDiffLines: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       const diff = await git.diff();
       return diff.split('\n').filter((line) => line !== '')
    },
    getCommitInfoLines: async (folderName, hash) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       const diff = await git.show(hash);
       return diff.split('\n').filter((line) => line !== '')
    },   
    stageAllFiles: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       return await git.add('.') 
    },

    resetAllFiles: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       return await git.reset(['--hard']) 
    },    

    commit: async (folderName, message) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
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
       const git = simpleGit(options);
       return await git.raw(['rev-parse', '--abbrev-ref', 'HEAD'])
    },

    listAllBranches: async (folderName) => {
      const options = {
        baseDir: folderName,
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       const branchNamesByNewLine = await git.raw(['for-each-ref', '--format=\'%(refname:short)\'', 'refs/heads/'])
       return branchNamesByNewLine.split('\n');
    },

    getGitUsername: async () => {
      const options = {
        baseDir: '',
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       const config = await git.getConfig('user.name', 'global')
       console.log('kek', config)
       return config.value;
    },
    setGitUsername: async (userName) => {
      const options = {
        baseDir: '',
        binary: 'git',
        maxConcurrentProcesses: 6,
       };  
       const git = simpleGit(options);
       return await git.addConfig('user.name', userName, undefined, 'global', undefined)
    }
  })

contextBridge.exposeInMainWorld('fileWatcherAPI', {
    createWatcher: async (folderName, action) => {
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(folderName, {
        ignoreInitial: true,
        ignored: ['/node_modules/'], // todo extend with .gitignore
        persistent: true
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      watcher.on('change', async (path) => {
        await action();
      })

      return watcher
    }
  })  
