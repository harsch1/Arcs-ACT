<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import { vOnClickOutside } from '@vueuse/components'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput
} from '@/components/ui/number-field'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { ComboboxAnchor, ComboboxInput, ComboboxPortal, ComboboxRoot } from 'radix-vue'
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete
} from '@/components/ui/tags-input'
import { ChevronRight, ChevronLeft } from 'lucide-vue-next'

import { Color, TokenType, ShipType } from '@/Archive'
import { BuildingType } from '@/Archive'
import type { SystemKey } from '@/Archive'
import { useGameStore } from '@/stores/game'
import { useSystemsStore } from '@/stores/systems'
import type { SystemStorePayload, TokenPieceState } from '@/stores/systems'
import { countByColorAndType } from '@/lib/utils'

const props = defineProps<{
  systemId: SystemKey
  cluster?: number
  defaultOpen?: boolean
}>()

// const emit = defineEmits<{
//   confirm: []
// }>()

const gameStore = useGameStore()
const systemsStore = useSystemsStore()

const activeCluster = ref(props.cluster ?? parseInt(props.systemId.charAt(0)))
const activeSystemIndex = ref(
  systemsStore.clusters[activeCluster.value].findIndex((id) => id === props.systemId)
)
const activeSystem = computed(
  () => systemsStore.clusters[activeCluster.value][activeSystemIndex.value]
)
const systemState = computed(() => systemsStore.systemState(activeSystem.value))

// Variables to work with locally before applying the changes
const pieces = computed(() => [...systemState.value.pieces])
const tokens = ref<TokenType[]>([])
// const tokens = computed(() =>
//   pieces.value
//     .filter((piece) => Object.values(TokenType).includes(piece.type as TokenType))
//     .map((piece) => piece.type)
// )
watch(
  pieces,
  () => {
    tokens.value = pieces.value
      .filter((piece): piece is TokenPieceState =>
        Object.values(TokenType).includes(piece.type as TokenType)
      )
      .map((piece) => piece.type)
  },
  {
    immediate: true
  }
)

const tokenComboboxOpen = ref(false)
const searchTerm = ref('')

// Values to generate the UI
const activeColors = computed(() => gameStore.players.map((player) => player.color))
const colorsWithBuildings = activeColors.value.concat(Color.free)
const colorsWithShips = activeColors.value.concat(Color.empire)

// Calculated derived state
const shipCounters = computed<[Color, Ref<number>][]>(() =>
  colorsWithShips.map((color) => [
    color,
    ref(countByColorAndType(pieces.value, color, ShipType.ship))
  ])
)
const cityCounters = computed<[Color, Ref<number>][]>(() =>
  colorsWithBuildings.map((color) => [
    color,
    ref(countByColorAndType(pieces.value, color, BuildingType.city))
  ])
)
const starportCounters = computed<[Color, Ref<number>][]>(() =>
  colorsWithBuildings.map((color) => [
    color,
    ref(countByColorAndType(pieces.value, color, BuildingType.starport))
  ])
)

// Since tokens are tags, to remove them there's a delete button on every one
function updateTokens(type: TokenType, remove = false) {
  const payload: SystemStorePayload = {
    system: activeSystem.value,
    type: type,
    count: remove ? -1 : 1
  }
  systemsStore.updateState(payload)
}

// When cluster is passed move to the first system of the prev/next cluster
function advanceSystem(delta: number, cluster?: boolean) {
  const clusterCount = Object.keys(systemsStore.clusters).length
  // Check for `cluster` param, if so force the size to get into the condition
  const newSystem = cluster ? Number.POSITIVE_INFINITY : activeSystemIndex.value + delta
  const clusterDelta = cluster ? delta : newSystem < 0 ? -1 : 1

  if (newSystem > systemsStore.clusters[activeCluster.value].length - 1 || newSystem < 0) {
    const newCluster = activeCluster.value + clusterDelta
    activeCluster.value = newCluster <= 0 ? 6 : newCluster > clusterCount ? 1 : newCluster
    activeSystemIndex.value =
      newSystem < 0 ? systemsStore.clusters[activeCluster.value].length - 1 : 0
  } else {
    activeSystemIndex.value = newSystem
  }
}

type UpdatePayload = {
  type: BuildingType | TokenType | ShipType
  color?: Color
  currentValue: number
  newValue: number
}

function updateState(update: UpdatePayload) {
  const count = update.newValue - update.currentValue
  const payload: SystemStorePayload = {
    system: activeSystem.value,
    type: update.type,
    color: update.color,
    count
  }
  systemsStore.updateState(payload)
}
</script>

<template>
  <Dialog :default-open="defaultOpen">
    <DialogTrigger as-child>
      <slot></slot>
    </DialogTrigger>
    <DialogContent class="px-2 pb-2 overflow-auto pt-11 max-sm:h-full max-sm:w-full">
      <DialogHeader>
        <DialogTitle>
          <div class="flex items-center justify-between -mx-2">
            <Button
              variant="ghost"
              @click="advanceSystem(-1, true)"
            >
              <ChevronLeft />
            </Button>
            <span> {{ $t('cluster') }} {{ activeCluster }} </span>
            <Button
              variant="ghost"
              @click="advanceSystem(1, true)"
            >
              <ChevronRight />
            </Button>
          </div>
          <div class="flex items-center justify-between -mx-2">
            <Button
              variant="ghost"
              @click="advanceSystem(-1)"
            >
              <ChevronLeft />
            </Button>
            <span>{{ $t('system_id', { id: activeSystem }) }}</span>
            <Button
              variant="ghost"
              @click="advanceSystem(1)"
            >
              <ChevronRight />
            </Button>
          </div>
        </DialogTitle>
        <!-- <DialogDescription>
          {{ $t('dialog.help_text') }}
        </DialogDescription> -->
      </DialogHeader>

      <div class="text-lg font-semibold">
        {{ $t('dialog.add_ship') }}
      </div>
      <div class="flex">
        <NumberField
          v-for="[color, counter] in shipCounters"
          :key="color"
          :id="`ship-${color}`"
          :model-value="counter.value"
          :min="0"
          class="m-1"
          @update:model-value="
            (value) =>
              updateState({
                type: ShipType.ship,
                currentValue: counter.value,
                newValue: value,
                color
              })
          "
        >
          <Label :for="`ship-${color}`">{{ $t(`colors.${color}`) }}</Label>
          <NumberFieldContent class="dark:text-black">
            <NumberFieldDecrement />
            <NumberFieldInput :class="`bg-${color.toLowerCase()}-400`" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>

      <Separator class="my-2" />

      <div class="text-lg font-semibold">
        {{ $t('dialog.add_building') }}
      </div>
      <div class="font-semibold text-md">
        {{ $t('pieces.CITY', 2) }}
      </div>
      <div class="flex">
        <NumberField
          v-for="[color, counter] in cityCounters"
          :key="color"
          :id="`building-${color}-city`"
          :model-value="counter.value"
          :min="0"
          class="m-1"
          @update:model-value="
            (value) =>
              updateState({
                type: BuildingType.city,
                currentValue: counter.value,
                newValue: value,
                color
              })
          "
        >
          <Label :for="`bulding-${color}-city`">{{ $t(`colors.${color}`) }}</Label>
          <NumberFieldContent class="dark:text-black">
            <NumberFieldDecrement />
            <NumberFieldInput :class="`bg-${color.toLowerCase()}-400`" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>

      <div class="font-semibold text-md">
        {{ $t('pieces.STARPORT', 2) }}
      </div>
      <div class="flex">
        <NumberField
          v-for="[color, counter] in starportCounters"
          :key="color"
          :id="`building-${color}-starport`"
          :model-value="counter.value"
          :min="0"
          class="m-1"
          @update:model-value="
            (value) =>
              updateState({
                type: BuildingType.starport,
                currentValue: counter.value,
                newValue: value,
                color
              })
          "
        >
          <Label :for="`building-${color}-starport`">{{ $t(`colors.${color}`) }}</Label>
          <NumberFieldContent class="dark:text-black">
            <NumberFieldDecrement />
            <NumberFieldInput :class="`bg-${color.toLowerCase()}-400`" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>

      <Separator class="my-2" />

      <div class="text-lg font-semibold">
        {{ $t('dialog.add_token') }}
      </div>
      <ComboboxRoot
        v-model="tokens"
        v-model:open="tokenComboboxOpen"
        v-model:searchTerm="searchTerm"
        class="flex flex-grow"
      >
        <ComboboxAnchor as-child>
          <TagsInput
            class="w-full gap-0 px-3"
            :model-value="tokens"
          >
            <div class="flex flex-wrap items-center gap-2">
              <TagsInputItem
                v-for="token in tokens"
                :key="token"
                :value="token"
              >
                <span class="ml-2 mr-1">{{ $t(`tokens.${token}`) }}</span>
                <TagsInputItemDelete @click="updateTokens(token, true)" />
              </TagsInputItem>
            </div>

            <ComboboxInput
              :placeholder="$t('dialog.search_token')"
              @click="tokenComboboxOpen = true"
              as-child
            >
              <TagsInputInput @keydown.enter.prevent />
            </ComboboxInput>
          </TagsInput>
        </ComboboxAnchor>

        <ComboboxPortal disabled>
          <CommandList
            avoid-collisions
            position="popper"
            class="w-[--radix-popper-anchor-width] rounded-md mt-2 border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 min-h-[128px]"
            v-on-click-outside="
              () => {
                tokenComboboxOpen = false
              }
            "
          >
            <CommandEmpty />
            <CommandGroup>
              <CommandItem
                v-for="token in TokenType"
                :key="token"
                :value="token"
                @select.prevent="
                  (e) => {
                    if (typeof e.detail.value === 'string') {
                      searchTerm = ''
                      // @ts-ignore
                      updateTokens(e.detail.value)
                    }
                  }
                "
              >
                {{ $t(`tokens.${token}`) }}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </ComboboxPortal>
      </ComboboxRoot>

      <DialogFooter class="flex-row justify-end pt-2">
        <DialogClose as-child>
          <Button
            variant="link"
            class="mr-2"
            >{{ $t('common.close') }}</Button
          >
        </DialogClose>
        <!-- <DialogClose as-child>
          <Button
            variant="link"
            class="mr-2"
            >{{ $t('common.cancel') }}</Button
          >
        </DialogClose>

        <DialogClose as-child>
          <Button @click="confirm">
            {{ $t('common.confirm') }}
          </Button>
        </DialogClose> -->
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
