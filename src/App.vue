<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppMenu from '@/components/AppMenu.vue'
</script>

<template>
  <header class="flex flex-row-reverse items-center main">
    <img
      :alt="$t('arcs_cat')"
      class="logo -scale-x-100"
      src="@/assets/images/archivist.png"
    />
    <h1 class="ml-4 text-lg font-bold">{{ $t('arcs_cat') }}</h1>
    <AppMenu />
  </header>

  <RouterView />
</template>

<style scoped>
.logo {
  height: 48px;
}
</style>
