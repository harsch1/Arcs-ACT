import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import systemsUiConfig from '@/lib/systems-ui-config'

import { groupBy } from 'lodash'
import { BuildingType, Token } from '@/Archive'
import type { Color, MapPiece, Multi, ShipType } from '@/Archive'
import { getRandomInt, randomPointWithinSVG } from '@/lib/ui-utils'
import { getSystemOverview } from '@/lib/utils'

export type SystemId = (typeof systemsUiConfig)[number]['id']

export type SystemUiConfig = {
  el?: SVGGraphicsElement
  shape?: SVGPathElement
  bbox?: DOMRect
}

export type SystemConfig = (typeof systemsUiConfig)[number] & SystemUiConfig

type SystemInfo = {
  config: SystemConfig
  pieces: PieceState[]
  slots: {
    position: { x: number; y: number }
    isEmpty: boolean
  }[]
}

export type PieceState = {
  id: number
  type: BuildingType | Token | ShipType
  system: SystemId
  position: { x: number; y: number }
  color?: Color
  slot?: SystemInfo['slots'][number]
  isFlipped?: boolean
}

export type TokenPieceState = PieceState & { type: Token }

export type SystemStorePayload = {
  system: SystemId
  type: BuildingType | Token | ShipType
  // op: 'ADD' | 'REMOVE'
  count: number
  color?: Color
}

export const useSystemsStore = defineStore('systems', () => {
  // Simple id
  const id = ref(0)
  // Init based on the configuration
  const systems = ref(
    systemsUiConfig.reduce(
      (acc, config) => {
        acc[config.id] = {
          config,
          slots: config.slots.map((slot) => ({ ...slot, isEmpty: true })),
          pieces: []
        }

        return acc
      },
      {} as Record<SystemId, SystemInfo>
    )
  )

  const pieces = computed(() =>
    Object.values(systems.value).reduce(
      (acc, system) => acc.concat(system.pieces),
      [] as PieceState[]
    )
  )

  const systemState = computed(() => {
    return (systemId: SystemId) => {
      return systems.value[systemId]
    }
  })

  const systemUi = computed(() => {
    return (systemId: SystemId, prop?: keyof SystemConfig) => {
      if (prop) {
        return systems.value[systemId].config[prop]
      }
      return systems.value[systemId].config
    }
  })

  const clusters = computed(
    () =>
      groupBy(Object.keys(systems.value), (id: string) => id.charAt(0)) as Record<
        string,
        SystemId[]
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
        removePiece(piece)
      }
    } else {
      for (let i = payload.count; i > 0; i--) {
        const piece = {
          system: payload.system,
          type: payload.type,
          color: payload.color
        }
        addPiece(payload.system, piece)
      }
    }
  }

  function addPiece(system: SystemId, piece: any, position?: { x: number; y: number }) {
    const activeSystem = systems.value[system]

    if (!activeSystem) {
      return
    }

    // Since tokens are only a string they need to be transformed
    if (typeof piece === 'string') {
      piece = {
        type: piece
      }
    } else {
      // Copy to avoid mutating same reference
      piece = {
        ...piece
      }
    }

    if (Object.values(BuildingType).includes(piece.type)) {
      // Fill the first empty slot
      const slot = activeSystem.slots.find((s) => s.isEmpty)
      if (!slot) {
        console.info('No free slots')
        return
      }
      piece.slot = slot
      piece.position = slot.position
      slot.isEmpty = false
    } else {
      // // TODO: Improve placement
      // piece.position = position ?? activeSystem.config.bbox
      // piece.translation = randomPointWithinSVG(
      //   activeSystem.config.el,
      //   activeSystem.config.shape,
      //   activeSystem.config.bbox
      // )
      piece.position = position ??
        randomPointWithinSVG(
          activeSystem.config.el,
          activeSystem.config.shape,
          activeSystem.config.bbox
        ) ?? {
          x: getRandomInt(activeSystem.config.position.x, activeSystem.config.position.x + 100),
          y: getRandomInt(activeSystem.config.position.y, activeSystem.config.position.y + 100)
        }
    }

    piece.id = id.value++
    // Keep reference of system
    piece.system = system
    activeSystem.pieces.push(piece)
  }

  function removePiece(piece: PieceState) {
    const activeSystem = systems.value[piece.system]
    // const pieceIndex = activeSystem.pieces.findIndex((p) => p === piece)
    const pieceIndex = activeSystem.pieces.findIndex(
      (p) => p.type === piece.type && p.color === piece.color
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

  function flipPiece(piece: PieceState) {
    piece.isFlipped = !piece.isFlipped
  }

  function parse(systemsConfig: Record<string, Multi<MapPiece>[]>) {
    // const patch: Partial<Record<string, SystemInfo>> = {}
    Object.entries(systemsConfig).forEach(([systemId, pieces]) => {
      pieces.forEach((piece) => {
        // Create for every count
        for (let i = piece.count ?? 1; i > 0; i--) {
          addPiece(systemId, piece.item)
        }
      })
    })
  }

  function save() {
    const result: [SystemId, (MapPiece | Multi<MapPiece>)[]][] = []
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
      result.push([id as SystemId, transformed])
    })
    return result
  }

  // TODO: Create a separate store for UI?
  function setSystemUi(systemId: SystemId, { el, shape, bbox }: SystemUiConfig) {
    systems.value[systemId].config.el = el
    systems.value[systemId].config.shape = shape
    systems.value[systemId].config.bbox = bbox
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
    parse,
    save,
    setSystemUi
  }
})
