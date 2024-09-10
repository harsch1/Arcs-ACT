<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import {
  getCoreRowModel,
  useVueTable,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedUniqueValues
} from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import ListFilterDialog from '@/components/deck-builder/ListFilterDialog.vue'
import SwipableRow from '@/components/deck-builder/SwipableRow.vue'

import type { ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/vue-table'
import type { GameCard } from '@/stores/cards'

const props = defineProps<{
  columns: ColumnDef<GameCard, GameCard>[]
  data: GameCard[]
  locations: string[]
  shortcut?: string
}>()

const emit = defineEmits<{
  move: [id: string, location: string]
}>()

const sorting = ref<SortingState>([])
const globalFilter = ref('')
const columnFilters = ref<ColumnFiltersState>([])

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get globalFilter() {
      return globalFilter.value
    },
    columnVisibility: {
      set: false,
      location: false
    }
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  // getPaginationRowModel: getPaginationRowModel(),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onGlobalFilterChange: (updaterOrValue) => {
    globalFilter.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(globalFilter.value) : updaterOrValue
  }
  // autoResetPageIndex: false
})

function updateFilters(value: Record<string, string[]>) {
  table.setColumnFilters(
    Object.entries(value).reduce(
      (acc, [column, filter]) => {
        acc.push({ id: column, value: filter })
        return acc
      },
      [] as { id: string; value: string[] }[]
    )
  )
}

function moveTo(id: string, location: string) {
  emit('move', id, location)
}
</script>

<template>
  <div class="sticky top-0 z-10 flex items-center px-4 py-4 -mx-4 bg-black search-bar">
    <Input
      class="max-w-sm"
      :placeholder="$t('deck_builder.table.filter')"
      :model-value="globalFilter"
      @update:model-value="(value) => (globalFilter = String(value))"
    />
    <ListFilterDialog
      :table="table"
      class="ml-2"
      @update="updateFilters"
    />
  </div>

  <!-- <TableHeader>
      <TableRow
        v-for="headerGroup in table.getHeaderGroups()"
        :key="headerGroup.id"
      >
        <TableHead
          v-for="header in headerGroup.headers"
          :key="header.id"
        >
          <template v-if="!header.isPlaceholder">
            <template v-if="header.column.getCanFilter()">
              <div class="flex justify-center">
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
                <TableFilterColumn
                  :column="header.column"
                  :table="table"
                  class="ml-2"
                  @update="
                    (value) => {
                      header.column.setFilterValue(value.value)
                    }
                  "
                />
              </div>
            </template>
            <FlexRender
              v-else
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </template>
        </TableHead>
        <TableHead></TableHead>
      </TableRow>
    </TableHeader> -->
  <div class="-mx-4 overflow-x-hidden">
    <template v-if="table.getRowModel().rows?.length">
      <template
        v-for="row in table.getRowModel().rows"
        :key="row.id"
      >
        <SwipableRow
          :height="64"
          :row="row"
          :data-state="row.getIsSelected() ? 'selected' : undefined"
          :locations="locations"
          :shortcut="shortcut"
          @move="moveTo"
        />
      </template>
    </template>
    <template v-else>
      <div class="h-24 text-lg text-center">
        {{ $t('deck_builder.no_results') }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-bar {
  background-image: url('/images/background.jpg');
  background-size: cover;
}
</style>
