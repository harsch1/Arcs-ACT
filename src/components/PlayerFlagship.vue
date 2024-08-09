<script lang="ts" setup>
// @ts-nocheck TODO: Type property when implementing Flagships
import GamePiece from '@/components/GamePiece.vue'
import flagshipConfig from '@/lib/flagship-ui-config'
import buildingSvg from '@/components/game/shapes/building.svg?url'

import { BuildingType, type Color } from '@/Archive'
import { reactive, type CSSProperties } from 'vue'

defineProps<{
  color: Color
}>()

type FlagshipSlot = keyof typeof flagshipConfig
type FlagshipState = {
  [slot in FlagshipSlot]: {
    upgrade: null | BuildingType
    armor: null | BuildingType
  }
}

const flagshipState = reactive<Partial<FlagshipState>>({})

const baseStyle: CSSProperties = {
  position: 'absolute',
  scale: 0.5
}

function cycle(type: 'upgrade' | 'armor', slot: FlagshipSlot) {
  // Ensure object is initialized
  if (flagshipState[slot] === null || flagshipState[slot] === undefined) {
    flagshipState[slot] = {
      armor: null,
      upgrade: null
    }
  }

  const building = flagshipState[slot][type]
  if (building === null || building === undefined) {
    flagshipState[slot][type] = BuildingType.city
  } else if (flagshipState[slot][type] === BuildingType.city) {
    flagshipState[slot][type] = BuildingType.starport
  } else {
    // flagshipState[slot][type] = null
    delete flagshipState[slot][type]
  }
}
</script>

<template>
  <img src="/images/board-flagship.jpg" />
  <template
    v-for="(config, slot) in flagshipState"
    :key="slot"
  >
    <GamePiece
      v-for="(building, type) in config"
      :key="`${slot}-${type}`"
      :scale="0.5"
      :piece-config="{ type: building, color: 'BLUE', position: flagshipConfig[slot][type] }"
    />
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
</template>
