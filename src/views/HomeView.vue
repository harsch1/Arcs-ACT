<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { RouterLink, useRouter } from 'vue-router'
import GameLoader from '@/components/GameLoader.vue'

const router = useRouter()

function viewGame() {
  router.push('list')
}
</script>

<template>
  <main class="relative flex flex-col p-8 viewport">
    <img
      src="@/assets/images/arcs_logo.png"
      alt="Arcs"
    />
    <h1 class="mt-2 text-4xl font-bold subtitle">
      {{ $t('arcs_cat') }}
    </h1>
    <!-- <div class="h-[100px]">
      <img
        src="@/assets/images/archivist.png"
        alt="Archivist"
      />
    </div> -->

    <div class="flex flex-col mt-16">
      <RouterLink to="campaign">
        <Button class="w-full">
          {{ $t('common.create') }}
        </Button>
      </RouterLink>
      <h6 class="mt-1">{{ $t('campaign.new_help_text') }}</h6>

      <div class="my-4"></div>

      <GameLoader @loaded="viewGame">
        <Button>
          {{ $t('common.load') }}
        </Button>
      </GameLoader>
      <h6 class="mt-1">{{ $t('campaign.load_help_text') }}</h6>
    </div>
  </main>
</template>

<style scoped>
.viewport {
  position: relative;
  overflow: auto;
  height: calc(100% - 64px);
  height: calc(100dvh - 64px);
  margin: 0 auto;
}

.subtitle {
  word-spacing: 100vw;
}
</style>
