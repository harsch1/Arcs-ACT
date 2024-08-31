<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { computed, ref, watch } from 'vue'
import { CardType, Color, Player } from '@/Archive'
import PlayerLog from '@/components/PlayerLog.vue'
import GameBoardList from '@/components/GameBoardList.vue'
import { useGameStore } from '@/stores/game'
import DeckBuilder from '@/components/deck-builder/DeckBuilder.vue'
import { useRoute } from 'vue-router'

import { Dices, FileDown } from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'
import { generateName } from '@/lib/utils'
import { Screen, useUiStore } from '@/stores/ui'

const route = useRoute()
const gameStore = useGameStore()
const uiStore = useUiStore()

const players = computed({
  get() {
    return gameStore.players.map((player) => player.color)
  },
  set(value: Color[]) {
    gameStore.updatePlayers(value)
  }
})
const currentScreen = computed(() => uiStore.currentScreen)
const currentPlayer = ref<Color | undefined>(players.value[0])
const playerColors = Object.values(Color).filter((c) => c !== Color.empire && c !== Color.free)
const downloadId = ref<string>()

function updatePlayer(color: Color, update: Partial<Player>) {
  const payload = {
    ...update,
    color
  }
  gameStore.updatePlayer(payload)
}

function updateCampaignNotes(notes: string) {
  gameStore.settings.notes = notes
}

function randomName() {
  gameStore.settings.name = generateName()
}

watch(
  route,
  ({ query }) => {
    if (query.mode === 'create') {
      gameStore.$reset()
      uiStore.go(Screen.Settings)
      return
    }

    if (query.screen) {
      uiStore.go(parseInt(query.screen as string))
    }
  },
  {
    immediate: true
  }
)

watch(players, () => {
  if (currentPlayer.value === undefined || !players.value.includes(currentPlayer.value)) {
    currentPlayer.value = players.value[0]
  }
})
</script>

<template>
  <main class="viewport">
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
          class="grid grid-cols-2 justify-stretch gap-y-4"
        >
          <div
            v-for="color in playerColors"
            :key="color"
            class="flex flex-col items-center justify-start mx-3 min-h-44"
          >
            <ToggleGroupItem
              :value="color"
              class="player-toggle"
            >
              <img
                class="agent-button"
                :src="`./images/${color.toLowerCase()}_agent.png`"
              />
            </ToggleGroupItem>

            <Input
              v-if="gameStore.players.find((p) => p.color === color)"
              :model-value="gameStore.players.find((p) => p.color === color)!.name"
              class="w-24 mt-2"
              @click.stop
              @update:model-value="(value) => updatePlayer(color, { name: value as string })"
            />
          </div>
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
              :src="`./images/${player.color.toLowerCase()}_agent.png`"
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
      class="p-4 pb-0"
    >
      <DeckBuilder
        :title="$t('deck_builder.title')"
        :description="$t('deck_builder.swipe_help')"
        :exclude-tags="[CardType.setup, CardType.resolution, CardType.objective]"
        :shortcut="'court'"
      />
    </div>

    <!-- Misc -->
    <div
      v-if="currentScreen === Screen.Misc"
      class="p-4"
    >
      <p class="w-full py-2 text-lg">
        {{ $t('campaign.misc_help_text') }}
      </p>

      <div class="flex mt-2">
        <Input
          class="max-w-sm"
          :model-value="gameStore.settings.name"
          :placeholder="$t('campaign.name')"
        />
        <Button
          variant="ghost"
          size="icon"
          class="ml-2"
          @click="randomName"
        >
          <Dices :size="24" />
        </Button>
      </div>
      <!-- :model-value="globalFilter"
        @update:model-value="(value) => (globalFilter = String(value))" -->

      <Textarea
        class="my-2 min-h-40"
        :placeholder="$t('campaign.notes')"
        :model-value="gameStore.settings.notes"
        @update:model-value="(value) => updateCampaignNotes(value as string)"
      />

      <div class="my-8 text-center">
        <Button
          v-if="downloadId"
          @click="gameStore.exportGame(downloadId)"
        >
          {{ $t('common.download') }}
          <FileDown />
        </Button>
      </div>
    </div>
  </main>
</template>

<style scoped>
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
