import { CommitRow } from '../commitRow'
import { GitResponse } from '../gitResponse'

export interface IGitApi {
  loadCommitHistory(folderName: string): Promise<CommitRow[]>
  fetch(folderName: string): Promise<GitResponse>
  checkoutCommit(folderName: string, hash: string): Promise<GitResponse>
  checkoutBranch(folderName: string, branchName: string): Promise<GitResponse>
  showDiff(folderName: string): Promise<string>
  getCurrentDiffLines(folderName: string): Promise<string[]>
  getCommitInfoLines(folderName: string, hash: string): Promise<string[]>
  stageAllFiles(folderName: string): Promise<string>
  resetAllFiles(folderName: string): Promise<GitResponse>
  commit(folderName: string, message: string): Promise<GitResponse>
  showCurrentBranchName(folderName: string): Promise<string>
  listAllBranches(folderName: string): Promise<string[]>
  getGitUsername(): Promise<string>
  setGitUsername(userName: string): Promise<void>
}
