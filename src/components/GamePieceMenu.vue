<script setup lang="ts">
import { computed } from 'vue'
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
import { Redo, Sparkles } from 'lucide-vue-next'

import { Color, TokenType, type ShipType } from '@/Archive'
import type { PieceState, PieceStateGroup } from '@/stores/systems'

const props = defineProps<{
  activePiece: PieceState | PieceStateGroup
  isOpen: boolean
  pointerPosition: {
    x: number
    y: number
  }
}>()

const emit = defineEmits<{
  update: [value: boolean]
  // select: [type: BuildingType, color: Color]
  add: [type: TokenType | ShipType, color?: Color]
  remove: [isFresh: boolean]
  flip: [isFresh: boolean]
}>()

const { t } = useI18n()

const triggerStyle = computed(() => ({
  left: `${props.pointerPosition.x}px`,
  top: `${props.pointerPosition.y}px`
}))
// For some reason i18n modifiers are not working with variables
const pieceId = computed(() => {
  const color = t(`colors.${props.activePiece.color}`)
  const type = t(`pieces.${props.activePiece.type}`, 'group' in props.activePiece ? 2 : 1)
  const str = props.activePiece.color ? `${color} ${type}` : type
  return `${str.charAt(0).toUpperCase()}${str.slice(1).toLowerCase()}`
})

function onOpenChange(e: boolean) {
  emit('update', e)
}

// function onSelect(type: BuildingType, color: Color) {
//   emit('select', type, color)
// }

function onAdd() {
  if (props.activePiece.color) {
    emit('add', props.activePiece.type as ShipType, props.activePiece.color)
  } else {
    emit('add', props.activePiece.type as TokenType)
  }
}

function onRemove(isFresh: boolean = true) {
  emit('remove', isFresh)
}

function onFlip(isFresh: boolean = true) {
  emit('flip', isFresh)
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
      <!-- <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {{ $t('piece_menu.change_color') }}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem @select="onSelect(BuildingType.city, Color.blue)">
            {{ $t('colors.BLUE') }}
          </DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.RED') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.WHITE') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.YELLOW') }}</DropdownMenuItem>
          <DropdownMenuItem @select="onSelect(BuildingType.city, Color.free)">
            {{ $t('colors.FREE') }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub> -->
      <!-- <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {{ $t('piece_menu.change_token') }}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>{{ $t('colors.BLUE') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.RED') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.WHITE') }}</DropdownMenuItem>
          <DropdownMenuItem>{{ $t('colors.YELLOW') }}</DropdownMenuItem>
          <DropdownMenuItem @select="onSelect(BuildingType.starport, Color.free)">
            {{ $t('colors.FREE') }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub> -->
      <!-- PieceStateGroup menu -->
      <template v-if="'group' in activePiece">
        <DropdownMenuItem @select="onAdd">
          <Sparkles
            class="mr-2"
            :size="16"
          />
          {{ $t('piece_menu.add') }}
        </DropdownMenuItem>
        <DropdownMenuItem @select="onFlip(true)">
          <Sparkles
            class="mr-2"
            :size="16"
          />
          {{ $t('piece_menu.damage_fresh') }}
        </DropdownMenuItem>
        <DropdownMenuItem @select="onRemove(true)">
          <Sparkles
            class="mr-2"
            :size="16"
          />
          {{ $t('piece_menu.remove_fresh') }}
        </DropdownMenuItem>
        <DropdownMenuItem @select="onFlip(false)">
          <Redo
            class="mr-2"
            :size="16"
          />
          {{ $t('piece_menu.repair_damaged') }}
        </DropdownMenuItem>
        <DropdownMenuItem @select="onRemove(false)">
          <Redo
            class="mr-2"
            :size="16"
          />
          {{ $t('piece_menu.remove_damaged') }}
        </DropdownMenuItem>
      </template>
      <!-- PieceState menu -->
      <template v-else>
        <DropdownMenuItem @select="onFlip(activePiece.isFresh)">
          {{ activePiece.isFresh ? $t('piece_menu.damage') : $t('piece_menu.repair') }}
        </DropdownMenuItem>
        <DropdownMenuItem @select="onRemove">
          {{ $t('piece_menu.remove') }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>
.dropdown-trigger {
  width: 1px;
  height: 1px;
}
</style>
