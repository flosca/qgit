import type { DefaultLogFields, ListLogLine } from 'simple-git'

export type CommitHistoryRow = DefaultLogFields & ListLogLine

export interface IGitApi {
  fetchCommits(folderName: string): Promise<CommitHistoryRow[]>
  showDiff(folderName: string): Promise<string>
  getCurrentDiffLines(folderName: string): Promise<string[]>
  stageAllFiles(folderName: string): Promise<string>
  resetAllFiles(folderName: string): Promise<void>
  commit(folderName: string, message: string): Promise<void>
  showCurrentBranchName(folderName: string): Promise<string>
  listAllBranches(folderName: string): Promise<string[]>
}
