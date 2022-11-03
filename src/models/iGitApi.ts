import type { DefaultLogFields, ListLogLine } from 'simple-git'

export type CommitHistoryRow = DefaultLogFields & ListLogLine

export interface IGitApi {
  fetchCommits(folderName: string): Promise<CommitHistoryRow[]>
  showDiff(folderName: string): Promise<string>
}
