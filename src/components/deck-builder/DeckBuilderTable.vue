<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel
} from '@tanstack/vue-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev
} from '@/components/ui/pagination'
import { valueUpdater } from '@/lib/utils'

import type { ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/vue-table'
import TableFilterColumn from '@/components/deck-builder/TableFilterColumn.vue'
import TableRowActions from '@/components/deck-builder/TableRowActions.vue'
import type { GameCard } from '@/stores/game'

const props = defineProps<{
  columns: ColumnDef<GameCard, GameCard>[]
  data: GameCard[]
  locations: string[]
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
    }
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getPaginationRowModel: getPaginationRowModel(),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onGlobalFilterChange: (updaterOrValue) => {
    globalFilter.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(globalFilter.value) : updaterOrValue
  }
})

function moveTo(id: string, location: string) {
  emit('move', id, location)
}
</script>

<template>
  <div class="flex items-center py-4">
    <Input
      class="max-w-sm"
      :placeholder="$t('deck-builder.table.filter')"
      :model-value="globalFilter"
      @update:model-value="(value) => (globalFilter = String(value))"
    />
  </div>

  <div class="border rounded-md">
    <Table>
      <TableHeader>
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
          <!-- Actions -->
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
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
            <TableCell>
              <TableRowActions
                :card="row.original"
                :locations="locations"
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
  </div>

  <div class="flex items-center justify-end py-4 space-x-2">
    <div class="flex-1 text-sm text-muted-foreground">
      {{
        $t('deck-builder.table.selected', {
          count: table.getFilteredSelectedRowModel().rows.length,
          size: table.getFilteredRowModel().rows.length
        })
      }}
    </div>

    <Pagination
      v-slot="{ page }"
      :total="table.getFilteredRowModel().rows.length"
      :sibling-count="1"
      :default-page="1"
      show-edges
    >
      <PaginationList
        v-slot="{ items }"
        class="flex items-center gap-1"
      >
        <!-- <PaginationFirst /> -->
        <PaginationPrev
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        />
        <template v-for="(item, index) in items">
          <PaginationListItem
            v-if="item.type === 'page'"
            :key="index"
            :value="item.value"
            as-child
          >
            <Button
              class="w-10 h-10 p-0"
              :variant="item.value === page ? 'default' : 'outline'"
              @click="table.setPageIndex(item.value - 1)"
            >
              {{ item.value }}
            </Button>
          </PaginationListItem>
          <PaginationEllipsis
            v-else
            :key="item.type"
            :index="index"
          />
        </template>

        <PaginationNext
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        />
        <!-- <PaginationLast /> -->
      </PaginationList>
    </Pagination>
  </div>
</template>
