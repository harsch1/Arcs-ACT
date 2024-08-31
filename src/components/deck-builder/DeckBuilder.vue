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
import list from '@/components/deck-builder/list'
import DeckBuilderTable from '@/components/deck-builder/DeckBuilderTable.vue'
import DeckBuilderList from '@/components/deck-builder/DeckBuilderList.vue'
import { I18nT } from 'vue-i18n'

const props = defineProps<{
  // Types of cards to limit the selection to
  tags?: string[]
  excludeTags?: string[]
  title?: string
  description?: string
  // Add a button for this location
  shortcut?: string
}>()

onMounted(() => {
  cardsStore.initPool()
})

const gameStore = useGameStore()
const cardsStore = useCardsStore()
const assignAlertOpen = ref(false)
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

const shortcut = computed(() => {
  if (!(props.shortcut && locations.value.includes(props.shortcut))) {
    return undefined
  }

  return props.shortcut
})

function onMove(id: string, location: string) {
  cardsStore.moveCardTo(id, location)
}

async function assignCards() {
  result.value = await cardsStore.autoAssign()
  assignAlertOpen.value = true
}
</script>

<template>
  <p
    v-if="title"
    class="w-full py-2 text-lg"
  >
    {{ title }}
  </p>

  <p
    v-if="description"
    class="w-full py-2 text-md"
  >
    {{ description }}
  </p>

  <p>
    <Button
      variant="secondary"
      @click="assignAlertOpen = true"
    >
      {{ $t('deck_builder.assign') }}
    </Button>
  </p>

  <DeckBuilderList
    :columns="list"
    :data="filteredDeck"
    :locations="locations"
    :shortcut="shortcut"
    @move="onMove"
  />

  <!-- <DeckBuilderTable
    :columns="columns"
    :data="filteredDeck"
    :locations="locations"
    :shortcut="shortcut"
    @move="onMove"
  /> -->

  <AlertDialog v-model:open="assignAlertOpen">
    <!-- <AlertDialogTrigger>Open</AlertDialogTrigger> -->
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ $t('deck_builder.assign') }}
        </AlertDialogTitle>

        <AlertDialogDescription>
          <p class="mb-4 text-left">{{ $t('deck_builder.assign_help') }}</p>

          <i18n-t
            keypath="deck_builder.assign_action"
            tag="p"
            class="text-left"
          >
            <template #action>
              <Button
                variant="secondary"
                size="sm"
                class="mx-2"
                @click="assignCards()"
              >
                {{ $t('deck_builder.assign') }}
              </Button>
            </template>
          </i18n-t>

          <div
            v-if="result"
            class="text-left"
          >
            <p class="mt-4 text-lg font-bold">{{ $t('deck_builder.result') }}</p>
            <ul>
              <li
                v-for="(log, i) in result"
                :key="i"
                v-html="log"
                class="capitalize"
              ></li>
            </ul>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>{{ $t('common.close') }}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
