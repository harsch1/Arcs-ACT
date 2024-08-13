import { h } from 'vue'
import i18n from '@/i18n'
import { Checkbox } from '@/components/ui/checkbox'
import { type GameCard } from '@/stores/game'

import type { ColumnDef } from '@tanstack/vue-table'
import { capitalize } from 'lodash'

const columns: ColumnDef<GameCard>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(Checkbox, {
        checked: table.getIsAllPageRowsSelected(),
        'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all'
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        ariaLabel: 'Select row'
      }),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'id',
    enableColumnFilter: false,
    header: () => h('div', { class: 'text-left' }, i18n.global.t('deck-builder.table.id')),
    cell: ({ row }) => {
      return h('div', { class: 'font-medium' }, row.getValue('id'))
    }
  },
  {
    accessorKey: 'name',
    enableColumnFilter: false,
    header: () => h('div', { class: 'text-left' }, i18n.global.t('deck-builder.table.name')),
    cell: ({ row }) => {
      return h('div', { class: '' }, row.getValue('name'))
    }
  },
  {
    accessorKey: 'set',
    header: () => h('div', { class: 'text-center' }, i18n.global.t('deck-builder.table.set')),
    cell: ({ row }) => {
      return h('div', { class: 'text-center' }, row.getValue('set'))
    },
    filterFn: 'arrIncludesSome'
  },
  {
    accessorKey: 'location',
    accessorFn: (row) => {
      return capitalize(row.location)
    },
    header: () => h('div', { class: 'self-center' }, i18n.global.t('deck-builder.table.location')),
    cell: ({ row }) => {
      return h('div', { class: 'text-center' }, row.getValue('location'))
    },
    filterFn: 'arrIncludesSome'
  }
  // {
  //   id: 'actions',
  //   enableHiding: false,
  //   cell: ({ row }, { attrs }) => {
  //     const card = row.original

  //     return h(
  //       'div',
  //       { class: 'relative' },
  //       h(TableRowActions, {
  //         card,
  //         ...attrs
  //       })
  //     )
  //   }
  // }
]

export default columns
