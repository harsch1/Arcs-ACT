<script setup lang="ts">
import GameBoard from '@/components/GameBoard.vue'
</script>

<template>
  <main class="relative viewport">
    <GameBoard />
  </main>
</template>

<style scoped>
.viewport {
  position: relative;
  overflow: auto;
  height: calc(100% - 64px);
  height: calc(100dvh - 64px);
}
</style>
