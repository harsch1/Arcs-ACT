<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import boardImage from '@/assets/images/board-2.jpg'
import systemsUiConfig from '@/lib/systems-ui-config'
import { useSystemsStore } from '@/stores/systems'
import { pausableFilter, useWindowSize, useMouse } from '@vueuse/core'

import SystemComponent from '@/components/game/shapes/SystemComponent'
import GamePiece from '@/components/GamePiece.vue'
import GameBoardMenu from '@/components/ui/GameBoardMenu.vue'
import GamePieceMenu from '@/components/ui/GamePieceMenu.vue'

import type { CSSProperties } from 'vue'
import { BuildingType } from '@/Archive'

const dragControl = pausableFilter()
dragControl.pause()
const { x: dx, y: dy } = useMouse({ type: 'movement', eventFilter: dragControl.eventFilter })
const menuPosition: { x: number; y: number } = reactive({ x: 0, y: 0 })
const wrapperPosition: { x: number; y: number } = reactive({ x: 0, y: 0 })

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
const activeSystem = ref('')
const activePiece = ref<null | Record<string, unknown>>(null)

function onClick(id: string, e: PointerEvent) {
  if (isBoardMenuOpen.value) {
    return
  }

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

// Piece handling
const systemsStore = useSystemsStore()

function onPieceClick(piece: any, e: PointerEvent) {
  menuPosition.x = e.clientX
  menuPosition.y = e.clientY
  activePiece.value = piece
  isPieceMenuOpen.value = true
}

function addPiece(type: BuildingType, color?: string) {
  if (activeSystem.value === null) {
    return
  }

  systemsStore.addPiece(
    activeSystem.value,
    {
      type,
      color
    },
    menuPosition
  )
}

function removePiece() {
  systemsStore.removePiece(activePiece.value)
}

function flipPiece() {
  systemsStore.flipPiece(activePiece.value)
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
      @click="onClick"
      @mounted="(value) => systemsStore.setSystemUi(system.id, value)"
    />

    <GamePiece
      v-for="piece in systemsStore.pieces"
      :id="`${piece.type}${piece.color ? `-${piece.color}` : ''}-${piece.system}`"
      :key="piece.id"
      :piece-config="piece"
      :system-position="systemsStore.systemUi(piece.system, 'position')"
      @click="onPieceClick(piece, $event)"
      draggable="false"
    />
    <!-- <GamePiece v-for="(piece, index) in pieces" :key="index" :type="piece.type" :color="piece.color"
      :position="piece.position" /> -->
  </div>

  <!-- The dropdown is reused based on the clicked system -->
  <GameBoardMenu
    :active-system="activeSystem"
    :is-open="isBoardMenuOpen"
    :pointer-position="menuPosition"
    @select="addPiece"
    @update="onOpenChange"
    @close="isBoardMenuOpen = false"
  />

  <!-- The dropdown is reused based on the clicked piece -->
  <GamePieceMenu
    :active-piece="activePiece"
    :is-open="isPieceMenuOpen"
    :pointer-position="menuPosition"
    @select="addPiece"
    @remove="removePiece"
    @flip="flipPiece"
    @update="onPieceOpenChange"
  />
</template>
j
