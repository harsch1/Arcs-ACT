<script setup lang="ts">
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { RouterLink, useRouter } from 'vue-router'
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import GameLoader from '@/components/GameLoader.vue'

import { GAME_TEST_ID, useGameStore } from '@/stores/game'
import { ref } from 'vue'

const router = useRouter()
const store = useGameStore()
const open = ref(false)

function viewGame() {
  open.value = false

  if (
    router.currentRoute.value.name !== 'list_view' &&
    router.currentRoute.value.name !== 'campaign'
  ) {
    router.push('list')
  }
}

function loadTestGame(id: string) {
  store.loadGame(id)
  viewGame()
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger>
      <Menu
        class="px-2 menu"
        :size="48"
      />
    </SheetTrigger>
    <SheetContent side="left">
      <SheetHeader>
        <SheetTitle>
          {{ $t('arcs_cat') }}
        </SheetTitle>
        <SheetDescription>
          <img
            :alt="$t('arcs_cat')"
            class="logo"
            src="@/assets/images/archivist.png"
          />
        </SheetDescription>
      </SheetHeader>

      <ul @click="open = false">
        <li>
          <RouterLink to="/">
            {{ $t('common.home') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/new_campaign">
            {{ $t('campaign.new') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/campaign">
            {{ $t('campaign.map_view') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/list">
            {{ $t('campaign.list_view') }}
          </RouterLink>
        </li>
        <li>
          <GameLoader @loaded="viewGame">
            <Button
              class="w-full my-2"
              @click.stop
            >
              {{ $t('common.load') }} / {{ $t('common.export') }}
            </Button>
          </GameLoader>
        </li>
        <li>
          <Button
            class="w-full my-2"
            @click="loadTestGame(GAME_TEST_ID)"
            >{{ $t('common.load') }} test</Button
          >
        </li>
      </ul>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
.logo {
  height: 128px;
  margin: 0 auto;
}

.menu {
  position: fixed;
  top: 8px;
  left: 8px;
}

li > * {
  display: inline-block;
  padding-top: theme('spacing.2');
  padding-bottom: theme('spacing.2');
}
</style>
