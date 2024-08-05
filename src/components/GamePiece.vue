<script setup lang="ts">
import { computed, ref } from 'vue'
import { Token, SHIP } from '@/Archive'

import type { CSSProperties } from 'vue'
import type { PieceState, SystemConfig } from '@/stores/systems'

const props = defineProps<{
  pieceConfig: PieceState
  scale?: number
  systemPosition?: SystemConfig['position']
}>()

const src = computed(() => {
  if (props.pieceConfig.type === SHIP) {
    return `/images/${props.pieceConfig.color?.toLowerCase()}_ship.png`
  }

  if (Object.values(Token).includes(props.pieceConfig.type as Token)) {
    return `/images/${props.pieceConfig.type?.toLowerCase()}${props.pieceConfig.isFlipped ? '-flip' : ''}.png`
  }

  return `/images/${props.pieceConfig.color?.toLowerCase()}_${props.pieceConfig.type?.toLowerCase()}${props.pieceConfig.isFlipped ? '_flip' : ''}.png`
})

const transform = computed(() => {
  let value = props.systemPosition
    ? `translate(${props.systemPosition.x}px, ${props.systemPosition.y}px) scale(${props.scale ?? 0.4}) translate(${props.pieceConfig.position.x}px, ${props.pieceConfig.position.y}px)`
    : `translate(${props.pieceConfig.position.x}px, ${props.pieceConfig.position.y}px) scale(${props.scale ?? 0.4})`

  if (props.pieceConfig.type === SHIP && props.pieceConfig.isFlipped) {
    value = `${value} translate(100%, 100%) rotate(180deg)`
  }

  return value
})

const styles = computed<CSSProperties>(() => {
  return {
    left: 0,
    top: 0,
    zIndex: props.pieceConfig.type === SHIP ? 1 : 'auto',
    transformOrigin: 'top left',
    transform: transform.value
  }
})

const isFallback = ref(false)
function fallbackHandler() {
  isFallback.value = true
}
</script>

<template>
  <img
    v-if="!isFallback"
    class="absolute"
    :class="{ damaged: pieceConfig.isFlipped }"
    :src="src"
    :style="styles"
    @error="fallbackHandler"
  />
  <svg
    v-else
    class="absolute fallback"
    :style="styles"
    width="250"
    height="250"
  >
    <text
      x="50%"
      y="50%"
      textLength="200"
      lengthAdjust="spacingAndGlyphs"
      dominant-baseline="middle"
      text-anchor="middle"
    >
      {{ pieceConfig.type }}
    </text>
  </svg>
</template>

<style>
.fallback {
  background: white;
  border-radius: 50%;
  width: 250px;
  height: 250px;
  font-size: 4rem;
}
</style>
