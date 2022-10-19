<template>
  <q-page class="row">
    <commits-page
        title="Commits Page"
      />
  </q-page>
</template>

<script lang="ts">
import CommitsPage from 'components/CommitsPage.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { CommitsPage },
  data() {
    return { };
  }
});
</script>
