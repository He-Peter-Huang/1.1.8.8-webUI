<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import landData from 'world-atlas/land-110m.json'
import { useNodeStats } from '../composables/useQueryStats.js'

const { t } = useI18n()
const { nodes: nodeStats, lastSync } = useNodeStats()

const landPath = ref('')

const LW = 95  // label width
const LH = 40  // label height

const geoNodes = [
  { key: 'los_angeles', lon: -118.24, lat: 34.05, labelDx: -(LW + 14), labelDy: 10 },
  { key: 'new_jersey', lon: -74.17, lat: 40.73, labelDx: 18, labelDy: -12 },
  { key: 'frankfurt', lon: 8.68, lat: 50.11, labelDx: 18, labelDy: -14 },
  { key: 'singapore', lon: 103.85, lat: 1.29, labelDx: 18, labelDy: -6 },
  { key: 'tokyo', lon: 139.69, lat: 35.69, labelDx: 18, labelDy: -14 },
  { key: 'shanghai', lon: 121.47, lat: 31.23, labelDx: -(LW + 14), labelDy: 6 },
]

const width = 1200
const height = 520
const projection = geoNaturalEarth1()
  .scale(215)
  .translate([width / 2, height / 2 + 25])

const pathGen = geoPath(projection)

const projectedNodes = geoNodes.map(n => {
  const [x, y] = projection([n.lon, n.lat])
  return { ...n, x, y }
})

const liveNodes = computed(() =>
  projectedNodes.map((pn, i) => ({
    ...pn,
    ...nodeStats.value[i],
  }))
)

const totalQps = computed(() =>
  nodeStats.value.reduce((sum, n) => sum + n.qps, 0)
)

onMounted(() => {
  const land = feature(landData, landData.objects.land)
  landPath.value = pathGen(land)
})
</script>

<template>
  <div class="hud-panel hud-corners p-5 sm:p-8">
    <!-- Header bar -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-glow/30">
      <div class="flex items-center gap-5">
        <div class="flex items-center gap-2">
          <span class="status-dot"></span>
          <span class="text-xs font-mono text-green-400/60 uppercase tracking-wider">{{ t('home.map_all_operational') }}</span>
        </div>
        <div class="hidden sm:flex items-center gap-2 pl-5 border-l border-border-glow/30">
          <span class="text-xs font-mono text-white/25">{{ t('home.map_total_qps') }}</span>
          <span class="text-lg font-mono font-bold text-cyan tabular-nums">{{ totalQps.toLocaleString() }}</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="hidden sm:flex items-center gap-2">
          <span class="text-xs font-mono text-white/20">{{ t('home.map_last_sync') }}</span>
          <span class="text-xs font-mono text-cyan/50 tabular-nums">{{ lastSync }}</span>
        </div>
        <span class="text-xs font-mono text-white/15">{{ t('home.map_topology') }}</span>
      </div>
    </div>

    <!-- Map -->
    <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-auto" style="overflow: visible;">
      <defs>
        <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <clipPath id="mapClip">
        <rect x="0" y="0" :width="width" :height="height" />
      </clipPath>

      <g clip-path="url(#mapClip)">
        <!-- Grid lines -->
        <line
          v-for="i in 10" :key="'gh'+i"
          :x1="0" :y1="i * (height / 11)" :x2="width" :y2="i * (height / 11)"
          stroke="rgba(26,58,92,0.12)" stroke-width="0.5"
        />
        <line
          v-for="i in 23" :key="'gv'+i"
          :x1="i * (width / 24)" :y1="0" :x2="i * (width / 24)" :y2="height"
          stroke="rgba(26,58,92,0.12)" stroke-width="0.5"
        />

        <!-- Land mass -->
        <path
          v-if="landPath"
          :d="landPath"
          fill="rgba(26, 58, 92, 0.2)"
          stroke="rgba(26, 58, 92, 0.4)"
          stroke-width="0.6"
        />
      </g>

      <!-- Nodes + labels -->
      <g v-for="(n, i) in liveNodes" :key="'node'+n.key">
        <!-- Pulse ring -->
        <circle :cx="n.x" :cy="n.y" r="14" fill="none" stroke="rgba(34,197,94,0.2)" stroke-width="1" filter="url(#nodeGlow)">
          <animate attributeName="r" values="10;24;10" dur="3s" :begin="`${i * 0.5}s`" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" :begin="`${i * 0.5}s`" repeatCount="indefinite" />
        </circle>
        <!-- Outer ring -->
        <circle :cx="n.x" :cy="n.y" r="8" fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.3)" stroke-width="0.8" />
        <!-- Inner dot -->
        <circle :cx="n.x" :cy="n.y" r="4.5" fill="#22C55E" />
        <circle :cx="n.x" :cy="n.y" r="2" fill="#fff" opacity="0.85" />

        <!-- Leader line -->
        <line
          :x1="n.x" :y1="n.y"
          :x2="n.x + n.labelDx + (n.labelDx > 0 ? 0 : LW)" :y2="n.y + n.labelDy + LH / 2"
          stroke="rgba(34,197,94,0.15)" stroke-width="0.6"
        />

        <!-- Data label -->
        <g :transform="`translate(${n.x + n.labelDx}, ${n.y + n.labelDy})`">
          <rect x="0" y="0" :width="LW" :height="LH" fill="rgba(5,10,24,0.9)" stroke="rgba(26,58,92,0.4)" stroke-width="0.6" rx="1.5" />
          <!-- Top accent -->
          <rect x="0" y="0" :width="LW" height="1" fill="rgba(34,197,94,0.3)" rx="0.5" />
          <!-- QPS -->
          <text x="6" y="16" fill="rgba(0,240,255,0.85)" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">{{ n.qps.toLocaleString() }}</text>
          <text :x="LW - 6" y="16" fill="rgba(255,255,255,0.2)" font-family="'JetBrains Mono', monospace" font-size="7.5" text-anchor="end">qps</text>
          <!-- Latency + uptime -->
          <text x="6" y="32" fill="rgba(34,197,94,0.7)" font-family="'JetBrains Mono', monospace" font-size="10">{{ n.latency }}ms</text>
          <text :x="LW - 6" y="32" fill="rgba(255,255,255,0.15)" font-family="'JetBrains Mono', monospace" font-size="8" text-anchor="end">{{ n.uptime }}%</text>
        </g>
      </g>
    </svg>

    <!-- Node list -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-3 border-t border-border-glow/30">
      <div
        v-for="n in liveNodes"
        :key="n.key"
        class="flex items-center gap-2.5"
      >
        <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)] shrink-0"></span>
        <div class="min-w-0">
          <div class="text-xs font-mono text-white/50 truncate leading-tight">{{ t(`nodes.${n.key}`) }}</div>
          <div class="text-[10px] font-mono text-cyan/40 tabular-nums leading-tight">
            {{ n.qps.toLocaleString() }} {{ t('home.map_node_qps') }}
            <span class="text-white/15 mx-0.5">|</span>
            {{ n.latency }}ms
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
