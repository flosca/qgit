<template>
  <div class="full-width row">
    <div class="col-grow">
      <div class="row">
        <q-input
          outlined
          dense
          v-model="folderName"
          placeholder="Type repository path..."
        />
        <q-btn
          v-if="!!this.folderName && this.currentFolderName !== this.folderName"
          color="primary"
          outline
          no-caps
          label="Open repository"
          @click="openRepository"
        />
      </div>
      <div class="row">
        <span v-if="currentFolderName !== ''">
          You are on: {{ currentBranchName }}</span
        >
      </div>
      <div
        class="q-pa-xs q-gutter-sm"
        v-if="currentFolderName !== '' && currentFolderName === folderName"
      >
        <q-btn flat color="primary" no-caps label="Fetch" @click="fetch" />
        <q-btn flat color="primary" no-caps label="Change branch" disable />
        <q-btn flat color="primary" no-caps label="Manage stash" disable />
      </div>
      <q-scroll-area style="height: 70vh; width: 55vw">
        <q-table
          :rows="commits"
          :dense="$q.screen.md"
          :columns="columns"
          :loading="commitsHistoryLoading"
          row-key="hash"
          v-model:pagination="pagination"
          :rows-per-page-options="[0]"
          flat
          @row-click="onRowClick"
          elevation="0"
        >
          <template v-slot:body-cell="props">
            <q-td :props="props">
              {{ props.value }}
            </q-td>
            <q-menu touch-position context-menu>
              <q-list dense style="min-width: 100px">
                <q-item v-if="props.row.refs !== ''" clickable>
                  <q-item-section>Checkout to branch...</q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>
                  <q-menu anchor="top end" self="top start">
                    <q-list>
                      <q-item
                        v-for="name in parseBranchNames(props.row.refs)"
                        :key="name"
                        dense
                        clickable
                        v-close-popup
                        @click="checkoutBranch(name)"
                      >
                        <q-item-section>{{ name }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-item>
                <q-item
                  v-if="props.row.hash !== ''"
                  clickable
                  v-close-popup
                  @click="checkoutCommit(props.row.hash)"
                >
                  <q-item-section>Checkout to this commit</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </template>
          <template v-slot:body-cell-refs="props">
            <q-td :props="props">
              <div v-if="!!props.value">
                <q-chip color="green" size="sm" :label="props.value">
                  <q-tooltip :offset="[10, 10]">
                    {{ props.value }}
                  </q-tooltip>
                </q-chip>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-message="props">
            <q-td :props="props">
              <div v-if="!!props.value">
                {{ props.value }}
                <q-tooltip :offset="[10, 10]">
                  {{ props.value }}
                </q-tooltip>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-scroll-area>
    </div>
    <div class="col-grow">
      <q-card flat>
        <div v-if="showCommitSummary" class="column">
          <div class="col-8">
            <q-scroll-area style="height: 60vh; width: 40vw">
              <div v-for="line in currentCommitSummaryLines" :key="line.id">
                <div :style="line.style">{{ line.value }}</div>
              </div>
            </q-scroll-area>
          </div>
        </div>
        <div v-else class="column">
          <div class="col">
            <q-input v-model="commitMessage" label="Commit Message" />
            <q-btn
              v-if="canCommit"
              color="primary"
              outline
              no-caps
              label="Commit"
              @click="commit"
            />
          </div>
          <div class="col-8">
            <q-scroll-area style="height: 65vh; width: 40vw">
              <div v-for="line in currentDiffLines" :key="line.id">
                <div :style="line.style">{{ line.value }}</div>
              </div>
            </q-scroll-area>
            <q-btn
              v-if="currentDiffLines && currentDiffLines.length > 0"
              color="grey"
              outline
              no-caps
              label="Reset all files"
              @click="resetAllFiles"
            />
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts">
import { formatDistance, parseISO } from 'date-fns';
import { IGitApi } from 'src/models/api/iGitApi';
import { IFileWatcherApi } from 'src/models/api/iFileWatcherApi';
import { defineComponent } from 'vue';
import { useRepositoryPathStore } from 'src/stores/repository-store';
import { mapWritableState } from 'pinia';
import { TableColumn } from 'src/models/tableColumn';
import { DiffLine } from 'src/models/diffLine';
import { CommitRow } from 'src/models/commitRow';
import { Notify } from 'quasar';

declare global {
  interface Window {
    gitAPI: IGitApi;
    fileWatcherAPI: IFileWatcherApi;
  }
}

export default defineComponent({
  name: 'RepositoryTab',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  data(): {
    folderName: string;
    currentFolderName: string;
    commitMessage: string;
    currentDiffLines: DiffLine[];
    currentCommitSummaryLines: DiffLine[];
    currentBranchName: string;
    allBranches: string[];
    commits: CommitRow[];
    commitsHistoryLoading: boolean;
    showCommitSummary: boolean;
    columns: TableColumn[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagination: any;
  } {
    return {
      folderName: '',
      currentFolderName: '',
      commitMessage: '',
      currentDiffLines: [],
      currentCommitSummaryLines: [],
      currentBranchName: '',
      allBranches: [],
      commits: [],
      commitsHistoryLoading: false,
      showCommitSummary: false,
      columns: [
        {
          name: 'refs',
          label: '',
          field: 'refs',
          style: 'max-width: 50px',
          headerStyle: 'max-width: 50px',
          classes: 'bg-grey-2',
        },
        {
          name: 'message',
          label: 'Message',
          field: 'message',
          align: 'left',
          style: 'max-width: 150px',
          headerStyle: 'max-width: 150px',
          classes: 'bg-grey-2 ellipsis',
        },
        {
          name: 'date',
          label: 'Commit date',
          field: 'date',
          style: 'max-width: 100px',
          headerStyle: 'max-width: 100px',
          format: (val: string) => {
            return this.formatCommitDate(val);
          },
        },
        {
          name: 'hash',
          label: 'Commit hash',
          field: 'hash',
          style: 'max-width: 50px',
          headerStyle: 'max-width: 50px',
          format: (val: string) => val.substring(0, 7),
        },
        {
          name: 'author_name',
          label: 'Author',
          field: 'author_name',
          style: 'max-width: 100px',
          headerStyle: 'max-width: 100px',
        },
      ],
      pagination: {
        rowsPerPage: 0,
      },
    };
  },
  mounted: async function () {
    this.currentFolderName = this.path ?? '';
    console.log(this.currentFolderName);
    if (this.currentFolderName !== '') await this.openRepository();
  },
  methods: {
    getDiffLineStyle(line: string): string {
      const lineColours = new Map<string, string>([
        ['+', 'green'],
        ['-', 'red'],
        ['@@', 'blue'],
        ['diff --git', 'gray'],
      ]);

      for (const key of lineColours.keys()) {
        if (line.startsWith(key)) return `color:${lineColours.get(key)}`;
      }

      return '';
    },
    formatDiffLine(id: number, value: string): DiffLine {
      return {
        id,
        value,
        style: this.getDiffLineStyle(value),
      };
    },
    formatCommitDate(date: string): string {
      return date == ''
        ? ''
        : formatDistance(parseISO(date), new Date(), { addSuffix: true });
    },
    async fetch() {
      if (!this.currentFolderName) return;
      await window.gitAPI.fetch(this.currentFolderName);
      await this.updateCommitsHistory();
    },
    async checkoutCommit(commitHash: string) {
      await window.gitAPI.checkoutCommit(this.currentFolderName, commitHash);
      this.updateCommitsHistory();
    },
    async checkoutBranch(branchName: string) {
      await window.gitAPI.checkoutBranch(this.currentFolderName, branchName);
      this.updateCommitsHistory();
    },
    async updateCommitsHistory(): Promise<boolean> {
      this.commitsHistoryLoading = true;
      try {
        const commitChangesHeader = {
          hash: '',
          message: 'Commit Changes',
          date: '',
          refs: '',
          body: '',
          author_name: '',
          author_email: '',
        } as CommitRow;
        const commitHistory = await window.gitAPI.loadCommitHistory(
          this.currentFolderName
        );
        this.commits = [commitChangesHeader].concat(commitHistory);
        this.currentBranchName = await window.gitAPI.showCurrentBranchName(
          this.currentFolderName
        );
        this.allBranches = await window.gitAPI.listAllBranches(
          this.currentFolderName
        );
      } catch (err) {
        Notify.create('There is no repository with such path');
        this.commitsHistoryLoading = false;
        return false;
      }

      this.commitsHistoryLoading = false;
      return true;
    },
    async setCurrentDiff() {
      const diffLines = await window.gitAPI.getCurrentDiffLines(
        this.currentFolderName
      );
      this.currentDiffLines =
        diffLines?.map((line, i) => this.formatDiffLine(i, line)) ?? [];
      this.showCommitSummary = false;
    },
    async setCommitInfo(hash: string) {
      const diffLines = await window.gitAPI.getCommitInfoLines(
        this.currentFolderName,
        hash
      );
      this.currentCommitSummaryLines =
        diffLines?.map((line, i) => this.formatDiffLine(i, line)) ?? [];
      this.showCommitSummary = true;
    },
    async openRepository(): Promise<void> {
      if (this.currentFolderName === '' && this.folderName === '') return;
      if (
        this.currentFolderName === '' ||
        (!!this.folderName && this.currentFolderName !== this.folderName)
      )
        this.currentFolderName = this.folderName;

      if (this.currentFolderName === '') return;
      const store = useRepositoryPathStore();
      store.$patch({ path: this.currentFolderName });

      if (!(await this.updateCommitsHistory())) return;

      if (this.folderName === '' && this.currentFolderName !== '')
        this.folderName = this.currentFolderName;
      await this.setCurrentDiff();
      window.fileWatcherAPI.createWatcher(
        this.currentFolderName,
        async () => await this.setCurrentDiff()
      );
    },
    async commit(): Promise<void> {
      if (!this.canCommit) return;
      await window.gitAPI.commit(this.currentFolderName, this.commitMessage);
      await this.updateCommitsHistory();
      this.commitMessage = '';
    },
    async resetAllFiles(): Promise<void> {
      await window.gitAPI.resetAllFiles(this.currentFolderName);
      await this.setCurrentDiff();
    },
    parseBranchNames(refs: string): string[] {
      return refs.split(', ').map((branch) => branch.replace('HEAD -> ', ''));
    },
    async onRowClick(_event: unknown, row: CommitRow) {
      if (row.hash === '') {
        this.showCommitSummary = false;
        this.currentCommitSummaryLines = [];
        return;
      }
      await this.setCommitInfo(row.hash);
    },
  },
  computed: {
    canCommit(): boolean {
      return this.commitMessage !== '' && this.currentDiffLines !== [];
    },
    ...mapWritableState(useRepositoryPathStore, ['path']),
  },
});
</script>