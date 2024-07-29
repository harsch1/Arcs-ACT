<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import shipsUiConfig from '@/lib/ships-ui-config'

import type { CSSProperties } from 'vue'
import { Token, SHIP } from '@/Archive'

const props = defineProps<{
  pieceConfig: {
    color: string
    type: string
    position: {
      x: number
      y: number
    }
    // Represent side of piece.
    // For ships/buildings is the same as
    // fresh = false / damaged = true
    isFlipped?: boolean
  }
  scale?: number
  systemPosition?: {
    x: number
    y: number
  }
}>()

const src = computed(() => {
  if (props.pieceConfig.type === SHIP) {
    return `/images/ship${props.pieceConfig.isFlipped ? '-flip' : ''}.png`
  }

  if (Object.values(Token).includes(props.pieceConfig.type)) {
    return `/images/${props.pieceConfig.type?.toLowerCase()}${props.pieceConfig.isFlipped ? '-flip' : ''}.png`
  }

  return `/images/${props.pieceConfig.type?.toLowerCase()}-${props.pieceConfig.color?.toLowerCase()}${props.pieceConfig.isFlipped ? '-flip' : ''}.png`
})

const styles: CSSProperties = reactive({
  left: 0,
  top: 0,
  filter: props.pieceConfig.type === SHIP ? shipsUiConfig[props.pieceConfig.color].filter : 'none',
  zIndex: props.pieceConfig.type === SHIP ? 1 : 'auto',
  transformOrigin: 'top left',
  transform: props.systemPosition
    ? `translate(${props.systemPosition.x}px, ${props.systemPosition.y}px) scale(${props.scale ?? 0.4}) translate(${props.pieceConfig.position.x}px, ${props.pieceConfig.position.y}px)`
    : `translate(${props.pieceConfig.position.x}px, ${props.pieceConfig.position.y}px) scale(${props.scale ?? 0.4})`
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
