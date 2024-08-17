<script lang="ts" setup>
import GamePiece from '@/components/GamePiece.vue'
import flagshipConfig from '@/lib/flagship-ui-config'
import buildingSvg from '@/components/game/shapes/building.svg?url'

import { BuildingType, type FlagshipState, type FlagshipSlot, Player } from '@/Archive'
import { watch, type CSSProperties } from 'vue'

const props = withDefaults(
  defineProps<{
    player: Player
    offset?: {
      x: number
      y: number
    }
  }>(),
  {
    offset: () => ({
      x: 0,
      y: 0
    })
  }
)

const emit = defineEmits<{
  update: [state: FlagshipState]
}>()

let flagshipState: FlagshipState = {}

const baseStyle: CSSProperties = {
  position: 'absolute',
  scale: 0.35
}

function cycle(type: 'upgrade' | 'armor', slot: FlagshipSlot) {
  // Ensure object is initialized
  flagshipState[slot] ??= {}
  // flagshipState[slot][type] ??= []

  const slotState = flagshipState[slot]![type]
  if (slotState === undefined) {
    flagshipState[slot]![type] = [BuildingType.city, true]
  } else if (slotState[0] === BuildingType.city) {
    flagshipState[slot]![type] =
      slotState[1] === true ? [BuildingType.city, false] : [BuildingType.starport, true]
  } else if (slotState[0] === BuildingType.starport) {
    flagshipState[slot]![type] = slotState[1] === true ? [BuildingType.starport, false] : undefined
  }

  emit('update', flagshipState)
}

watch(
  () => props.player.flagshipState,
  (newState) => {
    flagshipState = { ...(newState ?? {}) }
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div class="relative w-full overflow-auto flagship-wrapper">
    <div class="w-[967px]">
      <img src="/images/board-flagship.jpg" />
    </div>
    <template
      v-for="(config, slot) in player.flagshipState"
      :key="slot"
    >
      <template
        v-for="(building, type) in config"
        :key="`${slot}-${type}`"
      >
        <GamePiece
          v-if="building"
          :scale="0.35"
          :piece-config="{
            type: building[0],
            isFresh: building[1],
            color: player.color,
            position: {
              x: flagshipConfig[slot][type].x + offset.x,
              y: flagshipConfig[slot][type].y + offset.y
            }
          }"
        />
      </template>
    </template>
    <template
      v-for="(slot, name) in flagshipConfig"
      :key="name"
    >
      <img
        :style="{ ...baseStyle, top: `${slot.upgrade.y}px`, left: `${slot.upgrade.x}px` }"
        :src="buildingSvg"
        @click="cycle('upgrade', name)"
      />
      <img
        :style="{ ...baseStyle, top: `${slot.armor.y}px`, left: `${slot.armor.x}px` }"
        :src="buildingSvg"
        @click="cycle('armor', name)"
      />
    </template>
  </div>
</template>
