<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'

import { BuildingType, Color, SHIP } from '@/Archive'

const props = defineProps<{
  activePiece: Record<string, unknown>
  isOpen: boolean
  pointerPosition: {
    x: number
    y: number
  }
}>()

const emit = defineEmits<{
  update: [value: boolean]
  select: [type: BuildingType, color: Color]
  remove: []
  flip: []
}>()

const { t } = useI18n()

const triggerStyle = computed(() => ({
  left: `${props.pointerPosition.x}px`,
  top: `${props.pointerPosition.y}px`
}))
// For some reason i18n modifiers are not working with variables
const pieceId = computed(() => {
  const color = t(`colors.${props.activePiece.color}`)
  const type = t(`pieces.${props.activePiece.type}`)
  const str = props.activePiece.color ? `${color} ${type}` : type
  return `${str.charAt(0).toUpperCase()}${str.slice(1).toLowerCase()}`
})

function onOpenChange(e: boolean) {
  emit('update', e)
}

function onSelect(type: BuildingType, color: Color) {
  emit('select', type, color)
}

function onFlip() {
  emit('flip')
}

function onRemove() {
  emit('remove')
}
</script>

<template>
  <DropdownMenu
    :open="isOpen"
    @update:open="onOpenChange"
  >
    <DropdownMenuTrigger
      class="fixed dropdown-trigger"
      :style="triggerStyle"
    ></DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>{{ pieceId }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {{ $t('piece_menu.change_color') }}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem @select="onSelect(BuildingType.city, Color.blue)">
            {{ $t('colors.blue') }}
          </DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.red') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.white') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.yellow') }}</DropdownMenuItem>
          <DropdownMenuItem @select="onSelect(BuildingType.city, Color.free)">
            {{ $t('colors.free') }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {{ $t('piece_menu.change_token') }}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>{{ $t('colors.blue') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.red') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.white') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.yellow') }}</DropdownMenuItem>
          <DropdownMenuItem @select="onSelect(BuildingType.starport, Color.free)">
            {{ $t('colors.free') }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem
        v-if="activePiece.type === BuildingType.city || activePiece.type === BuildingType.starport"
        @select="onFlip"
        >{{
          activePiece.isFlipped
            ? $t('piece_menu.repair_building')
            : $t('piece_menu.damage_building')
        }}</DropdownMenuItem
      >
      <DropdownMenuItem
        v-else-if="activePiece.type === SHIP"
        @select="onFlip"
        >{{
          activePiece.isFlipped ? $t('piece_menu.repair_ship') : $t('piece_menu.damage_ship')
        }}</DropdownMenuItem
      >
      <DropdownMenuItem
        v-else
        @select="onFlip"
        >{{ $t('piece_menu.flip') }}</DropdownMenuItem
      >
      <DropdownMenuItem @select="onRemove">{{ $t('piece_menu.remove_piece') }}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>
.dropdown-trigger {
  width: 1px;
  height: 1px;
}
</style>
