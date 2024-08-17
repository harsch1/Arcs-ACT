<script lang="ts" setup>
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Filter, Check } from 'lucide-vue-next'
import type { Column, Table } from '@tanstack/vue-table'
import { computed, ref, type Ref } from 'vue'

const props = defineProps<{
  placeholder?: string
  table: Table<any>
  column: Column<any, unknown>
}>()

const emit = defineEmits<{
  update: [value: Ref<string[]>]
}>()

const values = computed(() =>
  Array.from(props.column.getFacetedUniqueValues().keys())
    .filter((value) => !!value)
    .sort()
)
const selected = ref<string[]>([])

function update(value: string | string[]) {
  selected.value = Array.isArray(value) ? value : [value]
  emit('update', selected)
}
</script>

<template>
  <Popover>
    <PopoverTrigger v-bind="$attrs">
      <Filter />
    </PopoverTrigger>
    <PopoverContent class="w-[160px] p-0">
      <ToggleGroup
        :model-value="selected"
        @update:model-value="update"
        type="multiple"
        class="flex-col items-start justify-start text-left"
      >
        <ToggleGroupItem
          v-for="value in values"
          :key="value"
          :value="value"
          :aria-label="`Toggle ${value}`"
          size="sm"
          class="justify-start w-full !bg-transparent"
        >
          <Check
            v-if="selected.includes(value)"
            class="w-4 h-4 mr-2"
          />
          <div
            v-else
            class="w-4 h-4 mr-2"
          ></div>
          {{ value }}
        </ToggleGroupItem>
      </ToggleGroup>
    </PopoverContent>
  </Popover>
</template>
