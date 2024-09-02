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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Button from '@/components/ui/button/Button.vue'
import { Trash2, LoaderPinwheel, FileDown, Play, Pencil, Check, X } from 'lucide-vue-next'
import { GAME_SAVE_PREFIX, useGameStore } from '@/stores/game'
import { computed, onMounted, ref } from 'vue'
import { format, isAfter } from 'date-fns'
import { useI18n } from 'vue-i18n'

import type { SaveFile } from '@/Archive'
import { cloneDeep } from 'lodash'

const emit = defineEmits<{
  loaded: []
}>()

const gameStore = useGameStore()
const { t } = useI18n()
const savedGames = computed(() =>
  Array.from(gameStore.savedGames.values()).sort((a, b) =>
    isAfter(a.timestamp, b.timestamp) ? -1 : 1
  )
)

onMounted(() => gameStore.listGames())

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

  return id.replace(GAME_SAVE_PREFIX, '').replace(/_/g, ' ')
}

function getPlayers(archive: SaveFile) {
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

function exportSave(id: string) {
  gameStore.exportGame(id)
}

function deleteSave(id: string) {
  if (confirm(t('load_dialog.are_you_sure?'))) {
    gameStore.deleteGame(id)
  }
}

const update = ref<Partial<SaveFile>>({})
const isEditingId = ref<string | undefined>()

function toggleSave(save?: SaveFile) {
  isEditingId.value = save?.id
  if (save) {
    update.value = cloneDeep(save)
  }
}

async function confirmSave(id: string) {
  // @ts-ignore
  await gameStore.updateGame(id, update.value)
  toggleSave()
  // Call this to update the store
  gameStore.listGames()
}
</script>

<template>
  <AlertDialog v-model:open="alertOpen">
    <AlertDialogTrigger as-child>
      <slot></slot>
    </AlertDialogTrigger>
    <AlertDialogContent class="max-h-full max-sm:w-full max-w-[800px] overflow-auto">
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
            <TableHead>{{ $t('load_dialog.table.name') }}</TableHead>
            <TableHead class="text-center">{{ $t('load_dialog.table.act') }}</TableHead>
            <TableHead class="text-center">{{ $t('load_dialog.table.player', 2) }}</TableHead>
            <TableHead class="text-center">{{ $t('load_dialog.table.timestamp') }}</TableHead>
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
              <div
                v-if="isEditingId !== save.id"
                class="flex items-center whitespace-nowrap"
              >
                {{ save.name ?? getFriendlyId(save.id) }}
                <Button
                  class="ml-2"
                  size="icon"
                  variant="ghost"
                  @click="toggleSave(save)"
                >
                  <Pencil :size="16" />
                </Button>
              </div>
              <div
                v-else
                class="flex items-center"
              >
                <Input
                  class="min-w-56"
                  :model-value="update.name"
                  @update:model-value="(value) => (update.name = value as string)"
                />
                <Button
                  class="ml-2"
                  size="icon"
                  variant="ghost"
                  @click="confirmSave(save.id)"
                >
                  <Check :size="24" />
                </Button>
                <Button
                  class="ml-2"
                  size="icon"
                  variant="ghost"
                  @click="toggleSave()"
                >
                  <X :size="24" />
                </Button>
              </div>
            </TableCell>
            <TableCell class="text-center">{{ save.act }}</TableCell>
            <TableCell class="text-center">{{ getPlayers(save) }}</TableCell>
            <TableCell class="text-center">{{ format(save.timestamp, 'd/LLL/yy') }}</TableCell>
            <TableCell class="text-right whitespace-nowrap">
              <Button
                size="icon"
                variant="ghost"
                @click.stop="
                  () => {
                    selected = save.id
                    loadSave()
                  }
                "
              >
                <Play />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                @click.stop="exportSave(save.id)"
              >
                <FileDown />
              </Button>

              <Button
                class="text-destructive"
                size="icon"
                variant="ghost"
                @click.stop="deleteSave(save.id)"
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
        class="md:h-[320px]"
        :placeholder="$t('load_dialog.load_raw_placeholder')"
      >
      </Textarea>

      <AlertDialogFooter class="">
        <AlertDialogCancel as-child>
          <Button
            variant="link"
            class="!mt-2"
            >{{ $t('common.cancel') }}</Button
          >
        </AlertDialogCancel>

        <Button
          class="!mt-2 md:order-3"
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
          class="md:order-2 !mt-2"
          variant="secondary"
          @click="showTable = !showTable"
        >
          {{ showTable ? $t('load_dialog.load_raw') : $t('load_dialog.load_list') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
