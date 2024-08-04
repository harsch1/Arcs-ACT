<script lang="ts" setup>
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Settings } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import SystemDialog from '@/components/SystemDialog.vue'

import { useSystemsStore } from '@/stores/systems'
import type { SystemId } from '@/stores/systems'
import { ref } from 'vue'
import { getSystemOverview } from '@/lib/utils'

const systemsStore = useSystemsStore()
const activeSystem = ref<SystemId | null>()

function updateDialog(open: boolean) {
  if (!open) {
    activeSystem.value = null
  }
}
</script>

<template>
  <div class="px-4">
    <p class="w-full text-lg">{{ $t('campaign.board_state_help') }}</p>
    <Accordion type="multiple">
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
                <span class="text-left grow">{{ $t('system') }} {{ system }}</span>
                <Button
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
                      systemsStore.systemState(system).pieces
                    )"
                    :key="i"
                  >
                    {{ count }}
                    {{
                      piece.color
                        ? `${$t(`colors.${piece.color}`)} ${$t(`pieces.${piece.type}`, count)}`
                        : $t(`pieces.${piece.type}`, count)
                    }}
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>

  <SystemDialog
    v-if="activeSystem"
    :default-open="true"
    :system-id="activeSystem"
    @confirm="$emit('close')"
    @update:open="updateDialog"
  >
  </SystemDialog>
</template>
