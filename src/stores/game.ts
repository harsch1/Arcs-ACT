// Main store
import { defineStore } from 'pinia'
import { useSystemsStore } from './systems'

import test from '@/stores/test.json'
type ArchiveJson = typeof test

export const useGameStore = defineStore('game', () => {
  const systems = useSystemsStore()

  // Parse the game json and initialize the stores

  function initSystems(json: ArchiveJson) {
    systems.parse(json.board._systems)
  }

  function loadGame(json: ArchiveJson) {
    // initSystems(json)
    initSystems(test)
  }

  return { loadGame }
})
