/**
 * Also uses a table but we interact with it like a list
 */
import { h } from 'vue'
import i18n from '@/i18n'
import { type GameCard } from '@/stores/cards'

import type { ColumnDef } from '@tanstack/vue-table'
import { capitalize } from 'lodash'

const columns: ColumnDef<GameCard>[] = [
  {
    accessorKey: 'id',
    enableColumnFilter: false,
    header: () => h('div', { class: 'text-left' }, i18n.global.t('deck_builder.table.id')),
    cell: ({ row }) => {
      // return h('div', { class: 'font-medium' }, row.getValue('id'))
      return h('div', { class: 'flex flex-col' }, [
        h('span', {}, row.getValue('id')),
        h('span', {}, row.getValue('set'))
      ])
    }
  },
  {
    accessorKey: 'name',
    enableColumnFilter: false,
    header: () => h('div', { class: 'text-left' }, i18n.global.t('deck_builder.table.name')),
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h('span', {}, row.getValue('name')),
        h('span', { class: 'italic' }, row.getValue('location'))
      ])
    }
  },
  {
    accessorKey: 'set',
    header: () => h('div', { class: 'text-center' }, i18n.global.t('deck_builder.table.set')),
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
    header: () => h('div', { class: 'self-center' }, i18n.global.t('deck_builder.table.location')),
    cell: ({ row }) => {
      return h('div', { class: 'text-center' }, row.getValue('location'))
    },
    filterFn: 'arrIncludesSome'
  }
]

export default columns
