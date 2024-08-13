// Main store
import localforage from 'localforage'
import { humanId } from 'human-id'
import { defineStore } from 'pinia'
import { useSystemsStore } from './systems'
import { kebabCase } from 'lodash'

import test from '@/stores/test.json'
import cc from '@/assets/decks/campaign-court.json'

test.scrap = cc

import { Archive, Color, Fate, Player, type Card, type SaveFile } from '@/Archive'
import { reactive, ref } from 'vue'
import { exportArchive, getFateName, isGameDeck } from '@/lib/utils'
export type GameDeck = 'court' | 'scrap' | 'rules'
export type GameCard = Card & {
  set: string
  location: string
  tags?: string[]
  meta?: {
    act?: number
  }
}
export type GameSettings = {
  act: number
  firstRegent: string
  // deck: {
  //   court: Map<string, GameCard>
  //   edicts: Map<string, GameCard>
  //   scrap: Map<string, GameCard>
  //   rules: Map<string, GameCard>
  // }
  cardPool: Map<string, GameCard>
}

export const CAMPAIGN_COURT = 'campaign-court'
// Prefix for the keys in storage
export const GAME_SAVE_PREFIX = 'save_'
export const GAME_TEST_ID = 'test'

export const useGameStore = defineStore('game', () => {
  const savedGames = ref<SaveFile[]>([])

  const systems = useSystemsStore()
  const players = ref<Player[]>([])
  const settings = reactive<GameSettings>({
    act: 1,
    firstRegent: '',
    // deck: {
    //   court: new Map(),
    //   edicts: new Map(),
    //   scrap: new Map(),
    //   rules: new Map()
    // },
    cardPool: new Map()
  })

  // // Returns the name of the card location (court, scrap, player, etc)
  // const cardLocation = computed(() => {
  //   return (cardId: string) => {
  //     let found: string | undefined

  //     // Look in the game decks
  //     Object.entries(settings.deck).forEach(([deck, cards]) => {
  //       if (found) {
  //         return
  //       }

  //       found = cards.has(cardId) ? deck : undefined
  //     })

  //     if (found) {
  //       return found
  //     }

  //     // Look in the player courts
  //     players.value.forEach((player) => {
  //       if (found) {
  //         return
  //       }

  //       found = player.cards.find((card) => card.id === cardId) ? player.name : undefined
  //     })

  //     return found
  //   }
  // })

  function $reset() {
    players.value = []
    settings.act = 1
    settings.firstRegent = ''
    // settings.deck = {
    //   court: new Map(),
    //   edicts: new Map(),
    //   scrap: new Map(),
    //   rules: new Map()
    // }
    settings.cardPool = new Map()
  }

  // Parse the game json and initialize the stores
  function initSettings(archive: SaveFile) {
    settings.act = archive.act
    settings.firstRegent = archive.firstRegent
    // settings.deck.edicts = new Map(archive.edicts.map((card) => [card.id, card]))
    // settings.deck.scrap = new Map(archive.scrap.map((card) => [card.id, card]))
  }

  function initPlayers(playersJSON: SaveFile['players']) {
    playersJSON.forEach((player) => {
      const newPlayer = new Player(player.name, player.color as Color, player.currentFate as Fate)
      newPlayer.cards = player.cards
      players.value.push(newPlayer)
    })
  }

  function initSystems(systemsJSON: SaveFile['board']['systems']) {
    systems.parse(systemsJSON)
  }

  /**
   * Loads the decks based on the players in the game, taking into account their fate history.
   * Also loads the campaign court deck by default and adds it to the 'court' location
   *
   * @param fromPlayers Players to load their fates. If not provided loads the fates of the current players
   */
  async function initCardPool(fromPlayers?: Player[]) {
    fromPlayers = fromPlayers ?? players.value
    const fates = fromPlayers
      .reduce((acc, player) => {
        const playerFates = [
          getFateName(player.currentFate),
          ...player.fateHistory.map((history) => getFateName(history[0]))
        ]
        acc = acc.concat(playerFates)
        return acc
      }, [] as Fate[])
      .filter((fate) => !!fate)

    // Load the court deck too
    const pool = await loadDecks([CAMPAIGN_COURT, ...fates])

    // settings.deck.court = new Map(
    //   pool.filter((card) => card.set === 'Court').map((card) => [card.id, card])
    // )
    // Init the court
    pool.forEach((card) => {
      if (card.set === 'Court') {
        card.location = 'court'
      }
    })
    settings.cardPool = new Map(pool.map((card) => [card.id, card]))
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

  async function loadGame(idOrRaw: string, raw?: boolean) {
    let archive: SaveFile | null = null

    if (raw) {
      try {
        archive = JSON.parse(idOrRaw)
      } catch (e) {
        console.info(`There was an error parsing the provided JSON`)
      }
    } else {
      // @ts-expect-error Ignore test file types
      archive = idOrRaw === GAME_TEST_ID ? test : await localforage.getItem(idOrRaw)

      if (!archive) {
        console.info(`Archive with ID '${idOrRaw}' couldn't be loaded`)
        return
      }
    }

    if (!archive) {
      console.info('There was an error loading the game')
      return
    }

    // Clear the previous archive
    $reset()
    systems.$reset()

    initSettings(archive)
    initPlayers(archive.players)
    initSystems(archive.board.systems)
    initCardPool(archive.players)
  }

  async function exportGame(id: string) {
    const archive = await localforage.getItem<SaveFile>(id)

    if (!archive) {
      return
    }

    exportArchive(archive)
  }

  function deleteGame(id: string) {
    localforage.removeItem(id)
  }

  function saveGame() {
    // Populate the archive
    const archive = new Archive(players.value)
    const systemsResult = systems.save()
    systemsResult.forEach(([system, pieces]) => archive.board.addPieces(system, pieces))

    for (const card of settings.cardPool.values()) {
      if (card.location === 'scrap') {
        archive.scrap.push({
          id: card.id,
          name: card.name
        })
      } else if (card.location === 'rules') {
        archive.edicts.push({
          id: card.id,
          name: card.name
        })
      }
    }
    // archive.scrap = Array.from(settings.deck.scrap.values(), (card) => {
    //   return {
    //     id: card.id,
    //     name: card.name
    //   }
    // })
    // archive.edicts = Array.from(settings.deck.edicts.values(), (card) => {
    //   return {
    //     id: card.id,
    //     name: card.name
    //   }
    // })

    // Create the file
    // Remove the verb from the id
    let id = humanId('_')
    id = GAME_SAVE_PREFIX + id.slice(0, id.lastIndexOf('_'))

    const save = {
      id,
      timestamp: new Date().toISOString(),
      ...archive
    }

    // Clone the archive and store it
    localforage.setItem(id, JSON.parse(JSON.stringify(save)))
  }

  function addPlayer(name: string, color: Color, fate?: Fate) {
    const player = new Player(name, color, fate ?? Fate.steward)
    players.value.push(player)
  }

  // Use the color to identify the players
  function updatePlayer(payload: Partial<Player> & { color: Color }) {
    const player = players.value.find((p) => p.color === payload.color)
    if (player) {
      Object.assign(player, payload)
    }
  }

  // Fills the players array based on the passed `Color`s
  function updatePlayers(colors: Color[]) {
    // Check for new players
    colors.forEach((color) => {
      const hasPlayer = players.value.find((p) => p.color === color)
      if (!hasPlayer) {
        addPlayer('', color)
      }
    })

    // Check for removed players
    players.value = players.value.filter((p) => colors.includes(p.color))
  }

  // Move a card from/to a location
  function moveCardTo(id: string, location: string) {
    if (!settings.cardPool.has(id)) {
      console.log(`Card ${id} not found`)
      return
    }

    const card = settings.cardPool.get(id)!
    const fromLocation = card.location

    card.location = location

    // Removed from a player
    if (fromLocation && !isGameDeck(fromLocation)) {
      const player = players.value.find((player) => player.name === fromLocation)!
      player.cards = player.cards.filter((card) => card.id !== id)
    }

    // Moved to a player
    if (!isGameDeck(location)) {
      const player = players.value.find((player) => player.name === location)!
      player.cards.push({
        id,
        name: card.name
      })
    }
  }
  // // Move a card from/to a location
  // function moveCardTo(id: string, location: string) {
  //   const found = cardLocation.value(id)

  //   if (!found) {
  //     return
  //   }

  //   // Remove the card
  //   // Found in decks
  //   let card: GameCard | undefined
  //   if (Object.keys(settings.deck).includes(found)) {
  //     card = settings.deck[found as keyof GameSettings['deck']].get(id)
  //     settings.deck[found as keyof GameSettings['deck']].delete(id)
  //   } else {
  //     // Found in player cards
  //     const player = players.value.find((player) => player.name === found)!
  //     card = player.cards.find((card) => card.id !== id)
  //     player.cards = player.cards.filter((card) => card.id !== id)
  //   }

  //   if (!card) {
  //     return
  //   }

  //   // Add to new location
  //   if (Object.keys(settings.deck).includes(location)) {
  //     settings.deck[location as keyof GameSettings['deck']].set(id, card)
  //   } else {
  //     const player = players.value.find((player) => player.name === location)!
  //     player.cards.push({
  //       id,
  //       name: card.name
  //     })
  //   }
  // }

  // Load games
  localforage.iterate((value, key) => {
    if (key.startsWith(GAME_SAVE_PREFIX)) {
      savedGames.value.push(value as SaveFile)
    }
  })

  return {
    savedGames,
    settings,
    players,
    // cardLocation,
    deleteGame,
    loadGame,
    saveGame,
    exportGame,
    addPlayer,
    updatePlayer,
    updatePlayers,
    moveCardTo,
    initCardPool,
    $reset
  }
})
