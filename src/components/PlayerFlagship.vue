<script lang="ts" setup>
import GamePiece from '@/components/GamePiece.vue'
import flagshipConfig from '@/lib/flagship-ui-config'
import buildingSvg from '@/components/game/shapes/building.svg?url'

import { BuildingType, type Color, type FlagshipState, type FlagshipSlot } from '@/Archive'
import { reactive, type CSSProperties } from 'vue'

defineProps<{
  color: Color
}>()

const emit = defineEmits<{
  update: [state: FlagshipState]
}>()

const flagshipState = reactive<FlagshipState>({})

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
</script>

<template>
  <div class="relative w-full overflow-auto flagship-wrapper">
    <div class="w-[967px]">
      <img src="/images/board-flagship.jpg" />
    </div>
    <template
      v-for="(config, slot) in flagshipState"
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
            color,
            position: flagshipConfig[slot][type]
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
