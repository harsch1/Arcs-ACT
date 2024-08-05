<script setup lang="ts">
import { computed } from 'vue'

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

import SystemDialog from '@/components/SystemDialog.vue'
import { BuildingType, Color, SHIP } from '@/Archive'
import type { ShipType } from '@/Archive'
import type { SystemId } from '@/stores/systems'

type PieceType = BuildingType | ShipType

const props = defineProps<{
  activeSystem: SystemId
  isOpen: boolean
  pointerPosition: {
    x: number
    y: number
  }
}>()

const emit = defineEmits<{
  update: [value: boolean]
  select: [type: PieceType, color: Color]
  close: []
}>()

const triggerStyle = computed(() => ({
  left: `${props.pointerPosition.x}px`,
  top: `${props.pointerPosition.y}px`
}))

function onOpenChange(e: boolean) {
  emit('update', e)
}

function onSelect(type: PieceType, color: Color) {
  emit('select', type, color)
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
      <DropdownMenuLabel>{{ $t('system_id', { id: activeSystem }) }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {{ $t('system_menu.add_ship') }}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            v-for="color in Color"
            :key="color"
            :class="{ hidden: color == Color.free }"
            @select="onSelect(SHIP, color)"
          >
            {{ $t(`colors.${color}`) }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {{ $t('system_menu.add_city') }}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <!-- Hide the empire color from cities -->
          <DropdownMenuItem
            v-for="color in Color"
            :key="color"
            :class="{ hidden: color == Color.empire }"
            @select="onSelect(BuildingType.city, color)"
          >
            {{ $t(`colors.${color}`) }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {{ $t('system_menu.add_starport') }}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <!-- Hide the empire color from starports -->
          <DropdownMenuItem
            v-for="color in Color"
            :key="color"
            :class="{ hidden: color == Color.empire }"
            @select="onSelect(BuildingType.starport, color)"
          >
            {{ $t(`colors.${color}`) }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem>{{ $t('system_menu.add_token') }}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <SystemDialog
        :system-id="activeSystem"
        @confirm="$emit('close')"
      >
        <DropdownMenuItem @select.prevent>
          {{ $t('system_menu.configure') }}
        </DropdownMenuItem>
      </SystemDialog>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>
.dropdown-trigger {
  width: 1px;
  height: 1px;
}
</style>
