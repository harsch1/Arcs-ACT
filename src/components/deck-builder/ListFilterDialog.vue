<script lang="ts" setup>
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Column, Table } from '@tanstack/vue-table'
import { Filter, Check } from 'lucide-vue-next'
import { computed, reactive } from 'vue'

defineProps<{
  table: Table<any>
}>()

const emit = defineEmits<{
  update: [value: Record<string, string[]>]
}>()

const selected = reactive<Record<string, string[]>>({})

const values = computed(
  () => (column: Column<any, unknown>) =>
    Array.from(column.getFacetedUniqueValues().keys())
      .filter((value) => !!value)
      .sort()
)

function update(column: string, value: string | string[]) {
  selected[column] = Array.isArray(value) ? value : [value]
  emit('update', selected)
}
</script>

<template>
  <Dialog>
    <DialogTrigger v-bind="$attrs">
      <Filter />
    </DialogTrigger>
    <DialogContent>
      <template
        v-for="column in table.getAllColumns()"
        :key="column.id"
      >
        <div v-if="column.getCanFilter()">
          {{ $t(`deck_builder.table.${column.id}`) }}
          <ToggleGroup
            :model-value="selected[column.id]"
            @update:model-value="(value) => update(column.id, value)"
            type="multiple"
            class="flex-col items-start justify-start text-left"
          >
            <ToggleGroupItem
              v-for="value in values(column)"
              :key="value"
              :value="value"
              :aria-label="`Toggle ${value}`"
              size="sm"
              class="justify-start w-full !bg-transparent"
            >
              <Check
                v-if="selected[column.id]?.includes(value)"
                class="w-4 h-4 mr-2"
              />
              <div
                v-else
                class="w-4 h-4 mr-2"
              ></div>
              {{ value }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </template>

      <DialogFooter class="justify-start">
        <DialogClose as-child>
          <Button class="mr-2 w-fit">
            {{ $t('common.close') }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
