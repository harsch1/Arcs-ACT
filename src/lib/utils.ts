import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Fate } from '@/Archive'

import type { Ref } from 'vue'
import type { Color, BuildingType, ShipType, TokenType, SaveFile } from '@/Archive'
import type { PieceState } from '@/stores/systems'
import type { ClassValue } from 'clsx'
import type { Updater } from '@tanstack/vue-table'
import type { GameDeck } from '@/stores/game'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value = typeof updaterOrValue === 'function' ? updaterOrValue(ref.value) : updaterOrValue
}

// You say this could be a function? Yes but it's not needed
export const romanNumerals = [null, 'I', 'II', 'III', 'IV', 'V']

export function countByColorAndType(
  pieces: PieceState[],
  color: Color,
  type: BuildingType | ShipType
) {
  return pieces.filter((piece) => piece.type === type && piece.color === color).length
}

export function countByType(pieces: PieceState[], type: BuildingType | ShipType | TokenType) {
  return pieces.filter((piece) => piece.type === type).length
}

export function getSystemOverview(systemPieces: PieceState[]) {
  const uniquePieces: Pick<PieceState, 'color' | 'type'>[] = []
  systemPieces.forEach((piece) => {
    if (!uniquePieces.find((p) => p.type === piece.type && p.color === piece.color)) {
      uniquePieces.push({
        color: piece.color,
        type: piece.type
      })
    }
  })
  const result: [Pick<PieceState, 'color' | 'type'>, number][] = []
  uniquePieces.forEach((piece) => {
    if (piece.color) {
      // @ts-ignore TODO: Narrow properly
      result.push([piece, countByColorAndType(systemPieces, piece.color, piece.type)])
    } else {
      result.push([piece, countByType(systemPieces, piece.type)])
    }
  })
  return result
}

export function exportArchive(save: SaveFile) {
  const blob = new Blob([JSON.stringify(save)], { type: 'application/json' })
  const link = document.createElement('a')

  link.download = save.id
  link.href = window.URL.createObjectURL(blob)
  link.dataset.downloadurl = ['application/json', link.download, link.href].join(':')

  const e = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  })

  link.dispatchEvent(e)
  link.remove()
}

export function getFateName(fateId: string): Fate {
  const [fate] = Object.entries(Fate).find(([, id]) => fateId === id) ?? []
  return fate as Fate
}

export const gameDecks = ['court', 'scrap', 'rules']
export function isGameDeck(deck: string): deck is GameDeck {
  return gameDecks.includes(deck)
}
