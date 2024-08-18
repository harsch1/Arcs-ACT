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
import { OnClickOutside } from '@vueuse/components'
import SystemDialog from '@/components/SystemDialog.vue'
import { BuildingType, Color, ShipType, TokenType } from '@/Archive'
import { useGameStore } from '@/stores/game'

import type { SystemKey } from '@/Archive'

type PieceType = BuildingType | ShipType | TokenType

const props = defineProps<{
  activeSystem: SystemKey
  isOpen: boolean
  isFull: boolean
  pointerPosition: {
    x: number
    y: number
  }
}>()

const emit = defineEmits<{
  update: [value: boolean]
  select: [type: PieceType, color?: Color]
  close: []
}>()

// Values to generate the UI
const gameStore = useGameStore()
const activeColors = computed(() => {
  if (gameStore.players.length > 0) {
    return gameStore.players.map((player) => player.color)
  }

  return Object.values(Color).filter((color) => color !== Color.free && color !== Color.empire)
})
const colorsWithBuildings = activeColors.value.concat(Color.free)
const colorsWithShips = activeColors.value.concat(Color.empire)

const triggerStyle = computed(() => ({
  left: `${props.pointerPosition.x}px`,
  top: `${props.pointerPosition.y}px`
}))

function onOpenChange(e: boolean) {
  emit('update', e)
}

function onSelect(type: PieceType, color?: Color) {
  emit('select', type, color)
  emit('close')
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
      <OnClickOutside :options="{ ignore: ['.system-dialog'] }" @trigger="emit('close')">
        <DropdownMenuLabel>{{ $t('system_id', { id: activeSystem }) }}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {{ $t('system_menu.add_ship') }}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              v-for="color in colorsWithShips"
              :key="color"
              @select="onSelect(ShipType.ship, color)"
            >
              {{ $t(`colors.${color}`) }}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {{ $t('system_menu.add_flagship') }}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              v-for="color in activeColors"
              :key="color"
              @select="onSelect(ShipType.flagship, color)"
            >
              {{ $t(`colors.${color}`) }}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            class="data-[disabled]:opacity-50"
            :disabled="isFull"
          >
            {{ $t('system_menu.add_city') }}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <!-- Hide the empire color from cities -->
            <DropdownMenuItem
              v-for="color in colorsWithBuildings"
              :key="color"
              @select="onSelect(BuildingType.city, color)"
            >
              {{ $t(`colors.${color}`) }}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            class="data-[disabled]:opacity-50"
            :disabled="isFull"
          >
            {{ $t('system_menu.add_starport') }}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <!-- Hide the empire color from starports -->
            <DropdownMenuItem
              v-for="color in colorsWithBuildings"
              :key="color"
              @select="onSelect(BuildingType.starport, color)"
            >
              {{ $t(`colors.${color}`) }}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {{ $t('system_menu.add_token') }}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              v-for="token in TokenType"
              :key="token"
              @select="onSelect(token)"
            >
              {{ $t(`pieces.${token}`) }}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <SystemDialog
          :system-id="activeSystem"
          @confirm="$emit('close')"
        >
          <DropdownMenuItem @select.prevent>
            {{ $t('system_menu.configure') }}
          </DropdownMenuItem>
        </SystemDialog>
      </OnClickOutside>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>
.dropdown-trigger {
  width: 1px;
  height: 1px;
}

.menu-entry[data-disabled] {
  color: gainsboro;
}
</style>
