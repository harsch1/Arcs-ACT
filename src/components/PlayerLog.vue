<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NumberField, NumberFieldContent, NumberFieldInput } from './ui/number-field'
import { ChevronsUpDown } from 'lucide-vue-next'
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { ComboboxAnchor, ComboboxInput, ComboboxPortal, ComboboxRoot } from 'radix-vue'
import { vOnClickOutside } from '@vueuse/components'
// import { CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete
} from '@/components/ui/tags-input'
import { Plus } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import { Color, Fate, Player, Resource } from '@/Archive'
import PlayerFlagship from '@/components/PlayerFlagship.vue'

// const props = defineProps<{
//   playerState: Player
// }>()

const playerState: Partial<Player> = reactive(new Player('test', Color.blue, Fate.steward))
const playerColors = computed(() =>
  Object.values(Color).filter((c) => c !== Color.empire && c !== Color.free)
)
const resourceOpen = ref(false)
const outrageOpen = ref(false)
const filteredResources = computed(() =>
  Object.values(Resource).filter((r) => !playerState.outrage?.includes(r))
)

function addFate() {
  // @ts-ignore WIP
  playerState.fateHistory.push([])
}
</script>

<template>
  <Tabs default-value="board">
    <TabsList>
      <TabsTrigger value="board">
        {{ $t('player_area.board') }}
      </TabsTrigger>
      <TabsTrigger value="court">
        {{ $t('player_area.court') }}
      </TabsTrigger>
      <TabsTrigger value="flagship">
        {{ $t('player_area.flagship') }}
      </TabsTrigger>
    </TabsList>

    <TabsContent value="board">
      <div class="w-full max-w-lg p-2">
        <Input
          class="my-2"
          :placeholder="$t('player_area.name')"
        />
        <Select>
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
                :class="`align-middle mr-2 inline-block border border-slate-950 rounded-full w-4 h-4 bg-${color.toLowerCase()}-400`"
              ></span>
              <span class="align-middle">{{ $t(`colors.${color}`) }}</span>
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Fates -->
        <div
          v-for="([fate, succeeded], i) in playerState.fateHistory"
          :key="fate"
          class="px-3 py-2 border rounded border-neutral-200"
        >
          <div class="flex flex-row">
            <div class="mr-2 grow">
              <Label :for="`player-fate-${i}`">{{ $t('player_area.fate') }}</Label>
              <Select :id="`player-fate-${i}`">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="fate in Fate"
                    :key="fate"
                    :value="fate"
                  >
                    <strong>{{ fate }}</strong> {{ $t(`fates.${fate}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="w-16 ml-2">
              <Label :for="`player-power-${i}`">{{ $t('player_area.power') }}</Label>
              <NumberField :id="`player-power-${i}`">
                <NumberFieldContent>
                  <NumberFieldInput></NumberFieldInput>
                </NumberFieldContent>
              </NumberField>
            </div>
          </div>
          <div class="flex items-center mt-2">
            <Checkbox
              :id="`player-fate-succeeded-${i}`"
              :checked="succeeded"
            />
            <Label
              :for="`player-fate-succeeded-${i}`"
              class="ml-2"
            >
              {{ $t('player_area.completed_objective') }}
            </Label>
          </div>
        </div>
        <Button
          class="w-full my-2"
          @click="addFate"
        >
          <Plus class="mr-2" />
          {{ $t('player_area.add_fate') }}
        </Button>

        <!-- Resources -->
        <div class="my-2">
          <Label for="player-resources">{{ $t('player_area.resources') }}</Label>
          <TagsInput
            id="player-resources"
            class="w-full gap-0 px-3"
            :model-value="playerState.resources"
          >
            <div class="flex flex-wrap items-center gap-2">
              <TagsInputItem
                v-for="resource in playerState.resources"
                :key="resource"
                :value="resource"
              >
                <span class="ml-2 mr-1">{{ $t(`resources.${resource}`) }}</span>
                <TagsInputItemDelete />
              </TagsInputItem>
            </div>
            <ComboboxRoot
              v-model:model-value="playerState.resources"
              v-model:open="resourceOpen"
              multiple
              class="flex flex-grow"
            >
              <ComboboxAnchor as-child>
                <ComboboxInput
                  @click="resourceOpen = true"
                  as-child
                >
                  <TagsInputInput
                    class="w-full px-0"
                    @keydown.enter.prevent
                  />
                </ComboboxInput>
                <ChevronsUpDown class="w-4 ml-2 opacity-50 shrink-0" />
              </ComboboxAnchor>
              <ComboboxPortal disabled>
                <CommandList
                  position="popper"
                  class="w-[--radix-popper-anchor-width] rounded-md mt-2 border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
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
                            playerState.resources?.push(e.detail.value)
                          }
                        }
                      "
                    >
                      {{ $t(`resources.${resource}`) }}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </ComboboxPortal>
            </ComboboxRoot>
          </TagsInput>
        </div>

        <!-- Outrage -->
        <div class="my-2">
          <Label for="player-outrage">{{ $t('player_area.outrage') }}</Label>
          <TagsInput
            id="player-outrage"
            class="w-full gap-0 px-3"
            :model-value="playerState.outrage"
          >
            <div class="flex flex-wrap items-center gap-2">
              <TagsInputItem
                v-for="resource in playerState.outrage"
                :key="resource"
                :value="resource"
              >
                <span class="ml-2 mr-1">{{ $t(`resources.${resource}`) }}</span>
                <TagsInputItemDelete />
              </TagsInputItem>
            </div>
            <ComboboxRoot
              v-model:model-value="playerState.outrage"
              v-model:open="outrageOpen"
              multiple
              class="flex flex-grow"
            >
              <ComboboxAnchor as-child>
                <ComboboxInput
                  @click="outrageOpen = true"
                  as-child
                >
                  <TagsInputInput
                    class="w-full px-0"
                    @keydown.enter.prevent
                  />
                </ComboboxInput>
                <ChevronsUpDown class="w-4 ml-2 opacity-50 shrink-0" />
              </ComboboxAnchor>
              <ComboboxPortal disabled>
                <CommandList
                  position="popper"
                  class="w-[--radix-popper-anchor-width] rounded-md mt-2 border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
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
                            playerState.outrage?.push(e.detail.value)
                          }
                        }
                      "
                    >
                      {{ $t(`resources.${resource}`) }}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </ComboboxPortal>
            </ComboboxRoot>
          </TagsInput>
        </div>
      </div>

      <!-- <img src="/images/board-player-blue.jpg" /> -->
    </TabsContent>
    <TabsContent value="flagship">
      <PlayerFlagship />
    </TabsContent>
  </Tabs>
</template>
