<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { computed, ref, watch } from 'vue'
import { CardType, Color, Player } from '@/Archive'
import { useGameStore } from '@/stores/game'
import { useRoute, useRouter } from 'vue-router'
import { Screen, useUiStore } from '@/stores/ui'
import PlayerLog from '@/components/PlayerLog.vue'
import DeckBuilder from '@/components/deck-builder/DeckBuilder.vue'
import GameBoardList from '@/components/GameBoardList.vue'
import CampaignMisc from '@/components/CampaignMisc.vue'

const router = useRouter()
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

function updatePlayer(color: Color, update: Partial<Player>) {
  const payload = {
    ...update,
    color
  }
  gameStore.updatePlayer(payload)
}

watch(
  route,
  async ({ query }) => {
    if (query.mode === 'create' && gameStore.settings.id) {
      gameStore.$reset()
      // remove the id from the url if it is present
      if (query.id) {
        await router.replace({
          name: 'campaign',
          query: {
            ...query,
            screen: Screen.Settings,
            id: undefined
          }
        })
      }
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
      <CampaignMisc />
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
