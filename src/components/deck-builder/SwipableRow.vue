<script lang="ts" setup>
import TableRowActions from '@/components/deck-builder/TableRowActions.vue'
import { FlexRender, type Row } from '@tanstack/vue-table'
import { usePointerSwipe } from '@vueuse/core'
import { computed, ref, useAttrs } from 'vue'
import { SquarePlus, SquareX } from 'lucide-vue-next'

import type { GameCard } from '@/stores/cards'

const props = defineProps<{
  height: number
  row: Row<GameCard>
  locations: string[]
  shortcut?: string
}>()

const attrs = useAttrs() as { onMove(id: string, location: string): void }

const card = computed(() => props.row.original)

const rowWrapper = ref<HTMLElement | null>(null)
const rowEl = ref<any>(null)
const left = ref('0')
const { isSwiping, direction, distanceX } = usePointerSwipe(rowEl, {
  onSwipe(e) {
    left.value = `${distanceX.value * -1}px`
  },
  onSwipeEnd(e, direction) {
    if (Math.abs(distanceX.value) > 120) {
      if (direction === 'right') {
        attrs.onMove(card.value.id, 'scrap')
      }

      if (props.shortcut && direction === 'left') {
        attrs.onMove(card.value.id, props.shortcut)
      }
    }
  }
})
</script>

<template>
  <div
    ref="rowWrapper"
    class="relative"
    :style="{ height: `${height}px` }"
  >
    <div
      class="absolute left-0 flex flex-row items-center w-1/2 h-full pl-2 bg-red-500 opacity-100 -z-20"
      :class="{ '!w-full !-z-10': isSwiping && direction === 'right' }"
    >
      <SquareX class="w-8 h-8" />
      <span class="mx-2">{{ $t('deck_builder.scrap') }}</span>
    </div>
    <div
      class="absolute right-0 flex flex-row-reverse items-center w-1/2 h-full pr-2 bg-blue-500 opacity-100 -z-20"
      :class="{ '!w-full !-z-10': isSwiping && direction === 'left' }"
    >
      <SquarePlus class="w-8 h-8" />
      <span class="mx-2">{{ $t('deck_builder.move_to_location', { location: shortcut }) }}</span>
    </div>
    <div
      ref="rowEl"
      class="top-0 left-0 flex items-center w-full h-full bg-background"
      :class="{ absolute: isSwiping }"
      :style="{ left }"
    >
      <FlexRender
        v-for="cell in row.getVisibleCells()"
        :key="cell.id"
        :render="cell.column.columnDef.cell"
        :props="cell.getContext()"
        class="p-2"
      />
      <!-- Actions -->
      <div class="mr-4 text-right whitespace-nowrap">
        <TableRowActions
          :card="card"
          :locations="locations"
          :hide-scrap="true"
          @move="attrs.onMove"
        ></TableRowActions>
      </div>
    </div>
  </div>
</template>
