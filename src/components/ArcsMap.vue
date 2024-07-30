<script setup lang="ts">
import type { Systems, System } from '@/Archive';

interface MapProps {
  systems: Systems | null
}

withDefaults(defineProps<MapProps>(), { systems: null });

const getTotalItemsForDebug = (systems: System[]): number => {
  let items: number = 0;
  for (let sys of systems) {
    items += sys.count ?? 0;
  }
  return items;
}

// TODO: Can we lookup the planet resource type from some premade array?
</script>

<template>
  <div v-if="!systems">
    <p>The prop is empty.</p>
  </div>
  <div v-else>
    <p>On the Relic planet in Cluster 2, there are this many items: {{ getTotalItemsForDebug(systems.get("2H") as
      System[]) }}.</p>
  </div>
</template>