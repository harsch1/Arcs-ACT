<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { computed, ref } from 'vue'
import { CardType, Color } from '@/Archive'
import PlayerLog from '@/components/PlayerLog.vue'
import GameBoardList from '@/components/GameBoardList.vue'
import { useGameStore } from '@/stores/game'
import DeckBuilder from '@/components/deck-builder/DeckBuilder.vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
  }>(),
  {
    mode: 'create'
  }
)

enum Screen {
  Settings = 0,
  Players = 1,
  Map = 2,
  Deck = 3,
  _TOTAL_
}

const router = useRouter()
const gameStore = useGameStore()
const { t } = useI18n()
const { toast } = useToast()

const players = computed({
  get() {
    return gameStore.players.map((player) => player.color)
  },
  set(value: Color[]) {
    gameStore.updatePlayers(value)
  }
})
const currentScreen = ref(props.mode === 'create' ? Screen.Settings : Screen.Players)
const currentPlayer = ref<Color | undefined>(players.value[0])
const playerColors = Object.values(Color).filter((c) => c !== Color.empire && c !== Color.free)

const isEditing = computed(() => props.mode === 'edit')
const canAdvance = computed(() => players.value.length > 0 && currentScreen.value < Screen._TOTAL_)
const canReturn = computed(() => currentScreen.value > 0)
const canSave = computed(() => true)

if (gameStore.players.length < 1) {
  router.replace('campaign')
  currentScreen.value = Screen.Settings
}

function advanceScreen(delta: number = 1) {
  currentScreen.value += delta

  if (currentScreen.value === Screen.Players && currentPlayer.value === undefined) {
    currentPlayer.value = players.value[0]
  }
}

async function save(id?: string) {
  const name = await gameStore.saveGame(id)
  toast({
    title: id ? t('toast.game_updated', { name }) : t('toast.game_saved', { name }),
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
              :src="`./images/${color.toLowerCase()}_agent.png`"
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
      class="p-4"
    >
      <DeckBuilder
        :title="$t('deck_builder.title')"
        :exclude-tags="[CardType.setup, CardType.resolution, CardType.objective]"
      />
    </div>
  </div>

  <div
    id="bottom-controls"
    class="fixed bottom-0 left-0 flex justify-between w-full pt-4 pb-safe-offset-4 px-safe-offset-4 bg-inherit"
  >
    <Button
      :disabled="!canReturn"
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
    <div
      v-else-if="gameStore.settings.id"
      class="inline-flex items-center justify-center rounded-md"
    >
      <Button
        class="rounded-r-none"
        :disabled="!canSave"
        @click="save(gameStore.settings.id)"
      >
        {{ $t('common.update') }}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            class="rounded-l-none"
            size="icon"
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="border-0 bg-primary text-primary-foreground"
          side="top"
          align="end"
        >
          <DropdownMenuItem @click="save()">
            {{ $t('common.create_new') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <Button
      v-else
      :disabled="!canSave"
      @click="save()"
    >
      {{ $t('common.create') }}
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
