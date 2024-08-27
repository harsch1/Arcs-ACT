<script setup lang="ts">
import { ArrowRightLeft, SquareX, SquarePlus, SquareMinus } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { capitalize } from 'lodash'
import type { GameCard } from '@/stores/cards'

defineProps<{
  card: GameCard
  locations: string[]
  shortcut?: string
}>()

const emit = defineEmits<{
  move: [id: string, location: string]
}>()
</script>

<template>
  <Button
    variant="ghost"
    class="w-8 h-8 p-0"
    @click="emit('move', card.id, 'scrap')"
  >
    <SquareX class="w-4 h-4" />
  </Button>

  <template v-if="shortcut">
    <Button
      v-if="card.location !== shortcut"
      variant="ghost"
      class="w-8 h-8 p-0"
      @click="emit('move', card.id, shortcut)"
    >
      <SquarePlus class="w-4 h-4" />
    </Button>
    <Button
      v-else
      variant="ghost"
      class="w-8 h-8 p-0"
      @click="emit('move', card.id, 'court')"
    >
      <SquareMinus class="w-4 h-4" />
    </Button>
  </template>

  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="w-8 h-8 p-0"
      >
        <span class="sr-only">{{ $t('deck_builder.move_to') }}</span>
        <ArrowRightLeft class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>{{ $t('deck_builder.move_to') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="location in locations"
        :key="location"
        @click="emit('move', card.id, location)"
      >
        {{ capitalize(location) }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
