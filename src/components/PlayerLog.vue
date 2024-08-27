<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { computed } from 'vue'
import { CardType, Color, EmpireStatus, Fate, Player } from '@/Archive'
import PlayerFlagship from '@/components/PlayerFlagship.vue'
import PlayerResources from '@/components/player-log/PlayerResources.vue'
import PlayerOutrage from '@/components/player-log/PlayerOutrage.vue'
import PlayerFateHistory from '@/components/player-log/PlayerFateHistory.vue'
import DeckBuilder from '@/components/deck-builder/DeckBuilder.vue'
import { useGameStore } from '@/stores/game'

const props = defineProps<{
  player: Player
  act: number
}>()

const gameStore = useGameStore()

const playerColors = computed(() =>
  Object.values(Color).filter((c) => c !== Color.empire && c !== Color.free)
)

if (props.act && props.player.fateHistory.length < props.act) {
  for (let i = props.player.fateHistory.length; i < props.act; i++) {
    addFate()
  }
}

function updateFirstRegent(value: boolean) {
  console.log(value)

  const currentRegent = gameStore.settings.firstRegent
  // No first regent
  if (currentRegent === props.player.name && !value) {
    gameStore.settings.firstRegent = ''
  } else {
    gameStore.settings.firstRegent = props.player.name
  }
}

function updatePlayer(update: Partial<Player>) {
  const payload = {
    ...update,
    color: props.player.color
  }
  gameStore.updatePlayer(payload)
}

function updateFate(
  fate: Fate,
  {
    act,
    power,
    succeeded,
    currentFate
  }: { act: number; power: number; succeeded: boolean; currentFate: boolean }
) {
  const update: Partial<Player> = {}

  // [Fate, power, succeeded objective][]
  const history = [...props.player.fateHistory]
  history[act] = [fate, power, succeeded]
  update.fateHistory = history

  if (currentFate) {
    update.currentFate = fate
  }

  // Player total power is the sum of all their fates
  update.power = history.reduce((acc, [, power]) => ((acc += power ?? 0), acc), 0)

  updatePlayer(update)
}

function addFate() {
  updatePlayer({
    color: props.player.color,
    // @ts-ignore WIP
    fateHistory: [...props.player.fateHistory, []]
  })
}
</script>

<template>
  <Tabs
    default-value="board"
    class="px-4"
  >
    <TabsList class="w-full">
      <TabsTrigger value="board">
        {{ $t('player_area.board') }}
      </TabsTrigger>
      <TabsTrigger value="court">
        {{ $t('player_area.court') }}
      </TabsTrigger>
      <TabsTrigger value="flagship">
        {{ $t('player_area.flagship') }}
      </TabsTrigger>
    </TabsList>

    <TabsContent value="board">
      <div class="w-full max-w-lg">
        <Input
          class="my-2"
          :placeholder="$t('player_area.name')"
          :model-value="player.name"
          @update:model-value="(value) => updatePlayer({ name: value as string })"
        />
        <Select v-if="!player.color">
          <SelectTrigger class="my-2">
            <SelectValue :placeholder="$t('player_area.color')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="color in playerColors"
              :key="color"
              :value="color"
            >
              <span
                class="inline-block w-4 h-4 mr-2 align-middle border rounded-full border-slate-950"
                :class="color !== Color.white ? `bg-${color.toLowerCase()}-400` : 'bg-white'"
              ></span>
              <span class="align-middle">{{ $t(`colors.${color}`) }}</span>
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Empire status -->
        <div class="flex items-center my-4 space-x-2">
          <Switch
            id="empire-status"
            name="empire-status"
            :checked="player.empireStatus === EmpireStatus.regent"
            :value="player.empireStatus"
            size=""
            @update:checked="
              (value) =>
                updatePlayer({ empireStatus: value ? EmpireStatus.regent : EmpireStatus.outlaw })
            "
          />
          <Label for="empire-status">
            <Badge
              class="text-white rounded-sm"
              :class="{
                'bg-empire-600': player.empireStatus === EmpireStatus.regent,
                'bg-orange-900': player.empireStatus === EmpireStatus.outlaw
              }"
              >{{ $t(`empire_status.${player.empireStatus}`) }}</Badge
            >
          </Label>

          <Checkbox
            v-if="player.empireStatus === EmpireStatus.regent"
            id="first-regent"
            :checked="gameStore.settings.firstRegent === player.name"
            @update:checked="updateFirstRegent"
          />
          <Label
            v-if="player.empireStatus === EmpireStatus.regent"
            for="first-regent"
            class="ml-2"
          >
            {{ $t('empire_status.FIRST_REGENT') }}
          </Label>

          <div class="flex grow"></div>

          <div class="w-16 ml-2 text-right whitespace-nowrap">
            <p>
              {{ $t('player_area.power') }}: <strong>{{ player.power }}</strong>
            </p>
          </div>
        </div>

        <!-- Fates -->
        <PlayerFateHistory
          class="my-2"
          :player="player"
          :act="act"
          @add="
            () =>
              updatePlayer({
                color: player.color,
                // @ts-ignore WIP
                fateHistory: [...player.fateHistory, []]
              })
          "
          @update="(fate, options) => updateFate(fate, options)"
        />

        <!-- Resources -->
        <PlayerResources
          class="my-2"
          :player="player"
          @update="
            (resource) =>
              updatePlayer({
                resources: [...player.resources, resource]
              })
          "
        />

        <!-- Outrage -->
        <PlayerOutrage
          class="my-2"
          :player="player"
          @update="
            (resource) =>
              updatePlayer({
                outrage: [...player.outrage, resource]
              })
          "
        />

        <!-- Notes -->
        <Textarea
          class="my-2"
          :placeholder="$t('player_area.notes')"
          :model-value="player.notes"
          @update:model-value="(value) => updatePlayer({ notes: value as string })"
        >
        </Textarea>
      </div>
    </TabsContent>

    <TabsContent value="court">
      <DeckBuilder
        :title="$t('deck_builder.player_court')"
        :tags="[CardType.ability, CardType.guild, CardType.title, CardType.lore]"
        :shortcut="player.name"
      />
    </TabsContent>

    <TabsContent value="flagship">
      <PlayerFlagship
        :player="player"
        @update="
          (value) =>
            updatePlayer({
              flagshipState: value
            })
        "
      />
    </TabsContent>
  </Tabs>
</template>

<style scoped>
.fate-wrapper + .fate-wrapper {
  margin-top: theme('spacing.2');
}
</style>
