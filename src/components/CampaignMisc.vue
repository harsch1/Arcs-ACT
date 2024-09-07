<script lang="ts" setup>
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronDown, Dices } from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import { useGameStore } from '@/stores/game'
import { generateName } from '@/lib/utils'

const gameStore = useGameStore()
const { t } = useI18n()
const { toast } = useToast()
const downloadId = computed(() => gameStore.settings.id)
const nameAlreadyExists = ref(false)

function updateCampaignNotes(notes: string) {
  gameStore.settings.notes = notes
}

function randomName() {
  gameStore.settings.name = generateName()
}

async function save(id?: string) {
  nameAlreadyExists.value = false

  try {
    const save = await gameStore.saveGame(id)
    gameStore.loadGame(save.id)
    toast({
      title: id
        ? t('toast.game_updated', { name: save.name })
        : t('toast.game_saved', { name: save.name }),
      duration: 3000
    })
  } catch (e) {
    nameAlreadyExists.value = true
  }
}
</script>

<template>
  <p class="w-full py-2 text-lg">
    {{ $t('campaign.misc_help_text') }}
  </p>

  <div class="flex mt-2">
    <Input
      class="max-w-sm"
      :class="{ 'border-destructive': nameAlreadyExists }"
      :model-value="gameStore.settings.name"
      :placeholder="$t('campaign.name')"
      @update:model-value="(value) => (gameStore.settings.name = value as string)"
    />
    <Button
      variant="ghost"
      size="icon"
      class="ml-2"
      @click="randomName"
    >
      <Dices :size="24" />
    </Button>
  </div>
  <p
    v-if="nameAlreadyExists"
    class="font-bold text-destructive"
  >
    {{ t('validations.name_already_exists') }}
  </p>

  <Textarea
    class="my-2 min-h-40"
    :placeholder="$t('campaign.notes')"
    :model-value="gameStore.settings.notes"
    @update:model-value="(value) => updateCampaignNotes(value as string)"
  />

  <div class="my-16 space-x-4 text-center">
    <!-- Download button -->
    <Button
      v-if="downloadId"
      @click="gameStore.exportGame(downloadId)"
    >
      {{ $t('common.download') }}
    </Button>

    <!-- Update button -->
    <div class="inline-flex items-center justify-center rounded-md">
      <Button
        class="rounded-r-none"
        @click="save(gameStore.settings.id)"
      >
        {{ $t('common.update') }}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            class="rounded-l-none"
            size="icon"
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="border-0 bg-primary text-primary-foreground"
          side="top"
          align="end"
        >
          <DropdownMenuItem @click="save()">
            {{ $t('common.create_new') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
