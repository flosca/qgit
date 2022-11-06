import { CommitRow } from '../commitRow'

export interface IGitApi {
  loadCommitHistory(folderName: string): Promise<CommitRow[]>
  fetch(folderName: string): Promise<void>
  checkoutCommit(folderName: string, hash: string): Promise<void>
  checkoutBranch(folderName: string, branchName: string): Promise<void>
  showDiff(folderName: string): Promise<string>
  getCurrentDiffLines(folderName: string): Promise<string[]>
  stageAllFiles(folderName: string): Promise<string>
  resetAllFiles(folderName: string): Promise<void>
  commit(folderName: string, message: string): Promise<void>
  showCurrentBranchName(folderName: string): Promise<string>
  listAllBranches(folderName: string): Promise<string[]>
}
