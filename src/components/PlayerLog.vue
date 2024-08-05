<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NumberField, NumberFieldContent, NumberFieldInput } from './ui/number-field'
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { ComboboxAnchor, ComboboxInput, ComboboxPortal, ComboboxRoot } from 'radix-vue'
import { vOnClickOutside } from '@vueuse/components'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete
} from '@/components/ui/tags-input'
import { Plus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Color, Fate, Player, Resource } from '@/Archive'
// import PlayerFlagship from '@/components/PlayerFlagship.vue'
import { romanNumerals } from '@/lib/utils'
import { useGameStore } from '@/stores/game'

const props = defineProps<{
  player: Player
  act?: number
}>()

const gameStore = useGameStore()

const playerColors = computed(() =>
  Object.values(Color).filter((c) => c !== Color.empire && c !== Color.free)
)
const resourceOpen = ref(false)
const outrageOpen = ref(false)
const filteredResources = computed(() =>
  Object.values(Resource).filter((r) => !props.player.outrage?.includes(r))
)

if (props.act && props.player.fateHistory.length < props.act) {
  for (let i = props.player.fateHistory.length; i < props.act; i++) {
    addFate()
  }
}

const canAddFate = computed(() => {
  if (!props.act) {
    return true
  }

  return (props.player.fateHistory ?? []).length < props.act
})

function updatePlayer(update: Partial<Player>) {
  const payload = {
    ...update,
    color: props.player.color
  }
  gameStore.updatePlayer(payload)
}

function updateFate(
  fate: Fate,
  act: number,
  { power, succeeded }: { power?: number; succeeded?: boolean } = {}
) {
  const update: Partial<Player> = {}

  // [Fate, power, succeeded objective]
  const history = [...props.player.fateHistory]
  history[act] = [fate, power ?? history[act][1], succeeded ?? history[act][2]]
  update.fateHistory = history

  // Current fate
  // Passed act is 1-based
  if (act + 1 === props.act) {
    update.currentFate = fate
    update.power = power ?? props.player.power
  }

  updatePlayer(update)
}

function addFate() {
  updatePlayer({
    color: props.player.color,
    // @ts-ignore WIP
    fateHistory: [...props.player.fateHistory, []]
  })
}
</script>

<template>
  <Tabs
    default-value="board"
    class="px-4"
  >
    <TabsList class="w-full">
      <TabsTrigger value="board">
        {{ $t('player_area.board') }}
      </TabsTrigger>
      <TabsTrigger value="court">
        {{ $t('player_area.court') }}
      </TabsTrigger>
      <!-- <TabsTrigger value="flagship">
        {{ $t('player_area.flagship') }}
      </TabsTrigger> -->
    </TabsList>

    <TabsContent value="board">
      <div class="w-full max-w-lg">
        <Input
          class="my-2"
          :placeholder="$t('player_area.name')"
          :model-value="player.name"
          @update:model-value="(value) => updatePlayer({ name: value as string })"
        />
        <Select v-if="!player.color">
          <SelectTrigger class="my-2">
            <SelectValue :placeholder="$t('player_area.color')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="color in playerColors"
              :key="color"
              :value="color"
            >
              <span
                class="inline-block w-4 h-4 mr-2 align-middle border rounded-full border-slate-950"
                :class="color !== Color.white ? `bg-${color.toLowerCase()}-400` : 'bg-white'"
              ></span>
              <span class="align-middle">{{ $t(`colors.${color}`) }}</span>
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Fates -->
        <div
          v-for="([fate, power, succeeded], fateAct) in player.fateHistory"
          :key="fate"
          class="flex flex-row px-3 py-2 border rounded border-neutral-400 fate-wrapper"
        >
          <div class="flex flex-col items-center justify-center mr-4 grow-0">
            <span>Act</span><span class="font-serif text-xl">{{ romanNumerals[fateAct + 1] }}</span>
          </div>
          <div class="grow">
            <div class="flex flex-row">
              <div class="mr-2 grow">
                <Label :for="`player-fate-${fateAct}`">{{ $t('player_area.fate') }}</Label>
                <Select
                  :id="`player-fate-${fateAct}`"
                  :model-value="fate"
                  @update:model-value="(value) => updateFate(value as Fate, fateAct)"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="fateId in Fate"
                      :key="fateId"
                      :value="fateId"
                    >
                      <strong>{{ fateId }}</strong> {{ $t(`fates.${fateId}`) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="w-16 ml-2">
                <Label :for="`player-power-${fateAct}`">{{ $t('player_area.power') }}</Label>
                <NumberField
                  :id="`player-power-${fateAct}`"
                  :model-value="power"
                  @update:model-value="(value) => updateFate(fate, fateAct, { power: value })"
                >
                  <NumberFieldContent>
                    <NumberFieldInput></NumberFieldInput>
                  </NumberFieldContent>
                </NumberField>
              </div>
            </div>
            <div class="flex items-center mt-2">
              <Checkbox
                :id="`player-fate-succeeded-${fateAct}`"
                :checked="succeeded"
                @update:checked="(value) => updateFate(fate, fateAct, { succeeded: value })"
              />
              <Label
                :for="`player-fate-succeeded-${fateAct}`"
                class="ml-2"
              >
                {{ $t('player_area.completed_objective') }}
              </Label>
            </div>
          </div>
        </div>
        <Button
          v-if="canAddFate"
          class="w-full my-2"
          @click="addFate"
        >
          <Plus class="mr-2" />
          {{ $t('player_area.add_fate') }}
        </Button>

        <!-- Resources -->
        <div class="my-2">
          <Label for="player-resources">{{ $t('player_area.resources') }}</Label>
          <ComboboxRoot
            v-model:open="resourceOpen"
            :value="player.resources"
            multiple
            class="flex flex-grow"
          >
            <ComboboxAnchor as-child>
              <TagsInput
                id="player-resources"
                class="w-full gap-0 px-3"
                :model-value="player.resources"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <TagsInputItem
                    v-for="resource in player.resources"
                    :key="resource"
                    :value="resource"
                  >
                    <img
                      :src="`images/${resource.toLowerCase()}.png`"
                      :alt="resource"
                      class="h-6"
                    />
                    <span class="ml-2 mr-1">{{ $t(`resources.${resource}`) }}</span>
                    <TagsInputItemDelete />
                  </TagsInputItem>
                </div>

                <ComboboxInput
                  @click="resourceOpen = true"
                  as-child
                >
                  <TagsInputInput
                    class="w-full px-0"
                    @keydown.enter.prevent
                  />
                </ComboboxInput>
              </TagsInput>
            </ComboboxAnchor>
            <ComboboxPortal disabled>
              <CommandList
                avoid-collisions
                position="popper"
                class="w-[--radix-popper-anchor-width] rounded-md mt-2 border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 min-h-[180px]"
                v-on-click-outside="
                  () => {
                    resourceOpen = false
                  }
                "
              >
                <CommandEmpty />
                <CommandGroup>
                  <CommandItem
                    v-for="resource in Resource"
                    :key="resource"
                    :value="resource"
                    @select.prevent="
                      (e) => {
                        if (typeof e.detail.value === 'string') {
                          updatePlayer({
                            resources: [...player.resources, e.detail.value as Resource]
                          })
                        }
                      }
                    "
                  >
                    <img
                      class="h-6 mr-2"
                      :src="`images/${resource.toLowerCase()}.png`"
                      :alt="resource"
                    />
                    {{ $t(`resources.${resource}`) }}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </ComboboxPortal>
          </ComboboxRoot>
        </div>

        <!-- Outrage -->
        <div class="my-2">
          <Label for="player-outrage">{{ $t('player_area.outrage') }}</Label>
          <ComboboxRoot
            v-model:open="outrageOpen"
            :value="player.outrage"
            multiple
            class="flex flex-grow"
          >
            <ComboboxAnchor as-child>
              <TagsInput
                id="player-outrage"
                class="w-full gap-0 px-3"
                :model-value="player.outrage"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <TagsInputItem
                    v-for="resource in player.outrage"
                    :key="resource"
                    :value="resource"
                  >
                    <img
                      :src="`images/${resource.toLowerCase()}.png`"
                      :alt="resource"
                      class="h-6"
                    />
                    <span class="ml-2 mr-1">{{ $t(`resources.${resource}`) }}</span>
                    <TagsInputItemDelete />
                  </TagsInputItem>
                </div>

                <ComboboxInput
                  @click="outrageOpen = true"
                  as-child
                >
                  <TagsInputInput
                    class="w-full px-0"
                    @keydown.enter.prevent
                  />
                </ComboboxInput>
              </TagsInput>
            </ComboboxAnchor>
            <ComboboxPortal disabled>
              <CommandList
                avoid-collisions
                position="popper"
                class="w-[--radix-popper-anchor-width] rounded-md mt-2 border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 min-h-[180px]"
                v-on-click-outside="
                  () => {
                    outrageOpen = false
                  }
                "
              >
                <CommandEmpty />
                <CommandGroup>
                  <CommandItem
                    v-for="resource in filteredResources"
                    :key="resource"
                    :value="resource"
                    @select.prevent="
                      (e) => {
                        if (typeof e.detail.value === 'string') {
                          updatePlayer({
                            outrage: [...player.outrage, e.detail.value as Resource]
                          })
                        }
                      }
                    "
                  >
                    <img
                      :src="`images/${resource.toLowerCase()}.png`"
                      :alt="resource"
                      class="h-6 mr-2"
                    />
                    {{ $t(`resources.${resource}`) }}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </ComboboxPortal>
          </ComboboxRoot>
        </div>
      </div>
    </TabsContent>

    <TabsContent value="court">TODO</TabsContent>

    <!-- <TabsContent value="flagship">
      <PlayerFlagship />
    </TabsContent> -->
  </Tabs>
</template>

<style scoped>
.fate-wrapper + .fate-wrapper {
  margin-top: theme('spacing.2');
}
</style>
