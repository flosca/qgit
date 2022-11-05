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
          Current branch is: {{ currentBranchName }}</span
        >
        <!-- <q-select dense outlined :options="allBranches" label="Outlined" /> -->
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
          elevation="0"
        >
          <template v-slot:body-cell-refs="props">
            <q-td :props="props">
              <div v-if="!!props.value">
                <q-chip color="green" size="xs" :label="props.value">
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
        <div class="column">
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
            <q-scroll-area style="height: 60vh; width: 40vw">
              <div v-for="line in currentDiffLines" :key="line.id">
                <div :style="line.style">{{ line.value }}</div>
              </div>
            </q-scroll-area>
            <q-btn
              v-if="currentDiff !== ''"
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
  name: 'CommitsPage',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(): {
    folderName: string;
    currentFolderName: string;
    commitMessage: string;
    currentDiff: string;
    currentDiffLines: DiffLine[];
    hasStagedFiles: boolean;
    currentBranchName: string;
    allBranches: string[];
    commits: CommitRow[];
    commitsHistoryLoading: boolean;
    columns: TableColumn[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagination: any;
  } {
    return {
      folderName: '',
      currentFolderName: '',
      commitMessage: '',
      currentDiff: '',
      currentDiffLines: [],
      hasStagedFiles: false,
      currentBranchName: '',
      allBranches: [],
      commits: [],
      commitsHistoryLoading: false,
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
      return formatDistance(parseISO(date), new Date(), { addSuffix: true });
    },
    async fetch() {
      if (!this.currentFolderName) return;
      await window.gitAPI.fetch(this.currentFolderName);
      await this.updateCommitsHistory();
    },
    async updateCommitsHistory(): Promise<boolean> {
      this.commitsHistoryLoading = true;
      try {
        this.commits = await window.gitAPI.loadCommitHistory(
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
      const diff = await window.gitAPI.showDiff(this.currentFolderName);
      this.currentDiff = diff.replace(/(?:\r\n|\r|\n)/g, '<br/>');

      const diffLines = await window.gitAPI.getCurrentDiffLines(
        this.currentFolderName
      );
      this.currentDiffLines =
        diffLines?.map((line, i) => this.formatDiffLine(i, line)) ?? [];
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

      this.currentBranchName = await window.gitAPI.showCurrentBranchName(
        this.currentFolderName
      );
      this.allBranches = await window.gitAPI.listAllBranches(
        this.currentFolderName
      );
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
  },
  computed: {
    canCommit(): boolean {
      return this.commitMessage !== '' && this.currentDiff !== '';
    },
    ...mapWritableState(useRepositoryPathStore, ['path']),
  },
});
</script>