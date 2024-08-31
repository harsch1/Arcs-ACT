<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import AppMenu from '@/components/AppMenu.vue'
import AppNavigation from '@/components/AppNavigation.vue'
import { useGameStore } from '@/stores/game'
import Toaster from '@/components/ui/toast/Toaster.vue'

const router = useRouter()
const gameStore = useGameStore()
</script>

<template>
  <header class="flex flex-row-reverse items-center justify-between main">
    <img
      :alt="$t('arcs_cat')"
      class="logo -scale-x-100"
      src="@/assets/images/archivist.png"
    />
    <h1
      class="ml-4 text-lg font-bold"
      :class="{
        // 'hidden md:block': gameStore.settings.name,
        hidden:
          (gameStore.settings.id && gameStore.settings.name) ||
          router.currentRoute.value.name === 'home'
      }"
    >
      {{ $t('arcs_cat') }}
    </h1>

    <h1
      v-if="gameStore.settings.id && gameStore.settings.name"
      class="text-lg font-bold grow"
    >
      {{ gameStore.settings.name }}
    </h1>

    <AppMenu />
  </header>

  <RouterView />

  <AppNavigation v-if="!router.currentRoute.value.meta.hideNavigation" />
  <Toaster />
</template>

<style scoped>
.logo {
  height: 48px;
}
</style>
