<template>
  <q-page class="col">
    <q-tabs v-model="tab" no-caps class="shadow-2">
      <q-tab name="repository" label="Repository" />
      <q-tab name="settings" label="Settings" />
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="repository">
        <repository-tab title="Repository" />
      </q-tab-panel>
      <q-tab-panel name="settings">
        <div class="text-h6">Settings</div>
        <settings-tab />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script lang="ts">
import RepositoryTab from 'src/components/RepositoryTab.vue';
import SettingsTab from 'src/components/SettingsTab.vue';
import { defineComponent } from 'vue';
import { ref } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { RepositoryTab, SettingsTab },
  data() {
    return {
      tab: ref('repository'),
    };
  },
});
</script>
