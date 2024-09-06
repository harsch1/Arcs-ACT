<script setup lang="ts">
import { computed, onMounted, ref, toRef } from 'vue'
import { TokenType, ShipType, Color, BuildingType, type SystemKey } from '@/Archive'
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
  reposition: [system: SystemKey]
  previewClose: []
  pressClick: [e: Touch]
  pressStart: [e: Touch]
  pressMove: [e: Touch]
  pressEnd: [e?: Touch]
  pressDrop: [system: SystemKey]
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
      return `./images/tokens/${props.pieceConfig.type?.toLowerCase()}.png`
    }

    return `./images/${props.pieceConfig.color?.toLowerCase()}_${props.pieceConfig.type?.toLowerCase()}.png`
  }

  if (Object.values(TokenType).includes(props.pieceConfig.type as TokenType)) {
    return `./images/tokens/${props.pieceConfig.type?.toLowerCase()}${!props.pieceConfig.isFresh ? '_flip' : ''}.png`
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

const firstTouch = ref<Touch>()
const lastTouch = ref<Touch>()
const touchTimer = ref<number>(0)
const ignoreMove = ref(true)
const clickDelay = 300

function onPieceMoveStart(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  touchTimer.value = Date.now()
  firstTouch.value = touch
  emit('pressStart', touch)

  setTimeout(() => (ignoreMove.value = false), clickDelay)
}

function onPieceMove(e: TouchEvent) {
  if (ignoreMove.value) {
    return
  }

  e.preventDefault()
  const touch = e.touches[0]
  lastTouch.value = touch
  emit('pressMove', touch)
}

function onPieceMoveEnd(e: TouchEvent) {
  e.preventDefault()
  ignoreMove.value = true

  // Fake click event on mobile
  if (Date.now() - touchTimer.value < clickDelay) {
    e.stopPropagation()
    emit('pressClick', firstTouch.value!)
    return
  }

  const el =
    lastTouch.value &&
    document
      .elementsFromPoint(lastTouch.value.clientX, lastTouch.value.clientY)
      .find((el) => el.getAttribute('data-path-system-id'))

  // Piece was moved over a valid system
  if (el) {
    const system = el.getAttribute('data-path-system-id') as SystemKey
    emit('pressDrop', system)
  } else {
    emit('pressEnd', firstTouch.value)
  }
}

const canBeMoved = computed(() => {
  if (!isBuilding(props.pieceConfig.type)) {
    return true
  }

  if (!('group' in props.pieceConfig) && !props.pieceConfig.slot) {
    return true
  }

  return false
})

const eventHandlers = {
  touchstart: canBeMoved.value ? onPieceMoveStart : null,
  touchmove: canBeMoved.value ? onPieceMove : null,
  touchend: canBeMoved.value ? onPieceMoveEnd : null
}

onMounted(() => {
  // Negative position means the piece wasn't positioned when added
  if (props.pieceConfig.position.x < 0 && props.pieceConfig.position.y < 0) {
    emit('reposition', props.pieceConfig.system!)
  }
})
</script>

<template>
  <div
    :id="pieceId"
    class="absolute"
    :style="styles"
  >
    <img
      v-if="!isFallback"
      :style="{ maxWidth: 'initial' }"
      :src="src"
      :width="pieceWidth"
      :draggable="canBeMoved"
      v-on="eventHandlers"
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
      class="absolute flex items-center pointer-events-none right-10 -bottom-6"
    >
      <div class="grid grid-flow-col px-4 py-2 bg-black shrink-0 rounded-xl">
        <span class="mr-2 text-5xl">
          {{ props.pieceConfig.system?.charAt(0) }}
        </span>
        <img
          v-if="props.pieceConfig.system?.charAt(1) === 'A'"
          class="h-[3rem]"
          src="/images/symbol_arrow.png"
          alt="Arrow"
        />
        <img
          v-else-if="props.pieceConfig.system?.charAt(1) === 'H'"
          class="h-[3rem]"
          src="/images/symbol_hex.png"
          alt="Hex"
        />
        <img
          v-else-if="props.pieceConfig.system?.charAt(1) === 'C'"
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
          class="flex items-center px-4 py-2 ml-2 bg-black pointer-events-none rounded-xl"
        >
          <span class="mr-2 text-5xl">{{ pieceConfig.group.damaged.length }}</span>
          <Redo :size="40" />
        </div>
        <div
          v-if="pieceConfig.group.fresh.length > 0"
          class="flex items-center px-4 py-2 ml-2 bg-black pointer-events-none rounded-xl"
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
