import systemsUiConfig from '@/lib/systems-ui-config'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { BuildingType, TokenType } from '@/Archive'
import { getRandomInt, randomPointWithinSVG } from '@/lib/ui-utils'
import { getSystemOverview } from '@/lib/utils'
import { cloneDeep, cloneDeepWith, groupBy } from 'lodash'

import type { Color, MapPiece, Multi, SaveFile, ShipType, System, SystemKey } from '@/Archive'

export type SystemUiConfig = {
  el: SVGSVGElement
  shape: SVGPathElement
  bounds?: SVGPathElement
}

export type SystemConfig = {
  id: SystemKey
  scale: number
  position: { x: number; y: number }
  slots: {
    position: { x: number; y: number }
  }[]
}

type SystemInfo = {
  config: SystemConfig & Partial<SystemUiConfig>
  pieces: PieceState[]
  slots: {
    position: { x: number; y: number }
    isEmpty: boolean
  }[]
}

export type PieceState = {
  type: BuildingType | TokenType | ShipType
  position: { x: number; y: number }
  id?: number
  system?: SystemKey
  color?: Color
  slot?: SystemInfo['slots'][number]
  isFresh?: boolean
}

export type PieceStateGroup = Pick<PieceState, 'system' | 'color' | 'position'> & {
  // Only SHIP and TokenType can be grouped
  type: TokenType | ShipType
  group: {
    damaged: Pick<PieceState, 'id' | 'isFresh'>[]
    fresh: Pick<PieceState, 'id' | 'isFresh'>[]
  }
}

export type TokenPieceState = PieceState & { type: TokenType }

export type SystemStorePayload = {
  system: SystemKey
  type: BuildingType | TokenType | ShipType
  // op: 'ADD' | 'REMOVE'
  count: number
  color?: Color
}

const _initialSystemsState = systemsUiConfig.reduce(
  (acc, config) => {
    acc[config.id as SystemKey] = {
      config,
      slots: config.slots.map((slot) => ({ ...slot, isEmpty: true })),
      pieces: []
    }

    return acc
  },
  {} as Record<SystemKey, SystemInfo>
)

export const useSystemsStore = defineStore('systems', () => {
  // Simple id
  const id = ref(0)
  // Init based on the configuration
  const systems = ref(cloneDeep(_initialSystemsState))

  function $reset() {
    id.value = 0
    systems.value = cloneDeepWith(_initialSystemsState, (v, k) => {
      if (k === 'config') {
        return systems.value[v.id as SystemKey].config
      }
    })
  }

  const pieces = computed(() =>
    Object.values(systems.value).reduce(
      (acc, system) => acc.concat(system.pieces),
      [] as PieceState[]
    )
  )

  const systemState = computed(() => {
    return (systemId: SystemKey) => {
      return systems.value[systemId]
    }
  })

  const systemUi = computed(() => {
    return (systemId: SystemKey, prop?: keyof SystemConfig) => {
      if (prop) {
        return systems.value[systemId].config[prop]
      }
      return systems.value[systemId].config
    }
  })

  const isSystemFull = computed(() => {
    return (systemId: SystemKey) => !systems.value[systemId].slots.find((s) => s.isEmpty)
  })

  const clusters = computed(
    () =>
      groupBy(Object.keys(systems.value), (id: string) => id.charAt(0)) as Record<
        string,
        SystemKey[]
      >
  )

  function updateState(payload: SystemStorePayload) {
    console.log(payload)
    if (payload.count < 0) {
      for (let i = -payload.count; i > 0; i--) {
        const piece = {
          system: payload.system,
          type: payload.type,
          color: payload.color
        }
        // TODO: Check this behavior
        // Some pieces to remove may not have all properties if they were added on the dialog
        removePiece(
          {
            position: {
              x: -1,
              y: -1
            },
            ...piece
          },
          true
        )
      }
    } else {
      for (let i = payload.count; i > 0; i--) {
        const piece = {
          system: payload.system,
          type: payload.type,
          color: payload.color
        }
        // @ts-ignore TODO: Check this
        addPiece(payload.system, piece)
      }
    }
  }

  function addPiece(
    system: SystemKey,
    piece: MapPiece,
    position?: { x: number; y: number }
  ): PieceState | undefined {
    const activeSystem = systems.value[system]

    if (!activeSystem) {
      return
    }

    const pieceState: PieceState = {
      position: { x: -1, y: -1 },
      ...piece
    }

    let isPositioned = false
    if (Object.values(BuildingType).includes(piece.type as BuildingType)) {
      // Fill the first empty slot
      const slot = activeSystem.slots.find((s) => s.isEmpty)
      if (slot) {
        // TODO: System coordinates need to be added to the slot
        pieceState.slot = slot
        pieceState.position = {
          x: slot.position.x + activeSystem.config.position.x,
          y: slot.position.y + activeSystem.config.position.y
        }
        slot.isEmpty = false
        isPositioned = true
      }
    }

    // Ensure the piece was positioned
    if (!isPositioned) {
      pieceState.position = position ??
        randomPointWithinSVG(
          activeSystem.config.el!,
          activeSystem.config.shape!,
          activeSystem.config.bounds
        ) ?? {
          x: getRandomInt(activeSystem.config.position.x, activeSystem.config.position.x + 100),
          y: getRandomInt(activeSystem.config.position.y, activeSystem.config.position.y + 100)
        }
    }

    pieceState.id = id.value++
    pieceState.isFresh = pieceState.isFresh ?? true
    // Keep reference of system
    pieceState.system = system
    activeSystem.pieces.push(pieceState)

    return pieceState
  }

  function removePiece(piece: PieceState, isFresh: boolean) {
    if (!piece.system) {
      return
    }

    const activeSystem = systems.value[piece.system]
    // const pieceIndex = activeSystem.pieces.findIndex((p) => p === piece)
    const pieceIndex = activeSystem.pieces.findIndex(
      (p) => p.type === piece.type && p.color === piece.color && p.isFresh === isFresh
    )

    if (pieceIndex < 0) {
      return
    }

    if (piece.slot) {
      piece.slot.isEmpty = true
    }

    activeSystem.pieces = [
      ...activeSystem.pieces.slice(0, pieceIndex),
      ...activeSystem.pieces.slice(pieceIndex + 1)
    ]
  }

  function flipPiece(piece: PieceState | PieceStateGroup, isFresh: boolean) {
    if (!piece.system) {
      return
    }

    // Handle flip on a PieceState
    if (!('group' in piece)) {
      return (piece.isFresh = !piece.isFresh)
    }

    // When flipping in a group get the first piece that matches and flip it
    const toFlip = systems.value[piece.system].pieces.find(
      (p) => p.isFresh === isFresh && p.type === piece.type
    )
    if (toFlip) {
      toFlip.isFresh = !toFlip.isFresh
    }
  }

  function movePiece(piece: PieceState | PieceStateGroup, destination: SystemKey) {
    piece.system = destination
  }

  function parse(systemsConfig: SaveFile['board']['systems']) {
    // const patch: Partial<Record<string, SystemInfo>> = {}
    Object.entries(systemsConfig).forEach(([systemId, pieces]) => {
      pieces.forEach((piece: System) => {
        // Create for every count
        for (let i = piece.count ?? 1; i > 0; i--) {
          if (typeof piece.item === 'string') {
            piece.item = {
              type: piece.item
            }
          }

          addPiece(systemId as SystemKey, piece.item, undefined)
        }
      })
    })
  }

  function save() {
    const result: [SystemKey, (MapPiece | Multi<MapPiece>)[]][] = []
    Object.entries(systems.value).forEach(([id, info]) => {
      const overview = getSystemOverview(info.pieces)
      const transformed = overview.map(([piece, count]) => {
        return {
          item: {
            type: piece.type,
            color: piece.color
          },
          count
        }
      })
      // @ts-expect-error TODO: Check types with all pieces
      result.push([id as SystemKey, transformed])
    })
    return result
  }

  // TODO: Create a separate store for UI?
  function setSystemUi(systemId: SystemKey, { el, shape, bounds }: SystemUiConfig) {
    systems.value[systemId].config.el = el
    systems.value[systemId].config.shape = shape
    systems.value[systemId].config.bounds = bounds
  }

  return {
    systems,
    clusters,
    pieces,
    systemState,
    systemUi,
    updateState,
    addPiece,
    removePiece,
    flipPiece,
    movePiece,
    parse,
    save,
    setSystemUi,
    isSystemFull,
    $reset
  }
})
