<script setup lang="ts">
import { computed, ref } from 'vue'
import { TokenType, ShipType, Color, BuildingType } from '@/Archive'
import { Redo, Sparkles } from 'lucide-vue-next'

import type { CSSProperties } from 'vue'
import type { PieceState, PieceStateGroup, SystemConfig } from '@/stores/systems'

const props = defineProps<{
  pieceConfig: PieceState | PieceStateGroup
  scale?: number
  systemPosition?: SystemConfig['position']
  translate?: boolean
}>()

const src = computed(() => {
  if (props.pieceConfig.type === ShipType.ship) {
    return `/images/${props.pieceConfig.color?.toLowerCase()}_ship.png`
  }

  if ('group' in props.pieceConfig) {
    if (Object.values(TokenType).includes(props.pieceConfig.type as TokenType)) {
      return `/images/${props.pieceConfig.type?.toLowerCase()}.png`
    } else {
      // Nothing should get in here...
      return
    }
  }

  if (Object.values(TokenType).includes(props.pieceConfig.type as TokenType)) {
    return `/images/${props.pieceConfig.type?.toLowerCase()}${!props.pieceConfig.isFresh ? '_flip' : ''}.png`
  }

  return `/images/${props.pieceConfig.color?.toLowerCase()}_${props.pieceConfig.type?.toLowerCase()}${!props.pieceConfig.isFresh ? '_flip' : ''}.png`
})

const transform = computed(() => {
  const toTranslate = {
    x: props.pieceConfig.position.x,
    y: props.pieceConfig.position.y // Take navbar into account
  }

  let value = `translate(${toTranslate.x}px, ${toTranslate.y}px) scale(${props.scale ?? 0.4})`
  // First translate is to center the ship / token on the point
  // Buildings don't need this cause their slot is fixed
  // TODO: Normalize building slots position to account translation
  if (
    !Object.values<BuildingType | TokenType | ShipType>(BuildingType).includes(
      props.pieceConfig.type
    )
  ) {
    value = 'translate(-50%, -50%) ' + value
    // value += ' translate(-50%, -50%)'
  }

  // let value = props.systemPosition
  //   ? `translate(${props.systemPosition.x}px, ${props.systemPosition.y - 64}px) translate(${props.pieceConfig.position.x - props.systemPosition.x}px, ${props.pieceConfig.position.y - props.systemPosition.y}px) scale(${props.scale ?? 0.4})`
  //   : `translate(${props.pieceConfig.position.x}px, ${props.pieceConfig.position.y}px) scale(${props.scale ?? 0.4})`
  // let value = props.systemPosition
  //   ? `translate(${props.systemPosition.x}px, ${props.systemPosition.y}px) scale(${props.scale ?? 0.4}) translate(${props.pieceConfig.position.x}px, ${props.pieceConfig.position.y}px)`
  //   : `translate(${props.pieceConfig.position.x}px, ${props.pieceConfig.position.y}px) scale(${props.scale ?? 0.4})`

  if (
    props.pieceConfig.type === ShipType.ship &&
    'isFresh' in props.pieceConfig &&
    !props.pieceConfig.isFresh
  ) {
    value = `${value} translate(100%, 100%) rotate(180deg)`
  }

  return value
})

const styles = computed<CSSProperties>(() => {
  return {
    left: 0,
    top: 0,
    zIndex: props.pieceConfig.type === ShipType.ship ? 1 : 'auto',
    transform: transform.value
  }
})

const isFallback = ref(false)
function fallbackHandler() {
  isFallback.value = true
}
</script>

<template>
  <div
    class="absolute"
    :style="styles"
  >
    <img
      v-if="!isFallback"
      :src="src"
      :width="pieceConfig.color === Color.free ? 300 : undefined"
      @error="fallbackHandler"
    />
    <svg
      v-else
      class="absolute fallback"
      width="250"
      height="250"
      :data-src="src"
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
    <div
      v-if="'group' in pieceConfig"
      class="absolute flex items-center right-10 -bottom-6"
    >
      <div class="flex items-center px-4 py-2 bg-black rounded-xl">
        <span class="mr-2 text-5xl">{{ pieceConfig.system }}</span>
      </div>
      <div
        v-if="pieceConfig.group.damaged.length > 0"
        class="flex items-center px-4 py-2 ml-2 bg-black rounded-xl"
      >
        <span class="mr-2 text-5xl">{{ pieceConfig.group.damaged.length }}</span>
        <Redo :size="40" />
      </div>
      <div
        v-if="pieceConfig.group.fresh.length > 0"
        class="flex items-center px-4 py-2 ml-2 bg-black rounded-xl"
      >
        <span class="mr-2 text-5xl">{{ pieceConfig.group.fresh.length }}</span>
        <Sparkles :size="40" />
      </div>
    </div>
  </div>
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
