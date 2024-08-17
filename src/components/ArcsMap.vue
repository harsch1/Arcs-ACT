<script setup lang="ts">
import {
  type Systems,
  type SystemKey,
  type Cluster,
  type MapPiece,
  type Token,
  TokenType,
  Resource
} from '@/Archive'

interface MapProps {
  systems: Systems | null
}

withDefaults(defineProps<MapProps>(), { systems: null })

const clusters: Cluster[] = [1, 2, 3, 4, 5, 6]

function getMapKeysFromCluster(cluster: Cluster): SystemKey[] {
  return [`${cluster}A`, `${cluster}C`, `${cluster}H`, `${cluster}G`]
}

function isToken(mapPiece: MapPiece | string): mapPiece is Token | TokenType {
  if (typeof mapPiece === 'string') {
    return Object.values(TokenType).includes(mapPiece as TokenType)
  }

  return Object.values(TokenType).includes(mapPiece.type as TokenType)
}

function mapPieceToString(piece: MapPiece | TokenType): string {
  if (isToken(piece)) {
    if (typeof piece === 'string') {
      return `${piece.toLocaleLowerCase()} token`
    }
    return `${piece.type.toLocaleLowerCase()} token`
  }
  return `${piece.type.toLocaleLowerCase()} (${piece.color.toLocaleLowerCase()})`
}

const mapKeyResourceTypeLookup: Record<SystemKey, Resource | null> = {
  '1A': Resource.weapon,
  '1C': Resource.fuel,
  '1H': Resource.material,
  '1G': null,
  '2A': Resource.psionic,
  '2C': Resource.weapon,
  '2H': Resource.relic,
  '2G': null,
  '3A': Resource.material,
  '3C': Resource.fuel,
  '3H': Resource.weapon,
  '3G': null,
  '4A': Resource.relic,
  '4C': Resource.fuel,
  '4H': Resource.material,
  '4G': null,
  '5A': Resource.weapon,
  '5C': Resource.relic,
  '5H': Resource.psionic,
  '5G': null,
  '6A': Resource.material,
  '6C': Resource.fuel,
  '6H': Resource.psionic,
  '6G': null
}

function mapKeyToString(SystemKey: SystemKey): string {
  const resource = mapKeyResourceTypeLookup[SystemKey]
  if (!resource) {
    return `${SystemKey} (gate)`
  }
  return `${SystemKey} (${resource.toLocaleLowerCase()})`
}
</script>

<template>
  <div v-if="!systems">
    <p>The prop is empty.</p>
  </div>
  <div v-else>
    <section class="map">
      <template
        v-for="cluster in clusters"
        :key="cluster"
      >
        <div class="cluster">
          <h2 class="clusterTitle">Cluster {{ cluster }}</h2>
          <div class="clusterContents">
            <template
              v-for="SystemKey in getMapKeysFromCluster(cluster)"
              :key="SystemKey"
            >
              <div class="SystemKey">{{ mapKeyToString(SystemKey) }}</div>
              <div class="systemContents">
                <template
                  v-for="system in systems.get(SystemKey)"
                  :key="system.type + '' + system.count"
                >
                  <div class="systemInfo">{{ mapPieceToString(system.item) }}</div>
                </template>
              </div>
            </template>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<style>
.map {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.clusterTitle {
  font-weight: bold;
}

.systemInfo {
  margin-left: 2em;
}
</style>
