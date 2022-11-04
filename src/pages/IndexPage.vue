<template>
  <q-page class="col">
    <q-tabs v-model="tab" no-caps class="shadow-2">
      <q-tab name="commits" label="Repository" />
      <q-tab name="settings" label="Settings" />
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="commits">
        <commits-page title="Commits Page" />
      </q-tab-panel>
      <q-tab-panel name="settings">
        <div class="text-h6">Settings</div>
        <settings-page />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script lang="ts">
import CommitsPage from 'components/CommitsPage.vue';
import SettingsPage from 'components/SettingsPage.vue';
import { defineComponent } from 'vue';
import { ref } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { CommitsPage, SettingsPage },
  data() {
    return {
      tab: ref('commits'),
    };
  },
});
</script>
