<script lang="ts" setup>
import {
  AlertDialog,
  // AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import Button from '@/components/ui/button/Button.vue'
import { Trash2, LoaderPinwheel } from 'lucide-vue-next'
import { GAME_SAVE_PREFIX, useGameStore } from '@/stores/game'
import { computed, ref } from 'vue'
import { format } from 'date-fns'
import { useI18n } from 'vue-i18n'

import type { ArchiveJSON } from '@/stores/game'

const emit = defineEmits<{
  loaded: []
}>()

const gameStore = useGameStore()
const { t } = useI18n()
const savedGames = computed(() => gameStore.savedGames)

const alertOpen = ref(false)
const loading = ref(false)
const selected = ref<string | null>(null)
const showTable = ref(true)
const raw = ref('')

const enableLoad = computed(() => {
  return showTable.value ? !!selected.value : !!raw.value
})

function getFriendlyId(id: string | null) {
  if (!id) {
    return ''
  }

  return id.slice(GAME_SAVE_PREFIX.length).replace(/_/g, ' ')
}

function getPlayers(archive: ArchiveJSON) {
  return archive.players.map((p) => p.name).join(', ')
}

async function loadSave() {
  // If the table is shown a save is being loaded, else a raw JSON
  const isRaw = !showTable.value

  if (loading.value || (!isRaw && !selected.value) || (isRaw && !raw.value)) {
    return
  }

  loading.value = true

  await gameStore.loadGame(isRaw ? raw.value! : selected.value!, isRaw)

  alertOpen.value = false
  loading.value = false

  emit('loaded')
}

function deleteSave(id: string) {
  if (confirm(t('load_dialog.are_you_sure?'))) {
    gameStore.deleteGame(id)
  }
}
</script>

<template>
  <AlertDialog v-model:open="alertOpen">
    <AlertDialogTrigger as-child>
      <slot></slot>
    </AlertDialogTrigger>
    <AlertDialogContent class="max-sm:h-full max-sm:w-full">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ $t('load_dialog.title') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ $t('load_dialog.help_text') }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <Table v-if="showTable">
        <!-- <TableCaption>A list of your recent games.</TableCaption> -->
        <TableHeader>
          <TableRow>
            <TableHead>{{ $t('load_dialog.table.id') }}</TableHead>
            <TableHead>{{ $t('load_dialog.table.act') }}</TableHead>
            <TableHead>{{ $t('load_dialog.table.player', 2) }}</TableHead>
            <TableHead>{{ $t('load_dialog.table.timestamp') }}</TableHead>
            <TableHead><!-- actions column --></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="save in savedGames"
            :key="save.id"
            @click="selected = save.id"
          >
            <TableCell>
              <span class="whitespace-nowrap">{{ getFriendlyId(save.id) }}</span>
            </TableCell>
            <TableCell>{{ save.act }}</TableCell>
            <TableCell>{{ getPlayers(save) }}</TableCell>
            <TableCell>{{ format(save.timestamp, 'd/LLL/yy') }}</TableCell>
            <TableCell>
              <Button
                class="text-destructive"
                size="icon"
                variant="ghost"
                @click="deleteSave(save.id)"
              >
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Textarea
        v-else
        v-model="raw"
        :placeholder="$t('load_dialog.load_raw_placeholder')"
      >
      </Textarea>

      <AlertDialogFooter>
        <AlertDialogCancel as-child>
          <Button variant="link">{{ $t('common.cancel') }}</Button>
        </AlertDialogCancel>
        <Button
          class="my-2"
          :disabled="!enableLoad || loading"
          @click="loadSave"
        >
          <LoaderPinwheel
            v-if="loading"
            class="mr-2 animate-spin"
          />
          {{ $t('load_dialog.confirm', { id: getFriendlyId(selected) }) }}
        </Button>
        <Button
          variant="secondary"
          @click="showTable = !showTable"
        >
          {{ showTable ? $t('load_dialog.load_raw') : $t('load_dialog.load_list') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
