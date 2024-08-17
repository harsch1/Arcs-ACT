<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'
import { useGameStore } from '@/stores/game'
import { OnClickOutside } from '@vueuse/components'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import PlayerFlagship from '@/components/PlayerFlagship.vue'

import type { PieceState, PieceStateGroup } from '@/stores/systems'
import type { Player } from '@/Archive'

const props = defineProps<{
  piece: PieceState | PieceStateGroup
  pieceId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const gameStore = useGameStore()

const pieceOwner = computed(() => {
  return gameStore.players.find((p) => p.color === props.piece.color)
})

const anchorStyle = computed<CSSProperties>(() => {
  return {
    position: 'absolute',
    top: `${224}px`,
    left: `${props.piece.position.x + 112}px`
  }
})

function updatePlayer(update: Partial<Player>) {
  if (!pieceOwner.value?.color) {
    return
  }

  const payload = {
    ...update,
    color: pieceOwner.value?.color
  }
  gameStore.updatePlayer(payload)
}
</script>

<template>
  <Popover :open="true">
    <PopoverAnchor :style="anchorStyle"></PopoverAnchor>
    <PopoverContent class="w-[484px] p-1">
      <OnClickOutside @trigger="emit('close')">
        <PlayerFlagship
          v-if="pieceOwner"
          :player="pieceOwner"
          @update="
            (value) =>
              updatePlayer({
                flagshipState: value
              })
          "
        />
      </OnClickOutside>
    </PopoverContent>
  </Popover>
</template>
