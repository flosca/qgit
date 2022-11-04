<template>
  <div class="full-width row">
    <div class="col-grow">
      <q-table
        :title="folderName"
        :rows="commits"
        :dense="$q.screen.md"
        :columns="columns"
        row-key="hash"
        virtual-scroll
        :virtual-scroll-sticky-size-start="48"
        v-model:pagination="pagination"
        :rows-per-page-options="[0]"
        hide-header
        flat
        elevation="0"
      >
        <template v-slot:top-left>
          <div class="row">
            <q-input
              borderless
              dense
              v-model="folderName"
              placeholder="Type repository path..."
            />
            <q-btn
              v-if="this.currentFolderName !== this.folderName"
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
        </template>
      </q-table>
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
            <q-scroll-area style="height: 400px; min-width: 300px">
              <div v-for="line in currentDiffLines" :key="line.id">
                <div :style="line.style">{{ line.value }}</div>
              </div>
            </q-scroll-area>
            <q-btn
              v-if="currentDiff !== ''"
              color="grey"
              outline
              no-caps
              label="Stage all files"
              @click="stageAllFiles"
            />
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts">
import { DefaultLogFields, ListLogLine } from 'simple-git';
import { formatDistance, parseISO } from 'date-fns';
import { IGitApi } from 'src/models/api/iGitApi';
import { IFileWatcherApi } from 'src/models/api/iFileWatcherApi';
import { defineComponent } from 'vue';
import { useRepositoryPathStore } from 'src/stores/repository-store';
import { mapWritableState } from 'pinia';
import { TableColumn } from 'src/models/tableColumn';
import { DiffLine } from 'src/models/diffLine';

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
    commits: (DefaultLogFields & ListLogLine)[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      columns: [
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
          style: 'max-width: 80px',
          headerStyle: 'max-width: 80px',
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
    formatDiffLine(id: number, value: string): DiffLine {
      return {
        id,
        value,
        style: value.startsWith('+')
          ? 'color:green'
          : value.startsWith('-')
          ? 'color:red'
          : value.startsWith('@@')
          ? 'color: blue'
          : value.startsWith('diff --git')
          ? 'color:gray'
          : '',
      };
    },
    formatCommitDate(date: string): string {
      return formatDistance(parseISO(date), new Date(), { addSuffix: true });
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

      this.commits = await window.gitAPI.fetchCommits(this.currentFolderName);
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
      this.commits = await window.gitAPI.fetchCommits(this.folderName);
      this.commitMessage = '';
    },
    async stageAllFiles(): Promise<void> {
      await window.gitAPI.stageAllFiles(this.currentFolderName);
      await this.setCurrentDiff();
      this.hasStagedFiles = true;
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
