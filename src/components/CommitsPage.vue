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
            color="primary"
            outline
            no-caps
            label="Open repository"
            @click="openRepository"
          />
        </template>
      </q-table>
    </div>
    <div class="col-grow">
      <q-card>
        <div class="column">
          <div class="col">
            <q-input v-model="commitMessage" label="Commit Message" />
            <q-btn
              color="primary"
              outline
              no-caps
              :disable="!canCommit"
              label="Commit"
              @click="commit"
            />
          </div>
          <div class="col-8">
            <q-input
              v-model="currentDiff"
              type="textarea"
              readonly
              label="Current diff"
            />
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
import { IGitApi } from 'src/models/iGitApi';
import { IFileWatcherApi } from 'src/models/iFileWatcherApi';
import { defineComponent } from 'vue';

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
      commitMessage: '',
      currentDiff: '',
      hasStagedFiles: false,
      commits: [],
      columns: [
        { name: 'message', label: 'Message', field: 'message', align: 'left' },
        { name: 'date', label: 'Commit date hellow', field: 'date' },
        { name: 'hash', label: 'Commit hash', field: 'hash' },
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
  methods: {
    async setCurrentDiff() {
      this.currentDiff = await window.gitAPI.showDiff(this.folderName);
    },
    async openRepository(): Promise<void> {
      this.commits = await window.gitAPI.fetchCommits(this.folderName);
      await this.setCurrentDiff();
      window.fileWatcherAPI.createWatcher(
        this.folderName,
        async () => await this.setCurrentDiff()
      );
    },
    async commit(): Promise<void> {
      if (!this.canCommit) return;
      await window.gitAPI.commit(this.folderName, this.commitMessage);
      this.commits = await window.gitAPI.fetchCommits(this.folderName);
      this.commitMessage = '';
    },
    async stageAllFiles(): Promise<void> {
      await window.gitAPI.stageAllFiles(this.folderName);
      await this.setCurrentDiff();
      this.hasStagedFiles = true;
    },
  },
  computed: {
    canCommit(): boolean {
      return this.commitMessage !== '' && this.currentDiff !== '';
    },
  },
});
</script>
