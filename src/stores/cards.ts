// Store to manage the cards
import { defineStore } from 'pinia'
import { useGameStore } from '@/stores/game'
import { kebabCase } from 'lodash'

import test from '@/stores/test.json'
import cc from '@/assets/decks/campaign-court.json'

test.scrap = cc

import { Fate, Player, type Card } from '@/Archive'
import { ref } from 'vue'
import { getFateId, getFateName, isGameDeck } from '@/lib/utils'

export type GameDeck = 'court' | 'scrap' | 'rules'
export type GameCard = Card & {
  set: string
  location: string
  tags?: string[]
  text?: string
  meta?: {
    act?: number
  }
}
export type FateCardConfig = {
  gain?: string[]
  court?: string[]
  rules?: string[]
  tuck?: string[]
}
export type FateAct = FateSetup & FateResolution
type FateSetup = {
  [actSetup in 'setup_1' | 'setup_2' | 'setup_3']?: FateCardConfig
}
type FateResolution = {
  [actResolution in 'act_1' | 'act_2']?: {
    completed: FateCardConfig
    failed: FateCardConfig
  }
}

export const CAMPAIGN_COURT = 'campaign-court'
export const ACTION_CARDS = 'action-cards'

export const useCardsStore = defineStore('cards', () => {
  const gameStore = useGameStore()
  const pool = ref(new Map<string, GameCard>())

  function $reset() {
    pool.value = new Map()
  }

  /**
   * Loads the setups for the fates in play and assigns the cards to their
   * corresponding location. Takes into account if the fates succeeded or failed
   * in previous acts.
   */
  async function autoAssign() {
    const logger: string[] = []
    const fates = gameStore.players.reduce(
      (acc, player) => {
        const playerFates: [string, string, boolean | undefined, number][] = player.fateHistory.map(
          (history, i) => [player.name, getFateName(history[0]), history[2], i + 1]
        )

        acc = acc.concat(playerFates)
        return acc
      },
      [] as [playerName: string, fateName: string, succeeded: boolean | undefined, act: number][]
    )

    const setups = await loadSetups(fates.map((f) => f[1]))

    fates.forEach(([playerName, fate, succeeded, act]) => {
      const fateId = getFateId(fate)
      const resolution = succeeded !== undefined ? `act_${act}` : undefined
      const objective = succeeded ? 'completed' : 'failed'

      const config = setups[fate]

      // Always add the fate setup
      const operations: [string, string[]][] = [
        ...Object.entries(config[`setup_${act}` as keyof FateSetup]!)
      ]
      if (resolution) {
        operations.push(...Object.entries(config[resolution as keyof FateResolution]![objective]))
      }

      operations.forEach(([op, indices]) => {
        switch (op) {
          case 'gain':
            logger.push(
              ...indices.map((cardIndex) =>
                moveCardTo(`${fateId}-${cardIndex}`, playerName, { logger: true })
              )
            )
            break
          case 'court':
          case 'scrap':
          case 'rules':
            logger.push(
              ...indices.map((cardIndex) =>
                moveCardTo(`${fateId}-${cardIndex}`, op, { logger: true })
              )
            )
            break
          case 'tuck':
            logger.push(`Do the following: ${pool.value.get(indices[0])?.text}`)
            break
        }
      })
    })

    return logger
  }

  /**
   * Loads the decks based on the players in the game, taking into account their fate history.
   * Loads the campaign court deck by default and adds it to the 'court' location.
   * Loads the action cards by default and adds it to the pool.
   *
   * @param players Players to load their fates. If not provided loads the fates of the current players
   */
  async function initPool(players?: Player[]) {
    players ??= gameStore.players
    const fates = players
      .reduce((acc, player) => {
        const playerFates = [
          // getFateName(player.currentFate),
          ...player.fateHistory.map((history) => getFateName(history[0]))
        ]
        acc = acc.concat(playerFates)
        return acc
      }, [] as Fate[])
      .filter((fate) => !!fate)

    // Load the court and action cards deck too
    const _pool = await loadDecks([ACTION_CARDS, CAMPAIGN_COURT, ...fates])

    // Init the court
    _pool.forEach((card) => {
      if (card.set === 'Court') {
        card.location = 'court'
      }
    })
    pool.value = new Map(_pool.map((card) => [card.id, card]))
  }

  async function loadDecks(name: string | string[]) {
    let pool: GameCard[] = []
    name = Array.isArray(name) ? name : [name]

    await Promise.all(
      name.map(async (n) => {
        try {
          const { default: deck } = await import(`@/assets/decks/${kebabCase(n)}.json`)
          pool = pool.concat(deck)
        } catch (e) {
          console.log(e)
        }
      })
    )

    return pool
  }

  async function loadSetups(name: string | string[]) {
    const setup: Record<string, FateAct> = {}
    name = Array.isArray(name) ? name : [name]

    await Promise.all(
      name.map(async (n) => {
        try {
          const { default: config } = await import(`@/assets/setups/${kebabCase(n)}.json`)
          setup[n] = config
        } catch (e) {
          console.log(e)
        }
      })
    )

    return setup
  }

  // Move a card from/to a location
  function moveCardTo(id: string, location: string, options: { logger: true }): string
  function moveCardTo(id: string, location: string): undefined
  function moveCardTo(id: string, location: string, options?: { logger?: boolean }) {
    if (!pool.value.has(id)) {
      // Check if it's a 'sided' card
      if (!pool.value.has(id + 'A')) {
        console.log(`Card ${id} not found`)
        return
      }
      id = id + 'A'
    }

    const card = pool.value.get(id)!
    const fromLocation = card.location

    card.location = location

    // Removed from a player
    if (fromLocation && !isGameDeck(fromLocation)) {
      const player = gameStore.players.find((player) => player.name === fromLocation)!
      player.cards = player.cards.filter((card) => card.id !== id)
    }

    // Moved to a player
    if (!isGameDeck(location)) {
      const player = gameStore.players.find((player) => player.name === location)!
      player.cards.push({
        id,
        name: card.name
      })
    }

    if (options?.logger) {
      const log = []
      if (fromLocation) {
        let str = `removed <strong>${card.id}</strong> - ${card.name}`
        if (isGameDeck(fromLocation)) {
          str += ` from <strong>${fromLocation}</strong> deck`
        } else {
          str += ` from player <strong>${fromLocation}</strong>`
        }
        log.push(str)
      }

      let str = `added <strong>${card.id}</strong> - ${card.name}`
      if (isGameDeck(location)) {
        str += ` to <strong>${location}</strong> deck`
      } else {
        str += ` to player <strong>${location}</strong>`
      }
      log.push(str)

      return log.join(' and ')
    }
  }

  return {
    pool,
    moveCardTo,
    initPool,
    autoAssign,
    $reset
  }
})
