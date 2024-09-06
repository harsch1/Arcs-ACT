<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import boardImage from '@/assets/images/board-2.jpg'
import systemsUiConfig from '@/lib/systems-ui-config'
import { useSystemsStore } from '@/stores/systems'
import { pausableFilter } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut } from 'lucide-vue-next'

import { BuildingType } from '@/Archive'
import SystemComponent from '@/components/game/shapes/SystemComponent'
import GamePiece from '@/components/GamePiece.vue'
import GameSystemMenu from '@/components/GameSystemMenu.vue'
import GamePieceMenu from '@/components/GamePieceMenu.vue'

import { ShipType, type Color, type SystemKey, type TokenType } from '@/Archive'
import type { PieceState, SystemUiConfig, PieceStateGroup, SystemConfig } from '@/stores/systems'
import type { CSSProperties } from 'vue'
import { transform } from 'lodash'
import { isBuilding, isToken, isUniqueToken } from '@/lib/utils'
import { Menu, useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const dragControl = pausableFilter()
dragControl.pause()

const draggedPiece = ref<PieceState | PieceStateGroup>()
const draggedPieceOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 })

// Handle board movement
const boardImg = ref<HTMLImageElement>(new Image())
boardImg.value.src = boardImage
const boardDimensions = reactive({
  width: 0,
  height: 0
})
const wrapperEl = ref<HTMLDivElement>()
const wrapperStyle = computed<CSSProperties>(() => {
  return {
    // width: 'max-content',
    // height: 'max-content',
    // transform: `translate(${wrapperPosition.x}px, ${wrapperPosition.y}px)`
    transformOrigin: 'top left',
    scale: uiStore.mapScale,
    width: boardDimensions.width * uiStore.mapScale,
    height: boardDimensions.height * uiStore.mapScale
  }
})

function onPieceMove(piece: PieceState | PieceStateGroup, e: DragEvent | Touch) {
  const boardRect = wrapperEl.value?.getBoundingClientRect()!

  piece.position.x =
    e.clientX / uiStore.mapScale -
    draggedPieceOffset.value.x +
    (boardRect.x / uiStore.mapScale) * -1
  piece.position.y =
    e.clientY / uiStore.mapScale -
    draggedPieceOffset.value.y +
    (boardRect.y / uiStore.mapScale) * -1
}

function onPieceMoveEnd(piece: PieceState | PieceStateGroup, e?: DragEvent | Touch) {
  // This shouldn't happen but guard it just in case
  if (!e) {
    return
  }

  const boardRect = wrapperEl.value?.getBoundingClientRect()!

  piece.position.x =
    e.clientX / uiStore.mapScale -
    draggedPieceOffset.value.x +
    (boardRect.x / uiStore.mapScale) * -1
  piece.position.y =
    e.clientY / uiStore.mapScale -
    draggedPieceOffset.value.y +
    (boardRect.y / uiStore.mapScale) * -1
  draggedPiece.value = undefined
}

function onPieceMoveStart(piece: PieceState | PieceStateGroup, e: DragEvent | Touch) {
  const targetRect = (e.target as HTMLElement)?.getBoundingClientRect()

  draggedPiece.value = piece
  draggedPieceOffset.value = {
    x: e.clientX - targetRect.x - (targetRect.width / 2) * uiStore.mapScale,
    y: e.clientY - targetRect.y - (targetRect.height / 2) * uiStore.mapScale
  }
}

function getDimensions() {
  boardDimensions.height = boardImg.value.height
  boardDimensions.width = boardImg.value.width
}

function zoom(delta: number) {
  uiStore.mapScale += delta

  if (uiStore.mapScale < 0.3) {
    uiStore.mapScale = 0.3
  } else if (uiStore.mapScale > 2) {
    uiStore.mapScale = 2
  }
}

// Menus interaction
const activeSystem = ref<SystemKey>()
const activePiece = ref<PieceState | PieceStateGroup>()
const activeSystemPosition = computed(() =>
  activeSystem.value
    ? (systemsStore.systemUi(activeSystem.value, 'position') as SystemConfig['position'])
    : undefined
)

function onSystemClick(id: SystemKey, e: PointerEvent) {
  activeSystem.value = id
  uiStore.updateMenu({
    type: Menu.System,
    id: id,
    position: {
      x: e.clientX,
      y: e.clientY
    }
  })
}

function closeMenu(type: Menu) {
  activeSystem.value = undefined
  activePiece.value = undefined
  activePieceIndex.value = -1

  setTimeout(() => {
    uiStore.updateMenu({ isOpen: false })
  }, 100)
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
    // Buildings, Flagships, and unique tokens are not grouped
    if (
      isBuilding(piece.type) ||
      piece.type === ShipType.flagship ||
      (isToken(piece.type) && isUniqueToken(piece.type))
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

function onPieceClick(piece: PieceState | PieceStateGroup, i: number, e: PointerEvent | Touch) {
  activePiece.value = piece
  activePieceIndex.value = i
  activeSystem.value = piece.system
  uiStore.updateMenu({
    type: Menu.Piece,
    id: i,
    position: {
      x: e.clientX,
      y: e.clientY
    }
  })
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
      x: uiStore.currentMenu.position.x / uiStore.mapScale - x / uiStore.mapScale,
      y: uiStore.currentMenu.position.y / uiStore.mapScale - y / uiStore.mapScale
      // x: menuPosition.x * 2 - x,
      // y: menuPosition.y * 2 - y - 64
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

function repositionPiece(piece: PieceState | PieceStateGroup, system: SystemKey) {
  const pieceSystem = systemsStore.systems[system]
  systemsStore.positionPiece(pieceSystem, piece)
}

function dropInSystem(system: SystemKey) {
  if (draggedPiece.value) {
    systemsStore.movePiece(draggedPiece.value, system, draggedPiece.value.position)
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
      @load="getDimensions"
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
      @reposition="repositionPiece(piece, $event)"
      @click="onPieceClick(piece, i, $event)"
      @preview-close="togglePreview(false)"
      @dragstart="onPieceMoveStart(piece, $event)"
      @dragend="onPieceMoveEnd(piece, $event)"
      @press-click="onPieceClick(piece, i, $event)"
      @press-start="onPieceMoveStart(piece, $event)"
      @press-move="onPieceMove(piece, $event)"
      @press-end="onPieceMoveEnd(piece, $event)"
      @press-drop="dropInSystem($event)"
    />
  </div>

  <!-- Map controls -->
  <div class="map-controls">
    <Button
      size="icon"
      variant="outline"
      @click="zoom(0.1)"
    >
      <ZoomIn />
    </Button>
    <Button
      size="icon"
      variant="outline"
      @click="zoom(-0.1)"
    >
      <ZoomOut />
    </Button>
  </div>

  <!-- The dropdown is reused based on the clicked system -->
  <GameSystemMenu
    v-if="activeSystem && uiStore.currentMenu.type === Menu.System"
    :active-system="activeSystem"
    :pointer-position="uiStore.currentMenu.position"
    @select="addPiece"
    @close="closeMenu(Menu.System)"
  />

  <!-- The dropdown is reused based on the clicked piece -->
  <GamePieceMenu
    v-if="activePiece && uiStore.currentMenu.type === Menu.Piece"
    :active-piece="activePiece"
    :pointer-position="uiStore.currentMenu.position"
    @add="addPiece"
    @remove="removePiece"
    @flip="flipPiece"
    @preview="togglePreview(true)"
    @close="closeMenu(Menu.Piece)"
  />
</template>

<style scoped>
.map-controls {
  @apply pb-safe-offset-2 px-safe-offset-2 right-0;
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: 68px;
}
</style>
