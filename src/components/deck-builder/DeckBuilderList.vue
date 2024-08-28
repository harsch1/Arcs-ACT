<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedUniqueValues
} from '@tanstack/vue-table'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { valueUpdater } from '@/lib/utils'

import ListFilterDialog from '@/components/deck-builder/ListFilterDialog.vue'
import TableRowActions from '@/components/deck-builder/TableRowActions.vue'

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
  <div class="sticky top-0 z-10 flex items-center py-4 bg-black search-bar">
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

  <Table>
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
    <TableBody>
      <template v-if="table.getRowModel().rows?.length">
        <TableRow
          v-for="row in table.getRowModel().rows"
          :key="row.id"
          :data-state="row.getIsSelected() ? 'selected' : undefined"
        >
          <TableCell
            v-for="cell in row.getVisibleCells()"
            :key="cell.id"
          >
            <FlexRender
              :render="cell.column.columnDef.cell"
              :props="cell.getContext()"
            />
          </TableCell>
          <!-- Actions -->
          <TableCell class="text-right whitespace-nowrap">
            <TableRowActions
              :card="row.original"
              :locations="locations"
              :shortcut="shortcut"
              @move="moveTo"
            ></TableRowActions>
          </TableCell>
        </TableRow>
      </template>
      <template v-else>
        <TableRow>
          <TableCell
            :colspan="columns.length"
            class="h-24 text-center"
          >
            No results.
          </TableCell>
        </TableRow>
      </template>
    </TableBody>
  </Table>
</template>

<style scoped>
.search-bar {
  background-image: url('/images/background.png');
  background-size: contain;
}
</style>
