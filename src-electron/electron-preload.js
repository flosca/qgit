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
    }
  })
