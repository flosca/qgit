import { defineStore } from 'pinia';

export const useRepositoryPathStore = defineStore('repositoryPath', {
  state: () => ({
    path: ''
  }),
  persist: true,
})