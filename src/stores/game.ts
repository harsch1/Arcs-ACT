// Main store
import localforage from 'localforage'
import { defineStore } from 'pinia'
import { computed, nextTick, reactive, ref } from 'vue'
import { exportArchive, generateName } from '@/lib/utils'
import { useSystemsStore } from '@/stores/systems'
import { useCardsStore } from '@/stores/cards'
import { Archive, Color, Fate, Player, type SaveFile } from '@/Archive'
import i18n from '@/i18n'

import test from '@/stores/test.json'
import type { ISOStringFormat } from 'date-fns'
import { snakeCase } from 'lodash'
import { useUiStore } from '@/stores/ui'

export type GameSettings = {
  id?: string
  name?: string
  act: number
  firstRegent: string
  notes: string
}

// Prefix for the keys in storage
export const GAME_SAVE_PREFIX = 'save_'
export const GAME_TEST_ID = 'test'

export const useGameStore = defineStore('game', () => {
  const savedGames = ref(new Map<string, SaveFile>())

  const ui = useUiStore()
  const cards = useCardsStore()
  const systems = useSystemsStore()
  const players = ref<Player[]>([])
  const settings = reactive<GameSettings>({
    id: undefined,
    name: undefined,
    act: 1,
    firstRegent: '',
    notes: ''
  })

  const isGameLoaded = computed(() => settings.id !== undefined)

  function $reset() {
    players.value = []
    settings.id = undefined
    settings.name = undefined
    settings.act = 1
    settings.firstRegent = ''
    settings.notes = ''
    systems.$reset()
  }

  // Parse the game json and initialize the stores
  function initSettings(archive: SaveFile) {
    settings.id = archive.id
    settings.name = archive.name
    settings.act = archive.act
    settings.firstRegent = archive.firstRegent
    settings.notes = archive.notes
  }

  function initPlayers(playersJSON: SaveFile['players']) {
    playersJSON.forEach((player) => {
      const newPlayer = new Player(player.name, player.color as Color, player.currentFate as Fate)
      Object.assign(newPlayer, player)
      players.value.push(newPlayer)
    })
  }

  function initSystems(systemsJSON: SaveFile['board']['systems']) {
    systems.parse(systemsJSON)
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

    nextTick(() => {
      initSettings(archive)
      initPlayers(archive.players)
      // @ts-expect-error TODO: Why is this property needed?
      initSystems(archive.board._systems)
      cards.initPool(archive.players)
    })
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
    savedGames.value.delete(id)
  }

  async function updateGame(id: string, payload: SaveFile) {
    const save = await localforage.getItem<SaveFile>(id)

    if (save) {
      Object.assign(save, payload)
      localforage.setItem(id, JSON.parse(JSON.stringify(save)))
    }
  }

  /**
   * Creates or updates a save file.
   * When the ID is received updates the existing save,
   * else it creates a new save.
   *
   * @param id ID of the current save
   * @returns string: name or ID of the save
   */
  async function saveGame(id?: string) {
    // Populate the archive
    const archive = new Archive(players.value)
    const systemsResult = systems.save()
    systemsResult.forEach(([system, pieces]) => archive.board.addPieces(system, pieces))

    for (const card of cards.pool.values()) {
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

    let name: string, save: Partial<SaveFile>
    if (!id) {
      name = settings.name ?? generateName()
      id = GAME_SAVE_PREFIX + snakeCase(name)
      save = {
        name,
        timestamp: new Date().toISOString() as ISOStringFormat
      }
    } else {
      const _save = await localforage.getItem<SaveFile>(id)
      save = _save ?? {}
    }

    save = {
      id,
      ...save,
      ...archive
    }

    // Clone the archive to be able to save it to localforage
    await localforage.setItem(id, JSON.parse(JSON.stringify(save)))

    return save
  }

  function addPlayer(name: string, color: Color, fate?: Fate) {
    if (name === '') {
      name = i18n.global.t(`colors.${color}`)
    }
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

  async function listGames() {
    await localforage.iterate((value, key) => {
      if (key.startsWith(GAME_SAVE_PREFIX)) {
        savedGames.value.set(key, value as SaveFile)
      }
    })
  }

  // Initial listing
  listGames()

  return {
    savedGames,
    settings,
    players,
    isGameLoaded,
    deleteGame,
    listGames,
    loadGame,
    saveGame,
    updateGame,
    exportGame,
    addPlayer,
    updatePlayer,
    updatePlayers,
    $reset
  }
})
