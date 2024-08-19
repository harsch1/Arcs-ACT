<script setup lang="ts">
import { computed, ref } from 'vue'
import { TokenType, ShipType, Color, BuildingType } from '@/Archive'
import { Redo, Sparkles } from 'lucide-vue-next'
import PlayerFlagshipPreview from '@/components/PlayerFlagshipPreview.vue'

import type { CSSProperties } from 'vue'
import type { PieceState, PieceStateGroup, SystemConfig } from '@/stores/systems'
import { isBuilding } from '@/lib/utils'
import { isFlagship } from '@/lib/utils'

const props = defineProps<{
  pieceConfig: PieceState | PieceStateGroup
  scale?: number
  systemPosition?: SystemConfig['position']
  translate?: boolean
  openPreview?: boolean
}>()

const emit = defineEmits<{
  previewClose: []
}>()

const pieceId = computed(() => {
  if (props.pieceConfig.color) {
    return `${props.pieceConfig.type}-${props.pieceConfig.color}-${props.pieceConfig.system}`
  }

  return `${props.pieceConfig.type}-${props.pieceConfig.system}`
})

const src = computed(() => {
  if ('group' in props.pieceConfig) {
    if (Object.values(TokenType).includes(props.pieceConfig.type as TokenType)) {
      return `./images/${props.pieceConfig.type?.toLowerCase()}.png`
    }

    return `./images/${props.pieceConfig.color?.toLowerCase()}_${props.pieceConfig.type?.toLowerCase()}.png`
  }

  if (Object.values(TokenType).includes(props.pieceConfig.type as TokenType)) {
    return `./images/${props.pieceConfig.type?.toLowerCase()}${!props.pieceConfig.isFresh ? '_flip' : ''}.png`
  } else if (isFlagship(props.pieceConfig.type)) {
    return `./images/${props.pieceConfig.color?.toLowerCase()}_${props.pieceConfig.type?.toLowerCase()}.png`
  }

  return `./images/${props.pieceConfig.color?.toLowerCase()}_${props.pieceConfig.type?.toLowerCase()}${!props.pieceConfig.isFresh ? '_flip' : ''}.png`
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

const pieceWidth = computed(() => {
  if (props.pieceConfig.color === Color.free) {
    return 300
  }

  if (isFlagship(props.pieceConfig.type)) {
    return 332
  }

  return undefined
})

const isFallback = ref(false)
function fallbackHandler() {
  isFallback.value = true
}
</script>

<template>
  <div
    :id="pieceId"
    class="absolute"
    :style="styles"
  >
    <img
      v-if="!isFallback"
      :src="src"
      :width="pieceWidth"
      :draggable="!isBuilding(pieceConfig.type)"
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
      v-if="!isBuilding(pieceConfig.type)"
      class="absolute flex items-center right-10 -bottom-6"
    >
      <div class="grid grid-flow-col px-4 py-2 bg-black shrink-0 rounded-xl">
        <span class="mr-2 text-5xl">
          {{ pieceConfig.system?.charAt(0) }}
        </span>
        <img
          v-if="pieceConfig.system?.charAt(1) === 'A'"
          class="h-[3rem]"
          src="/images/symbol_arrow.png"
          alt="Arrow"
        />
        <img
          v-else-if="pieceConfig.system?.charAt(1) === 'H'"
          class="h-[3rem]"
          src="/images/symbol_hex.png"
          alt="Hex"
        />
        <img
          v-else-if="pieceConfig.system?.charAt(1) === 'C'"
          class="h-[3rem]"
          src="/images/symbol_moon.png"
          alt="Moon"
        />
        <span
          v-else
          class="mr-2 text-5xl"
        >
          G
        </span>
      </div>
      <template v-if="'group' in pieceConfig && !isFlagship(pieceConfig.type)">
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
      </template>
    </div>

    <PlayerFlagshipPreview
      v-if="isFlagship(pieceConfig.type) && openPreview"
      :piece="pieceConfig"
      :piece-id="pieceId"
      @close="emit('previewClose')"
    />
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
