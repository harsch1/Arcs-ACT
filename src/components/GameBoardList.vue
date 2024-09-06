<script lang="ts" setup>
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Settings, Map } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import SystemDialog from '@/components/SystemDialog.vue'

import { useSystemsStore } from '@/stores/systems'
import { ref } from 'vue'
import { getSystemOverview } from '@/lib/utils'
import type { SystemKey } from '@/Archive'
import { RouterLink } from 'vue-router'

const systemsStore = useSystemsStore()
const activeSystem = ref<SystemKey | null>()

function updateDialog(open: boolean) {
  if (!open) {
    activeSystem.value = null
  }
}
</script>

<template>
  <div class="px-4 pb-10">
    <p class="w-full py-2 text-lg">{{ $t('campaign.board_state_help') }}</p>
    <Accordion
      type="multiple"
      :default-value="['1', '2', '3', '4', '5', '6']"
    >
      <AccordionItem
        v-for="(systems, cluster) in systemsStore.clusters"
        :key="cluster"
        :value="cluster"
        class="border-b-0"
      >
        <AccordionTrigger>{{ $t('cluster') }} {{ cluster }}</AccordionTrigger>
        <AccordionContent class="pl-6">
          <Accordion type="multiple">
            <AccordionItem
              v-for="system in systems"
              :key="system"
              :value="system"
            >
              <AccordionTrigger class="py-1">
                <div class="flex items-center grow">
                  {{ $t('system') }}
                  <span class="ml-2">
                    {{ system.charAt(0) }}
                  </span>
                  <img
                    v-if="system.charAt(1) === 'A'"
                    class="h-[1rem]"
                    src="/images/symbol_arrow.png"
                    alt="Arrow"
                  />
                  <img
                    v-else-if="system.charAt(1) === 'H'"
                    class="h-[1rem]"
                    src="/images/symbol_hex.png"
                    alt="Hex"
                  />
                  <img
                    v-else-if="system.charAt(1) === 'C'"
                    class="h-[1rem]"
                    src="/images/symbol_moon.png"
                    alt="Moon"
                  />
                  <span
                    v-else
                    class="mr-2"
                  >
                    G
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  class="self-end"
                  @click.stop="activeSystem = system"
                >
                  <Settings />
                </Button>
              </AccordionTrigger>
              <AccordionContent>
                <ul>
                  <li
                    v-for="([piece, count], i) in getSystemOverview(
                      systemsStore.systemState(system).pieces,
                      { freshness: true }
                    )"
                    :key="i"
                  >
                    <template v-if="Array.isArray(count)">
                      {{ count[0] + count[1] }}
                      {{
                        piece.color
                          ? `${$t(`colors.${piece.color}`)} ${$t(`pieces.${piece.type}`, count)}`
                          : $t(`pieces.${piece.type}`, count)
                      }}
                      ({{ count[0] }} {{ $t('fresh') }}, {{ count[1] }} {{ $t('damaged') }})
                    </template>
                    <template v-else>
                      {{ count }}
                      {{
                        piece.color
                          ? `${$t(`colors.${piece.color}`)} ${$t(`pieces.${piece.type}`, count)}`
                          : $t(`pieces.${piece.type}`, count)
                      }}
                    </template>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>

  <!-- Float button -->
  <div class="space-y-1 map-controls">
    <RouterLink
      :to="{ name: 'map' }"
      v-slot="{ navigate }"
      custom
    >
      <Button
        size="icon"
        @click="navigate"
      >
        <Map />
      </Button>
    </RouterLink>
  </div>

  <SystemDialog
    v-if="activeSystem"
    :default-open="true"
    :system-id="activeSystem"
    @update:open="updateDialog"
  >
  </SystemDialog>
</template>

<style scoped>
.map-controls {
  @apply pb-safe-offset-2 px-safe-offset-2 right-0;
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: 68px;
}
</style>
