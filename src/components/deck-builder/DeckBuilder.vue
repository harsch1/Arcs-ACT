<script lang="ts" setup>
import Button from '@/components/ui/button/Button.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { computed, onMounted, ref } from 'vue'
import { gameDecks } from '@/lib/utils'
import { useGameStore } from '@/stores/game'
import { useCardsStore } from '@/stores/cards'
import columns from '@/components/deck-builder/columns'
import DeckBuilderTable from '@/components/deck-builder/DeckBuilderTable.vue'

const props = defineProps<{
  // Types of cards to limit the selection to
  tags?: string[]
  excludeTags?: string[]
  title?: string
}>()

onMounted(() => {
  cardsStore.initPool()
})

const gameStore = useGameStore()
const cardsStore = useCardsStore()
const alertOpen = ref(false)
const result = ref()

// Filter by act number and also by 'tags' if present
const filteredDeck = computed(() => {
  // Track changes on location
  Array.from(cardsStore.pool.values()).map((c) => c.location)

  let filtered = Array.from(cardsStore.pool.values()).filter(
    (card) => !card.meta?.act || card.meta.act <= gameStore.settings.act
  )

  if (props.tags) {
    filtered = filtered.filter((card) => card.tags?.some((tag) => props.tags?.includes(tag)))
  }

  if (props.excludeTags) {
    filtered = filtered.filter((card) =>
      card.tags?.every((tag) => !props.excludeTags?.includes(tag))
    )
  }

  return filtered
})

const locations = computed(() =>
  gameDecks.concat(gameStore.players.map((player) => player.name)).filter((value) => !!value)
)

function onMove(id: string, location: string) {
  cardsStore.moveCardTo(id, location)
}

async function assignCards() {
  result.value = await cardsStore.autoAssign()
  alertOpen.value = true
}
</script>

<template>
  <p
    v-if="title"
    class="w-full py-2 text-lg"
  >
    {{ title }}
  </p>
  <Button @click="assignCards">ASSIGN</Button>

  <DeckBuilderTable
    :columns="columns"
    :data="filteredDeck"
    :locations="locations"
    @move="onMove"
  ></DeckBuilderTable>

  <AlertDialog v-model:open="alertOpen">
    <!-- <AlertDialogTrigger>Open</AlertDialogTrigger> -->
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ $t('deck_builder.result') }}</AlertDialogTitle>
        <AlertDialogDescription>
          <ul>
            <li
              v-for="(log, i) in result"
              :key="i"
              v-html="log"
              class="capitalize"
            ></li>
          </ul>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>{{ $t('common.close') }}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
