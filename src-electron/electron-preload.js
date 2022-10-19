/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */
 import { contextBridge } from 'electron'
 import simpleGit, { CleanOptions } from 'simple-git';

 contextBridge.exposeInMainWorld('gitAPI', {
    seeLog: async () => {
        const options = {
            baseDir: 'c:/work/soma-chrome',
            binary: 'git',
            maxConcurrentProcesses: 6,
           };  
           const git = simpleGit(options).clean(CleanOptions.FORCE);
         
           const log = await git.log()
         
           console.warn(log)
         
           return log.all;

    },
    fetchCommits: async (folderName) => {
        const options = {
            baseDir: folderName,
            binary: 'git',
            maxConcurrentProcesses: 6,
           };  
           const git = simpleGit(options).clean(CleanOptions.FORCE);
           const log = await git.log()         
           return log.all;
    }
  })
