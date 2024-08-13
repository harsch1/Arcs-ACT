<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import columns from '@/components/deck-builder/columns'
import DeckBuilderTable from '@/components/deck-builder/DeckBuilderTable.vue'
import { gameDecks } from '@/lib/utils'

const props = defineProps<{
  // Types of cards to limit the selection to
  tags?: string[]
}>()

const gameStore = useGameStore()

// Filter by act number and also by 'tags' if present
const filteredDeck = computed(() => {
  // Track changes on location
  Array.from(gameStore.settings.cardPool.values()).map((c) => c.location)

  const filtered = Array.from(gameStore.settings.cardPool.values()).filter(
    (card) => !card.meta?.act || card.meta.act <= gameStore.settings.act
  )

  if (!props.tags) {
    return filtered
  }

  return filtered.filter((card) => card.tags?.some((tag) => props.tags?.includes(tag)))
})

const locations = computed(() =>
  gameDecks.concat(gameStore.players.map((player) => player.name)).filter((value) => !!value)
)

function onMove(id: string, location: string) {
  gameStore.moveCardTo(id, location)
}

onMounted(() => {
  gameStore.initCardPool()
})

// watchEffect(() => {
//   // Here to track changes
//   gameStore.settings.deck.court.keys()
//   gameStore.settings.deck.scrap.keys()
//   gameStore.settings.deck.edicts.keys()
//   gameStore.settings.deck.rules.keys()

//   deck.value = Array.from(gameStore.settings.cardPool.values())
// })
</script>

<template>
  <DeckBuilderTable
    :columns="columns"
    :data="filteredDeck"
    :locations="locations"
    @move="onMove"
  ></DeckBuilderTable>
</template>
