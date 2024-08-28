import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Fate, Resource } from '@/Archive'

import type { Ref } from 'vue'
import { type Color, BuildingType, ShipType, type TokenType, type SaveFile } from '@/Archive'
import type { PieceState } from '@/stores/systems'
import type { ClassValue } from 'clsx'
import type { Updater } from '@tanstack/vue-table'
import type { GameDeck } from '@/stores/cards'
import humanId from 'human-id'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value = typeof updaterOrValue === 'function' ? updaterOrValue(ref.value) : updaterOrValue
}

// You say this could be a function? Yes but it's not needed
export const romanNumerals = [null, 'I', 'II', 'III', 'IV', 'V']

export function groupByColorAndTypeAndFreshness() {}

export function countByColorAndType(
  pieces: PieceState[],
  color: Color,
  type: BuildingType | ShipType,
  freshness: true
): [number, number]
export function countByColorAndType(
  pieces: PieceState[],
  color: Color,
  type: BuildingType | ShipType,
  freshness?: boolean
): number
export function countByColorAndType(
  pieces: PieceState[],
  color: Color,
  type: BuildingType | ShipType,
  freshness?: boolean
): number | [number, number] {
  // Returns a tuple with [freshCount, damagedCount]
  if (freshness) {
    return pieces
      .filter((piece) => piece.type === type && piece.color === color)
      .reduce(
        (acc, value) => {
          value.isFresh ? acc[0]++ : acc[1]++
          return acc
        },
        [0, 0]
      )
  }
  // Returns the count
  return pieces.filter((piece) => piece.type === type && piece.color === color).length
}

export function countByType(
  pieces: PieceState[],
  type: BuildingType | ShipType | TokenType,
  freshness: true
): [number, number]
export function countByType(
  pieces: PieceState[],
  type: BuildingType | ShipType | TokenType,
  freshness?: boolean
): number
export function countByType(
  pieces: PieceState[],
  type: BuildingType | ShipType | TokenType,
  freshness?: boolean
): number | [number, number] {
  // Returns a tuple with [freshCount, damagedCount]
  if (freshness) {
    return pieces
      .filter((piece) => piece.type === type)
      .reduce(
        (acc, value) => {
          value.isFresh ? acc[0]++ : acc[1]++
          return acc
        },
        [0, 0]
      )
  }
  // Returns the count
  return pieces.filter((piece) => piece.type === type).length
}

export function getSystemOverview(
  systemPieces: PieceState[],
  { freshness }: { freshness?: boolean } = {}
) {
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
      result.push([piece, countByColorAndType(systemPieces, piece.color, piece.type, freshness)])
    } else {
      result.push([piece, countByType(systemPieces, piece.type, freshness)])
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

export function generateName() {
  // Remove the verb from the id
  let name = humanId(' ')
  name = name.slice(0, name.lastIndexOf(' '))
  return name
}

export function getFateName(fateId: string): Fate {
  const [fate] = Object.entries(Fate).find(([, id]) => fateId === id) ?? []
  return fate as Fate
}

export function getFateId(fateName: string): string {
  const [, fate] = Object.entries(Fate).find(([name]) => name === fateName) ?? []
  return fate as string
}

export const gameDecks = ['court', 'scrap', 'rules']
export function isGameDeck(deck: string): deck is GameDeck {
  return gameDecks.includes(deck)
}

export function isResource(resource: unknown): resource is Resource {
  return Object.values(Resource).includes(resource as Resource)
}

export function isBuilding(piece: unknown): piece is BuildingType {
  return Object.values(BuildingType).includes(piece as BuildingType)
}

export function isFlagship(piece: unknown): piece is ShipType.flagship {
  return piece === ShipType.flagship
}
