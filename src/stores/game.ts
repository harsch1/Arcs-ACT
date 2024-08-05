// Main store
import localforage from 'localforage'
import { humanId } from 'human-id'
import { defineStore } from 'pinia'
import { useSystemsStore } from './systems'

import test from '@/stores/test.json'
import { Archive, Color, Fate, Player } from '@/Archive'
import { reactive, ref } from 'vue'

type ArchiveJSON = typeof test
type GameSettings = {
  act: number
}

// Prefix for the keys in storage
export const GAME_SAVE_PREFIX = 'save_'
export const GAME_TEST_ID = 'test'

export const useGameStore = defineStore('game', () => {
  const savedGames = ref<ArchiveJSON[]>([])

  const systems = useSystemsStore()
  const players = ref<Player[]>([])
  const settings = reactive<GameSettings>({
    act: 1
  })

  // Parse the game json and initialize the stores
  function initSettings(archive: ArchiveJSON) {
    settings.act = archive.act
  }

  function initPlayers(playersJSON: ArchiveJSON['players']) {
    playersJSON.forEach((player) => {
      players.value.push(new Player(player.name, player.color as Color, player.currentFate as Fate))
    })
  }

  function initSystems(systemsJSON: ArchiveJSON['board']['_systems']) {
    systems.parse(systemsJSON)
  }

  async function loadGame(idOrRaw: string, raw?: boolean) {
    let archive: ArchiveJSON | null = null

    if (raw) {
      try {
        archive = JSON.parse(idOrRaw)
      } catch (e) {
        console.info(`There was an error parsing the provided JSON`)
      }
    } else {
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

    initSettings(archive)
    initPlayers(archive.players)
    initSystems(archive.board._systems)
  }

  function deleteGame(id: string) {
    localforage.removeItem(id)
  }

  function saveGame() {
    const archive = new Archive(players.value)
    const systemsResult = systems.save()
    systemsResult.forEach(([system, pieces]) => archive.board.addPieces(system, pieces))

    // Remove the verb from the id
    let id = humanId('_')
    id = GAME_SAVE_PREFIX + id.slice(0, id.lastIndexOf('_'))
    // @ts-expect-error TODO: Extend archive with this
    archive.id = id
    // @ts-expect-error TODO: Extend archive with this
    archive.timestamp = new Date().toISOString()

    // Clone the archive and store it
    localforage.setItem(id, JSON.parse(JSON.stringify(archive)))
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

  // Load games
  localforage.iterate((value, key) => {
    if (key.startsWith(GAME_SAVE_PREFIX)) {
      savedGames.value.push(value as ArchiveJSON)
    }
  })

  return {
    savedGames,
    settings,
    players,
    deleteGame,
    loadGame,
    saveGame,
    addPlayer,
    updatePlayer,
    updatePlayers
  }
})
