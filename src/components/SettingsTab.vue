<template>
  <div class="row">
    <q-input outlined dense v-model="username" hint="Git global username" />
    <q-btn
      v-if="!!this.username && this.currentUsername !== this.username"
      color="primary"
      outline
      no-caps
      label="Change"
      @click="changeUserName"
    />
  </div>
</template>

<script lang="ts">
import { IGitApi } from 'src/models/api/iGitApi';
import { defineComponent } from 'vue';

declare global {
  interface Window {
    gitAPI: IGitApi;
  }
}

export default defineComponent({
  name: 'SettingsTab',
  data(): {
    username: string;
    currentUsername: string;
  } {
    return {
      username: '',
      currentUsername: '',
    };
  },
  mounted: async function () {
    this.currentUsername = await window.gitAPI.getGitUsername();
    if (this.currentUsername !== '') this.username = this.currentUsername;
  },
  methods: {
    async changeUserName(): Promise<void> {
      if (!this.username) return;
      await window.gitAPI.setGitUsername(this.username);
      this.currentUsername = this.username;
    },
  },
});
</script>
