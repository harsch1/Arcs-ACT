<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { Screen, useUiStore } from '@/stores/ui'
import { Settings, Users, Map, Layers, NotebookText } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { useI18n } from 'vue-i18n'
import { useGameStore } from '@/stores/game'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const { t } = useI18n()
const { toast } = useToast()
const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const uiStore = useUiStore()

const isMapView = computed(() => {
  return uiStore.currentScreen === Screen.Map || route.name === 'map'
})

function showError(messages: string[]) {
  toast({
    variant: 'warning',
    title: messages.map((msg) => t(msg)).join('\n'),
    duration: 2000
  })
}

async function advance(delta: number = 1) {
  // Only validate moving forward
  if (delta < 0) {
    return await uiStore.advance(delta)
  }

  const err = uiStore.validate()

  if (!err) {
    return await uiStore.advance(delta)
  }

  showError(err)
}

async function save(id?: string) {
  const save = await gameStore.saveGame(id)
  gameStore.loadGame(save.id)
  // downloadId.value = save.id
  toast({
    title: id
      ? t('toast.game_updated', { name: save.name })
      : t('toast.game_saved', { name: save.name }),
    duration: 5000
    // description: 'There was a problem with your request.',
    // action: h(ToastAction, {
    //   altText: 'Try again',
    // }, {
    //   default: () => 'Try again',
    // }),
  })
}
</script>

<template>
  <div
    id="bottom-controls"
    class="fixed bottom-0 z-20 flex justify-between items-center w-full max-w-md pt-1 pb-safe-offset-1 px-safe-offset-2 bg-background h-[68px]"
  >
    <template v-if="gameStore.isGameLoaded">
      <Button
        class="flex flex-col items-center h-auto hover:bg-slate-100 hover:text-slate-800"
        :class="{ 'bg-slate-100 text-slate-800': uiStore.currentScreen === Screen.Players }"
        variant="ghost"
        @click="router.push({ name: 'campaign', query: { screen: Screen.Players } })"
      >
        <Users />
        <span>{{ $t('navigation.players') }}</span>
      </Button>

      <Button
        class="flex flex-col items-center h-auto hover:bg-slate-100 hover:text-slate-800"
        :class="{ 'bg-slate-100 text-slate-800': isMapView }"
        variant="ghost"
        @click="router.push({ name: 'campaign', query: { screen: Screen.Map } })"
      >
        <Map />
        <span>{{ $t('navigation.map') }}</span>
      </Button>

      <Button
        class="flex flex-col items-center h-auto hover:bg-slate-100 hover:text-slate-800"
        :class="{ 'bg-slate-100 text-slate-800': uiStore.currentScreen === Screen.Deck }"
        variant="ghost"
        @click="router.push({ name: 'campaign', query: { screen: Screen.Deck } })"
      >
        <Layers />
        <span>{{ $t('navigation.deck') }}</span>
      </Button>

      <Button
        class="flex flex-col items-center h-auto hover:bg-slate-100 hover:text-slate-800"
        :class="{ 'bg-slate-100 text-slate-800': uiStore.currentScreen === Screen.Misc }"
        variant="ghost"
        @click="router.push({ name: 'campaign', query: { screen: Screen.Misc } })"
      >
        <NotebookText />
        <span>{{ $t('navigation.campaign') }}</span>
      </Button>
    </template>

    <template v-else>
      <Button
        :disabled="!uiStore.canBack"
        @click="advance(-1)"
      >
        {{ $t('common.back') }}
      </Button>

      <div
        v-if="uiStore.currentScreen === Screen.Settings"
        class="flex items-center px-2 screen-label"
      >
        <Settings />
        <span class="ml-2">{{ $t('navigation.settings') }}</span>
      </div>

      <div
        v-if="uiStore.currentScreen === Screen.Players"
        class="flex items-center px-2 screen-label"
      >
        <Users />
        <span class="ml-2">{{ $t('navigation.players') }}</span>
      </div>

      <div
        v-if="uiStore.currentScreen === Screen.Map"
        class="flex items-center px-2 screen-label"
      >
        <Map />
        <span class="ml-2">{{ $t('navigation.map') }}</span>
      </div>

      <div
        v-if="uiStore.currentScreen === Screen.Deck"
        class="flex items-center px-2 screen-label"
      >
        <Layers />
        <span class="ml-2">{{ $t('navigation.deck') }}</span>
      </div>

      <div
        v-if="uiStore.currentScreen === Screen.Misc"
        class="flex items-center px-2 screen-label"
      >
        <NotebookText />
        <span class="ml-2">{{ $t('navigation.campaign') }}</span>
      </div>

      <Button
        v-if="uiStore.showNext"
        @click="advance()"
      >
        {{ $t('common.next') }}
      </Button>
      <Button
        v-else
        @click="save()"
      >
        {{ $t('common.create') }}
      </Button>
    </template>
  </div>
</template>

<style scoped>
.screen-label {
  @apply pb-safe-offset-4 w-full h-full absolute justify-center bottom-0 left-0 pt-4 -z-10 pointer-events-none;
}
</style>
