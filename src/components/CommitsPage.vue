<template>
  <div>
    <q-btn color="primary" label="Load commits" @click="seeLog"/>
    <q-table
      :rows="commits"
      :columns="columns"
      row-key="message"
      virtual-scroll
      v-model:pagination="pagination"
      :rows-per-page-options="[0]"
    />
  </div>
</template>

<script lang="ts">
import { DefaultLogFields, ListLogLine } from 'simple-git';
import { defineComponent, PropType } from 'vue';
import { Todo, Meta } from './models';

declare global {
  interface Window {
    gitAPI: IGitApi
  }
}

interface IGitApi {
  seeLog(): Promise<(DefaultLogFields & ListLogLine)[]>
}

export default defineComponent({
  name: 'CommitsPage',
  props: {
    title: {
      type: String,
      required: true
    },
    todos: {
      type: Array as PropType<Todo[]>,
      default: () => [] as Todo[]
    },
    meta: {
      type: Object as PropType<Meta>,
      required: true
    },
    active: {
      type: Boolean
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(): { commits: (DefaultLogFields & ListLogLine)[], columns: any, pagination: any} {
    return {
      commits: [],
      columns: [
        { name: 'message', label: 'Message', field: 'message', align: 'left'},
        { name: 'date', label: 'Commit date', field: 'date' },
        { name: 'hash', label: 'Commit hash', field: 'hash' },
        {
          name: 'author_name',
          required: true,
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
    async seeLog(): Promise<void> {
      this.commits = await window.gitAPI.seeLog()
    }
  },
  computed: {
  }
});
</script>
