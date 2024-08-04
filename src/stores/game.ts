// Main store
import localforage from 'localforage'
import { humanId } from 'human-id'
import { defineStore } from 'pinia'
import { useSystemsStore } from './systems'

import test from '@/stores/test.json'
import { Archive, Color, Fate, Player } from '@/Archive'
import { ref } from 'vue'
type ArchiveJSON = typeof test

// Prefix for the keys in storage
const GAME_SAVE_PREFIX = 'save_'

export const useGameStore = defineStore('game', () => {
  const savedGames = ref<ArchiveJSON[]>([])

  const systems = useSystemsStore()
  const players = ref<Player[]>([])

  // Parse the game json and initialize the stores

  function initPlayers(playersJSON: ArchiveJSON['players']) {
    console.log(playersJSON)
    playersJSON.forEach((player) => {
      players.value.push(new Player(player.name, player.color as Color, player.currentFate as Fate))
    })
  }

  function initSystems(systemsJSON: ArchiveJSON['board']['_systems']) {
    systems.parse(systemsJSON)
  }

  function loadGame(json: ArchiveJSON) {
    // initSystems(json)
    initPlayers(test.players)
    initSystems(test.board._systems)
  }

  function saveGame() {
    const archive = new Archive(players.value)
    const systemsResult = systems.save()
    systemsResult.forEach(([system, pieces]) => archive.board.addPieces(system, pieces))

    const id = GAME_SAVE_PREFIX + humanId({ separator: '_', adjectiveCount: 1, addAdverb: false })
    // @ts-expect-error TODO: Extend archive with this
    archive.id = id
    // @ts-expect-error TODO: Extend archive with this
    archive.timestamp = new Date().toISOString()

    localforage.setItem(id, JSON.stringify(archive))
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

  return { savedGames, players, loadGame, saveGame, addPlayer, updatePlayer, updatePlayers }
})
