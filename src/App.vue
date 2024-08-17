<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppMenu from '@/components/AppMenu.vue'
import { useGameStore } from '@/stores/game'
import Toaster from '@/components/ui/toast/Toaster.vue'
const gameStore = useGameStore()
</script>

<template>
  <header class="flex flex-row-reverse items-center main">
    <img
      :alt="$t('arcs_cat')"
      class="logo -scale-x-100"
      src="@/assets/images/archivist.png"
    />
    <h1
      class="ml-4 text-lg font-bold"
      :class="{ 'hidden md:block': gameStore.settings.name }"
    >
      {{ $t('arcs_cat') }}
    </h1>

    <h1
      v-if="gameStore.settings.name"
      class="ml-16 text-lg font-bold grow"
    >
      {{ gameStore.settings.name }}
    </h1>

    <AppMenu />
  </header>

  <RouterView />
  <Toaster />
</template>

<style scoped>
.logo {
  height: 48px;
}
</style>
