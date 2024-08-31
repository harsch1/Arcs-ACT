<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { NumberField, NumberFieldContent, NumberFieldInput } from '@/components/ui/number-field'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
import { romanNumerals } from '@/lib/utils'
import { Fate } from '@/Archive'
import { computed } from 'vue'
import fateMeta from '@/assets/decks/fate-meta.json'

import type { Player } from '@/Archive'

const props = defineProps<{
  player: Player
  act: number
  unavailableFates?: Fate[]
}>()

const emit = defineEmits<{
  update: [Fate, { act: number; power: number; succeeded: boolean; currentFate: boolean }]
  add: []
}>()

const canAddFate = computed(() => {
  if (!props.act) {
    return true
  }

  return (props.player.fateHistory ?? []).length < props.act
})

const fatesByAct = computed(() => (act: number) => {
  return Object.values(fateMeta)
    .filter((meta) => {
      // Act is passed as 0-based
      // Check the fate history and enable the fate if the player completed
      // the objective in a previous act
      return (
        meta.act === act + 1 ||
        props.player.fateHistory.find(([fateId, , succeeded]) => meta.id === fateId && succeeded)
      )
    })
    .map((meta) => meta.id) as Fate[]
})

const isFateDisabled = computed(() => (fate: Fate) => {
  // Check the fate history and enable the fate if the player completed
  // the objective in a previous act
  const playerFateSucceeded = props.player.fateHistory.find(
    ([fateId, , succeeded]) => fate === fateId && succeeded
  )

  return playerFateSucceeded
    ? false
    : props.unavailableFates && props.unavailableFates.includes(fate)
})

function updateFate(
  fate: Fate,
  fateAct: number,
  { power, succeeded }: { power?: number; succeeded?: boolean } = {}
) {
  // [Fate, power, succeeded objective][]
  const history = [...props.player.fateHistory]

  emit('update', fate, {
    act: fateAct,
    power: power ?? history[fateAct][1],
    succeeded: succeeded ?? history[fateAct][2],
    currentFate: fateAct + 1 === props.act
  })
}

function addFate() {
  emit('add')
}
</script>

<template>
  <div
    v-for="([fate, power, succeeded], fateAct) in player.fateHistory"
    :key="fate"
    class="flex flex-row px-3 py-2 border rounded border-neutral-400 fate-wrapper"
  >
    <div class="flex flex-col items-center justify-center mr-4 grow-0">
      <span>Act</span><span class="font-serif text-xl">{{ romanNumerals[fateAct + 1] }}</span>
    </div>
    <div class="grow">
      <div class="flex flex-row">
        <div class="mr-2 grow">
          <Label :for="`player-fate-${fateAct}`">{{ $t('player_area.fate') }}</Label>
          <Select
            :id="`player-fate-${fateAct}`"
            :model-value="fate"
            @update:model-value="(value) => updateFate(value as Fate, fateAct)"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              :collision-padding="{ top: 64, bottom: 200 }"
              avoid-collisions
            >
              <SelectItem
                v-for="fateId in fatesByAct(fateAct)"
                :key="fateId"
                :value="fateId"
                :disabled="fate !== fateId && isFateDisabled(fateId)"
              >
                <strong>{{ fateId }}</strong> {{ $t(`fates.${fateId}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="w-16 ml-2">
          <Label :for="`player-power-${fateAct}`">{{ $t('player_area.power') }}</Label>
          <NumberField
            :id="`player-power-${fateAct}`"
            :model-value="power"
            @update:model-value="(value) => updateFate(fate, fateAct, { power: value })"
          >
            <NumberFieldContent>
              <NumberFieldInput></NumberFieldInput>
            </NumberFieldContent>
          </NumberField>
        </div>
      </div>
      <div class="flex items-center mt-2">
        <Checkbox
          :id="`player-fate-succeeded-${fateAct}`"
          :checked="succeeded"
          @update:checked="(value) => updateFate(fate, fateAct, { succeeded: value })"
        />
        <Label
          :for="`player-fate-succeeded-${fateAct}`"
          class="ml-2"
        >
          {{ $t('player_area.completed_objective') }}
        </Label>
      </div>
    </div>
  </div>
  <Button
    v-if="canAddFate"
    class="w-full my-2"
    @click="addFate"
  >
    <Plus class="mr-2" />
    {{ $t('player_area.add_fate') }}
  </Button>
</template>

<style scoped>
.fate-wrapper + .fate-wrapper {
  margin-top: theme('spacing.2');
}
</style>
