<script setup lang="ts">
// @ts-nocheck TODO: Need to generate types for the system instead of using typeof on the JSON
import { computed, reactive, ref, watch } from 'vue'
import boardImage from '@/assets/images/board-2.jpg'
import systemsUiConfig from '@/lib/systems-ui-config'
import { useSystemsStore } from '@/stores/systems'
import { pausableFilter, useWindowSize, useMouse, useElementBounding } from '@vueuse/core'

import { BuildingType, SHIP, Token } from '@/Archive'
import SystemComponent from '@/components/game/shapes/SystemComponent'
import GamePiece from '@/components/GamePiece.vue'
import GameBoardMenu from '@/components/GameBoardMenu.vue'
import GamePieceMenu from '@/components/GamePieceMenu.vue'

import type { ShipType } from '@/Archive'
import type { PieceState, SystemUiConfig, SystemId, PieceStateGroup } from '@/stores/systems'
import type { CSSProperties } from 'vue'
import { transform } from 'lodash'

const dragControl = pausableFilter()
dragControl.pause()
const { x: dx, y: dy } = useMouse({ type: 'movement', eventFilter: dragControl.eventFilter })
const menuPosition: { x: number; y: number } = reactive({ x: 0, y: 0 })
const wrapperPosition: { x: number; y: number } = reactive({ x: 0, y: 0 })
const systemClientPosition: { x: number; y: number } = reactive({ x: 0, y: 0 })

const wrapperStyle = computed<CSSProperties>(() => ({
  width: 'max-content',
  transform: `translate(${wrapperPosition.x}px, ${wrapperPosition.y}px)`
}))

// Handle board movement
const { width, height } = useWindowSize()
const wrapperEl = ref<HTMLDivElement>()
watch([dx, dy], ([movX, movY]) => {
  if (!wrapperEl.value) {
    return
  }

  const { width: w, height: h } = wrapperEl.value.getBoundingClientRect()
  // Max you can drag in X axis
  const maxX = w - width.value
  // Max you can drag in Y axis, takes into account nav bar
  const maxY = h - height.value + 64

  // Prevent overdragging
  if (maxX + wrapperPosition.x < 0) {
    // Negative due the direction
    wrapperPosition.x = -maxX
  }

  if (wrapperPosition.x > 0) {
    // Negative due the direction
    wrapperPosition.x = 0
  }

  if (maxY + wrapperPosition.y < 0) {
    // Negative due the direction
    wrapperPosition.y = -maxY
  }

  if (wrapperPosition.y > 0) {
    // Negative due the direction
    wrapperPosition.y = 0
  }

  wrapperPosition.x += movX
  wrapperPosition.y += movY
})

function dragMapStart() {
  dragControl.resume()
}

function dragMapEnd() {
  dragControl.pause()
}

// Menus interaction
const isBoardMenuOpen = ref(false)
const isPieceMenuOpen = ref(false)
const activeSystem = ref<SystemId | null>(null)
const activePiece = ref<PieceState | PieceStateGroup | null>(null)
const activeSystemPosition = computed(() =>
  activeSystem.value ? systemsStore.systemUi(activeSystem.value, 'position') : undefined
)

function onSystemClick(id: SystemId, e: PointerEvent) {
  if (isBoardMenuOpen.value) {
    return
  }

  let systemRect = (e.target as SVGElement | null)?.getBoundingClientRect() ?? { x: 0, y: 0 }
  systemClientPosition.x = systemRect.x
  systemClientPosition.y = systemRect.y
  menuPosition.x = e.clientX
  menuPosition.y = e.clientY
  activeSystem.value = id
  isBoardMenuOpen.value = true
}

function onOpenChange(e: boolean) {
  isBoardMenuOpen.value = e
}

function onPieceOpenChange(e: boolean) {
  isPieceMenuOpen.value = e
}

function closeBoardMenu() {
  isBoardMenuOpen.value = false
  activeSystem.value = null
}

// Piece handling
const groupPieces = ref(true)
const systemsStore = useSystemsStore()

const pieces = computed(
  () => {
    if (!groupPieces.value) {
      return systemsStore.pieces
    }

    const grouped = new Map<string, PieceState | PieceStateGroup>()
    systemsStore.pieces.forEach((piece) => {
      const key = `${piece.system} ${piece.color} ${piece.type}`
      // Buildings are not grouped
      if (Object.values(BuildingType).includes(piece.type)) {
        grouped.set(key + piece.id, piece)
        return
      }

      const outerKeys = ['system', 'type', 'color', 'position']
      if (!grouped.has(key)) {
        grouped.set(
          key,
          transform(
            piece,
            (acc, v, k) => {
              if (outerKeys.includes(k)) {
                acc[k] = v
              }
            },
            {
              group: { damaged: [], fresh: [] }
            }
          )
        )
      }

      const innerKeys = ['id', 'isFresh']
      const _piece = grouped.get(key) as PieceStateGroup
      const toAdd = transform(
        piece,
        (acc, v, k) => {
          if (innerKeys.includes(k)) {
            acc[k] = v
          }
        },
        { isFresh: true }
      )
      toAdd.isFresh ? _piece.group.fresh.push(toAdd) : _piece.group.damaged.push(toAdd)
    })

    return Array.from(grouped.values())
  },
  {
    onTrack(e) {
      console.log('track', e)
    },
    onTrigger(e) {
      console.log('trigger', e)
    }
  }
)

function onPieceClick(piece: PieceState | PieceStateGroup, e: PointerEvent) {
  menuPosition.x = e.clientX
  menuPosition.y = e.clientY
  activePiece.value = piece
  activeSystem.value = piece.system
  isPieceMenuOpen.value = true
}

function addPiece(type: BuildingType | ShipType, color?: string) {
  if (activeSystem.value === null) {
    return
  }

  // Scroll offsets to be added
  let { x, y } = wrapperEl.value!.getBoundingClientRect()

  systemsStore.addPiece(
    activeSystem.value,
    {
      type,
      color
    },
    {
      x: menuPosition.x - x,
      y: menuPosition.y - y
    }
  )
}

function removePiece() {
  if (activePiece.value !== null) {
    systemsStore.removePiece(activePiece.value)
  }
}

function flipPiece(isFresh: boolean) {
  if (activePiece.value !== null) {
    systemsStore.flipPiece(activePiece.value, isFresh)
  }
}
</script>

<template>
  <div
    ref="wrapperEl"
    id="game-wrapper"
    class="select-none"
    :style="wrapperStyle"
  >
    <img
      :src="boardImage"
      alt="Arcs"
      class="max-w-max"
      draggable="false"
    />
    <SystemComponent
      v-for="system in systemsUiConfig"
      :key="system.id"
      :system-config="system"
      :position="system.position"
      class="absolute system"
      draggable="false"
      @click="onSystemClick"
      @mounted="(value: SystemUiConfig) => systemsStore.setSystemUi(system.id, value)"
    />

    <GamePiece
      v-for="piece in pieces"
      :id="`${piece.type}${piece.color ? `-${piece.color}` : ''}-${piece.system}`"
      :key="piece.id"
      :piece-config="piece"
      :system-position="activeSystemPosition"
      @click="onPieceClick(piece, $event)"
      draggable="false"
    />
    <!-- <GamePiece v-for="(piece, index) in pieces" :key="index" :type="piece.type" :color="piece.color"
      :position="piece.position" /> -->
  </div>

  <!-- The dropdown is reused based on the clicked system -->
  <GameBoardMenu
    v-if="activeSystem"
    :active-system="activeSystem"
    :is-open="isBoardMenuOpen"
    :pointer-position="menuPosition"
    @select="addPiece"
    @update="onOpenChange"
    @close="closeBoardMenu"
  />

  <!-- The dropdown is reused based on the clicked piece -->
  <GamePieceMenu
    v-if="activePiece"
    :active-piece="activePiece"
    :is-open="isPieceMenuOpen"
    :pointer-position="menuPosition"
    @add="addPiece"
    @remove="removePiece"
    @flip="flipPiece"
    @update="onPieceOpenChange"
  />
</template>
j
