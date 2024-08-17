<script setup lang="ts">
import { type SaveFile, type Systems } from '@/Archive'
import ArcsMap from '../components/ArcsMap.vue'
import exampleGame from '../example-data/example-game-1.json'

const game: SaveFile = exampleGame as unknown as SaveFile
const systemsAsMap: Systems = new Map(Object.entries(game.board.systems)) as Systems
</script>
<template>
  In the current save file, there are <strong>{{ game.players.length }} players.</strong>
  <ArcsMap :systems="systemsAsMap"></ArcsMap>
</template>
