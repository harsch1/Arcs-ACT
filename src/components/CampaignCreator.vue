<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { computed, ref, watch } from 'vue'
import { Color } from '@/Archive'
import PlayerLog from '@/components/PlayerLog.vue'
import GameBoardList from '@/components/GameBoardList.vue'
import { useGameStore } from '@/stores/game'
import DeckBuilder from '@/components/deck-builder/DeckBuilder.vue'

enum Screen {
  Settings = 0,
  Players = 1,
  Map = 2,
  Deck = 3,
  _TOTAL_
}

const gameStore = useGameStore()

const players = ref<Color[]>([])
const currentScreen = ref(Screen.Settings)
const currentPlayer = ref('')
const playerColors = Object.values(Color).filter((c) => c !== Color.empire && c !== Color.free)

const canAdvance = computed(() => players.value.length > 0)
const canSave = computed(() => true)

function advanceScreen(delta: number = 1) {
  if (currentScreen.value === Screen.Settings) {
    gameStore.updatePlayers(players.value)
  }

  currentScreen.value += delta

  if (currentScreen.value === Screen.Players && currentPlayer.value === '') {
    currentPlayer.value = players.value[0]
  }
}

function save() {
  gameStore.saveGame()
}

watch([gameStore.players, gameStore.settings], () => {
  players.value = gameStore.players.map((p) => p.color)
  // act.value = gameStore.settings.act.toString()
})
</script>

<template>
  <div class="viewport">
    <!-- Settings -->
    <div
      v-if="currentScreen === Screen.Settings"
      class="p-4"
    >
      <div class="mb-8">
        <p class="w-full mb-4 text-xl">{{ $t('campaign.which_act_just_ended?') }}</p>
        <ToggleGroup
          type="single"
          :default-value="gameStore.settings.act.toString()"
          @update:model-value="(value) => (gameStore.settings.act = parseInt(value as string))"
        >
          <ToggleGroupItem
            v-for="i in [1, 2]"
            :key="i"
            :value="`${i}`"
            size="lg"
            class="mx-1"
          >
            {{ $t('act', { n: i }) }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div>
        <p class="w-full mb-2 text-xl">{{ $t('campaign.who_is_playing?') }}</p>
        <ToggleGroup
          v-model="players"
          type="multiple"
        >
          <ToggleGroupItem
            v-for="color in playerColors"
            :key="color"
            :value="color"
            class="mx-1 player-toggle"
          >
            <img
              class="agent-button"
              :src="`/images/${color.toLowerCase()}_agent.png`"
            />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>

    <!-- Players -->
    <div v-if="currentScreen === Screen.Players">
      <Tabs
        v-model="currentPlayer"
        class="player-tabs"
        default-value="board"
      >
        <TabsList class="w-full h-auto bg-transparent">
          <TabsTrigger
            v-for="player in gameStore.players"
            :key="player.color"
            :value="player.color"
            class="mx-2 player-tab-trigger"
          >
            <img
              class="h-12"
              :src="`/images/${player.color.toLowerCase()}_agent.png`"
            />
          </TabsTrigger>
        </TabsList>
        <TabsContent
          v-for="player in gameStore.players"
          :key="player.color"
          :value="player.color"
        >
          <PlayerLog
            :player="player"
            :act="gameStore.settings.act"
          />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Map -->
    <div v-if="currentScreen === Screen.Map">
      <GameBoardList />
    </div>

    <!-- Deck -->
    <div
      v-if="currentScreen === Screen.Deck"
      class="p-4"
    >
      <DeckBuilder />
    </div>
  </div>

  <div
    class="fixed bottom-0 left-0 flex justify-between w-full pt-4 pb-safe-offset-4 px-safe-offset-4 bg-inherit"
  >
    <Button
      :disabled="!canAdvance"
      @click="advanceScreen(-1)"
    >
      {{ $t('common.back') }}
    </Button>

    <Button
      v-if="currentScreen < Screen._TOTAL_ - 1"
      :disabled="!canAdvance"
      @click="advanceScreen()"
    >
      {{ $t('common.next') }}
    </Button>
    <Button
      v-else
      :disabled="!canSave"
      @click="save()"
    >
      {{ $t('common.save') }}
    </Button>
  </div>
</template>

<style scoped>
.viewport {
  /* Header and footer into account */
  height: calc(100vh - 64px - 72px - env(safe-area-inset-bottom));
  overflow: auto;
}

.player-toggle {
  height: 116px;
  border: 2px solid transparent;
}

.player-tab-trigger {
  border: 2px solid transparent;
}

.player-toggle:hover:not([data-state='on']) {
  background-color: initial;
}

.player-toggle[data-state='on'],
.player-tab-trigger[data-state='active'] {
  border: 2px solid white;
}

.agent-button {
  height: 80px;
}
</style>
