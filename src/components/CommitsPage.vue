<template>
  <div class="q-pa-md">
    <q-table
      :title="folderName"
      :rows="commits"
      :dense="$q.screen.md"
      :columns="columns"
      row-key="hash"
      virtual-scroll
      v-model:pagination="pagination"
      :rows-per-page-options="[0]"
      hide-header
    >
      <template v-slot:top-left>
        <q-input borderless dense v-model="folderName" placeholder="Open repository"/>
        <q-btn color="primary" label="Load commits" @click="openRepository"/>
      </template>
    </q-table>
  </div>
</template>

<script lang="ts">
import { DefaultLogFields, ListLogLine } from 'simple-git';
import { IGitApi } from 'src/models/iGitApi';
import { defineComponent } from 'vue';


declare global {
  interface Window {
    gitAPI: IGitApi
  }
}

export default defineComponent({
  name: 'CommitsPage',
  props: {
    title: {
      type: String,
      required: true
    },

  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(): { folderName: string, commits: (DefaultLogFields & ListLogLine)[], columns: any, pagination: any} {
    return {
      folderName: '',
      commits: [],
      columns: [
        { name: 'message', label: 'Message', field: 'message', align: 'left'},
        { name: 'date', label: 'Commit date', field: 'date' },
        { name: 'hash', label: 'Commit hash', field: 'hash' },
        {
          name: 'author_name',
          label: 'Author',
          field: 'author_name',
        },
      ],
      pagination: {
        rowsPerPage: 0
      }
    }
  },
  methods: {
    async openRepository(): Promise<void> {
      this.commits = await window.gitAPI.fetchCommits(this.folderName)
      console.log(await window.gitAPI.showDiff(this.folderName))
    }
  },
  computed: {
  }
});
</script>
