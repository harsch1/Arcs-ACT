<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import boardImage from '@/assets/images/board-2.jpg'
import systemsUiConfig from '@/lib/systems-ui-config'
import { useSystemsStore } from '@/stores/systems'
import { pausableFilter, useMouse } from '@vueuse/core'

import { BuildingType } from '@/Archive'
import SystemComponent from '@/components/game/shapes/SystemComponent'
import GamePiece from '@/components/GamePiece.vue'
import GameBoardMenu from '@/components/GameBoardMenu.vue'
import GamePieceMenu from '@/components/GamePieceMenu.vue'

import { ShipType, type Color, type SystemKey, type TokenType } from '@/Archive'
import type { PieceState, SystemUiConfig, PieceStateGroup, SystemConfig } from '@/stores/systems'
import type { CSSProperties } from 'vue'
import { transform } from 'lodash'

const dragControl = pausableFilter()
dragControl.pause()
const { x: dx, y: dy } = useMouse({ type: 'movement', eventFilter: dragControl.eventFilter })
const menuPosition: { x: number; y: number } = reactive({ x: 0, y: 0 })
const wrapperPosition: { x: number; y: number } = reactive({ x: 0, y: 0 })
const systemClientPosition: { x: number; y: number } = reactive({ x: 0, y: 0 })

const draggedPiece = ref<PieceState | PieceStateGroup>()
const draggedPieceOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 })

const wrapperStyle = computed<CSSProperties>(() => ({
  width: 'max-content',
  transform: `translate(${wrapperPosition.x}px, ${wrapperPosition.y}px)`
}))

// Handle board movement
const wrapperEl = ref<HTMLDivElement>()

function onPieceMoveEnd(piece: PieceState | PieceStateGroup, e: DragEvent) {
  const boardRect = wrapperEl.value?.getBoundingClientRect()!

  piece.position.x = e.clientX - draggedPieceOffset.value.x + boardRect.x * -1
  piece.position.y = e.clientY - draggedPieceOffset.value.y + boardRect.y * -1
  draggedPiece.value = undefined
}

function onPieceMoveStart(piece: PieceState | PieceStateGroup, e: DragEvent) {
  const targetRect = (e.target as HTMLElement)?.getBoundingClientRect()

  draggedPiece.value = piece
  draggedPieceOffset.value = {
    x: e.clientX - targetRect.x - targetRect.width / 2,
    y: e.clientY - targetRect.y - targetRect.height / 2
  }
}

// Menus interaction
const isBoardMenuOpen = ref(false)
const isPieceMenuOpen = ref(false)
const activeSystem = ref<SystemKey>()
const activePiece = ref<PieceState | PieceStateGroup>()
const activeSystemPosition = computed(() =>
  activeSystem.value
    ? (systemsStore.systemUi(activeSystem.value, 'position') as SystemConfig['position'])
    : undefined
)

function onSystemClick(id: SystemKey, e: PointerEvent) {
  let systemRect = (e.target as SVGElement | null)?.getBoundingClientRect() ?? { x: 0, y: 0 }
  systemClientPosition.x = systemRect.x
  systemClientPosition.y = systemRect.y
  menuPosition.x = e.clientX
  menuPosition.y = e.clientY
  activeSystem.value = id
  isBoardMenuOpen.value = true
}

function onPieceOpenChange(e: boolean) {
  setTimeout(() => {
    isPieceMenuOpen.value = e
  })
}

function closeBoardMenu() {
  // Wrapped in a timeout to prevent opening the menu after clicking
  // on a system when the menu was already opened
  setTimeout(() => {
    isBoardMenuOpen.value = false
    activeSystem.value = undefined
  })
}

// Piece handling
const groupPieces = ref(true)
const systemsStore = useSystemsStore()

const pieces = computed(() => {
  if (!groupPieces.value) {
    return systemsStore.pieces
  }

  const grouped = new Map<string, PieceState | PieceStateGroup>()
  systemsStore.pieces.forEach((piece) => {
    const key = `${piece.system} ${piece.color} ${piece.type}`
    // Buildings and Flagships are not grouped
    if (
      Object.values(BuildingType).includes(piece.type as BuildingType) ||
      piece.type === ShipType.flagship
    ) {
      grouped.set(key + piece.id, piece)
      return
    }

    const outerKeys = ['system', 'type', 'color', 'position']
    if (!grouped.has(key)) {
      grouped.set(
        key,
        // @ts-ignore
        transform(
          piece,
          (acc, v, k) => {
            if (outerKeys.includes(k)) {
              // @ts-ignore
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
          // @ts-ignore
          acc[k] = v
        }
      },
      { isFresh: true }
    )
    toAdd.isFresh ? _piece.group.fresh.push(toAdd) : _piece.group.damaged.push(toAdd)
  })

  return Array.from(grouped.values())
})

function onPieceClick(piece: PieceState | PieceStateGroup, i: number, e: PointerEvent) {
  menuPosition.x = e.clientX
  menuPosition.y = e.clientY
  activePiece.value = piece
  activePieceIndex.value = i
  activeSystem.value = piece.system
  isPieceMenuOpen.value = true
}

function addPiece(type: BuildingType | ShipType | TokenType, color?: Color) {
  if (!activeSystem.value) {
    return
  }

  // Scroll offsets to be added
  let { x, y } = wrapperEl.value!.getBoundingClientRect()

  systemsStore.addPiece(
    activeSystem.value,
    {
      type,
      // @ts-ignore
      color
    },
    {
      x: menuPosition.x - x,
      y: menuPosition.y - y
    }
  )
}

function removePiece(isFresh: boolean) {
  if (activePiece.value) {
    systemsStore.removePiece(activePiece.value, isFresh)
  }
}

function flipPiece(isFresh: boolean) {
  if (activePiece.value) {
    systemsStore.flipPiece(activePiece.value, isFresh)
  }
}

function dropInSystem(system: SystemKey) {
  if (draggedPiece.value) {
    systemsStore.movePiece(draggedPiece.value, system)
  }
}

const activePieceIndex = ref<number>(-1)
const showPreview = ref(false)
function togglePreview(open: boolean) {
  activePieceIndex.value = open ? activePieceIndex.value : -1
  showPreview.value = open
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
      @dragover.prevent.stop
      @drop="dropInSystem(system.id)"
    />

    <GamePiece
      v-for="(piece, i) in pieces"
      :key="`${piece.type}${piece.color ? `-${piece.color}` : ''}-${piece.system}`"
      :piece-config="piece"
      :system-position="activeSystemPosition"
      :open-preview="showPreview && activePieceIndex === i"
      draggable="false"
      @click="onPieceClick(piece, i, $event)"
      @dragstart="onPieceMoveStart(piece, $event)"
      @dragend="onPieceMoveEnd(piece, $event)"
      @previewClose="togglePreview(false)"
    />
  </div>

  <!-- The dropdown is reused based on the clicked system -->
  <GameBoardMenu
    v-if="activeSystem"
    :active-system="activeSystem"
    :is-open="isBoardMenuOpen"
    :is-full="systemsStore.isSystemFull(activeSystem)"
    :pointer-position="menuPosition"
    @select="addPiece"
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
    @preview="togglePreview(true)"
  />
</template>
j
