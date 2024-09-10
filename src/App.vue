<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppMenu from '@/components/AppMenu.vue'
import AppNavigation from '@/components/AppNavigation.vue'
import { useGameStore } from '@/stores/game'
import Toaster from '@/components/ui/toast/Toaster.vue'
import { Screen } from '@/stores/ui'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

router
  .isReady()
  .then(() => {
    if (route.query.id) {
      return gameStore.loadGame(route.query.id as string)
    }
  })
  .then((loaded) => {
    if (loaded) {
      return router.replace({
        name: 'campaign',
        query: { screen: route.query.screen ?? Screen.Map }
      })
    }

    return router.replace({ name: route.name === 'campaign' ? 'campaign' : 'home', query: {} })
  })
</script>

<template>
  <header class="flex flex-row-reverse items-center justify-between main">
    <img
      :alt="$t('arcs_act')"
      class="logo -scale-x-100"
      src="@/assets/images/archivist.png?h=128"
    />
    <h1
      class="ml-2 text-lg font-bold grow"
      :class="{
        // 'hidden md:block': gameStore.settings.name,
        hidden:
          (gameStore.settings.id && gameStore.settings.name) ||
          router.currentRoute.value.name === 'home'
      }"
    >
      {{ $t('arcs_act') }}
    </h1>

    <h1
      v-if="gameStore.settings.id && gameStore.settings.name"
      class="ml-2 text-lg font-bold grow"
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
