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
        elevation="0"
      >
        <template v-slot:top-left>
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
        </template>
      </q-table>
    </div>
    <div class="col-grow" style="height: 100vh">
      <q-card>
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
            <q-scroll-area style="height: 200px; max-width: 300px">
              <div v-html="currentDiff" />
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
    hasStagedFiles: boolean;
    commits: (DefaultLogFields & ListLogLine)[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagination: any;
  } {
    return {
      folderName: '',
      currentFolderName: '',
      commitMessage: '',
      currentDiff: '',
      hasStagedFiles: false,
      commits: [],
      columns: [
        { name: 'message', label: 'Message', field: 'message', align: 'left' },
        {
          name: 'date',
          label: 'Commit date',
          field: 'date',
          format: (val: string) => this.formatCommitDate(val),
        },
        {
          name: 'hash',
          label: 'Commit hash',
          field: 'hash',
          format: (val: string) => val.substring(0, 7),
        },
        {
          name: 'author_name',
          label: 'Author',
          field: 'author_name',
        },
      ],
      pagination: {
        rowsPerPage: 0,
      },
    };
  },
  mounted: async function () {
    this.currentFolderName = this.path ?? '';
    if (this.currentFolderName !== '') await this.openRepository();
  },
  methods: {
    async setCurrentDiff() {
      const diff = await window.gitAPI.showDiff(this.currentFolderName);
      this.currentDiff = diff.replace(/(?:\r\n|\r|\n)/g, '<br/>');
    },
    async openRepository(): Promise<void> {
      this.currentFolderName = this.folderName;
      const store = useRepositoryPathStore();
      store.$patch({ path: this.currentFolderName });

      this.commits = await window.gitAPI.fetchCommits(this.currentFolderName);
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
    formatCommitDate(date: string): string {
      return formatDistance(parseISO(date), new Date(), { addSuffix: true });
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
