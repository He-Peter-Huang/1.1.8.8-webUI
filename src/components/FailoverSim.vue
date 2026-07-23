<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import landData from 'world-atlas/land-110m.json'
import { useDiagramLoop } from '../composables/useDiagramLoop.js'
import { useFullscreen } from '../composables/useFullscreen.js'
import PhaseStepper from './diagram/PhaseStepper.vue'
import EventLog from './diagram/EventLog.vue'

const { t } = useI18n()

/* ── Map ─────────────────────────────────────────────────── */
const MAP_W = 1200
const MAP_H = 520
const projection = geoNaturalEarth1().scale(215).translate([MAP_W / 2, MAP_H / 2 + 25])
const pathGen = geoPath(projection)
const landPath = ref('')

/* ── PoPs & subscriber origins ───────────────────────────── */
const RING_R = 13
const RING_C = 2 * Math.PI * RING_R

const POP_DEFS = [
  { key: 'los_angeles', code: 'LAX', lon: -118.24, lat: 34.05, base: 58 },
  { key: 'new_jersey', code: 'EWR', lon: -74.17, lat: 40.73, base: 64 },
  { key: 'frankfurt', code: 'FRA', lon: 8.68, lat: 50.11, base: 61 },
  { key: 'singapore', code: 'SIN', lon: 103.85, lat: 1.29, base: 55 },
  { key: 'tokyo', code: 'TYO', lon: 139.69, lat: 35.69, base: 67 },
  { key: 'shanghai', code: 'SHA', lon: 121.47, lat: 31.23, base: 63 },
]

// status: online | warning | offline | absorbing
const pops = reactive(
  POP_DEFS.map((p) => {
    const [x, y] = projection([p.lon, p.lat])
    return { ...p, x, y, status: 'online', load: p.base }
  }),
)

const ORIGIN_DEFS = [
  { lon: -122.42, lat: 37.77 }, // San Francisco
  { lon: -79.38, lat: 43.65 }, // Toronto
  { lon: -80.19, lat: 25.76 }, // Miami
  { lon: -0.12, lat: 51.51 }, // London
  { lon: -3.7, lat: 40.42 }, // Madrid
  { lon: 72.88, lat: 19.08 }, // Mumbai
  { lon: 126.98, lat: 37.57 }, // Seoul
  { lon: 151.21, lat: -33.87 }, // Sydney
]
const origins = ORIGIN_DEFS.map((o) => {
  const [x, y] = projection([o.lon, o.lat])
  return { x, y }
})

const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2

function nearestPop(o, excludeOffline) {
  let best = -1
  let bestD = Infinity
  pops.forEach((p, i) => {
    if (excludeOffline && p.status === 'offline') return
    const d = dist2(o, p)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

const baseAssign = origins.map((o) => {
  let best = 0
  let bestD = Infinity
  POP_DEFS.forEach((p, i) => {
    const [x, y] = projection([p.lon, p.lat])
    const d = (o.x - x) ** 2 + (o.y - y) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
})

const assign = computed(() => origins.map((o) => nearestPop(o, true)))

/* ── Incident script: one PoP dies per cycle, network absorbs ── */
const PHASES = [
  { key: 'steady', dur: 5200 },
  { key: 'detect', dur: 2400 },
  { key: 'reroute', dur: 5000 },
  { key: 'recover', dur: 3800 },
]

let cycle = 2 // start on FRA — the most connected node tells the best story
const victimIdx = ref(-1)

const log = ref([])
let logId = 0
function pushLog(tone, text, typed = false) {
  log.value = [
    ...log.value.slice(-6),
    { id: logId++, time: new Date().toTimeString().slice(0, 8), tone, text, typed },
  ]
}

function resetNetwork() {
  pops.forEach((p) => {
    p.status = 'online'
    p.load = p.base
  })
}

function onEnter(key, later) {
  if (key === 'steady') {
    resetNetwork()
    victimIdx.value = -1
    pushLog('ok', t('isps.fo_log_probe_ok'))
    later(() => pushLog('info', t('isps.fo_log_qps', { qps: qps.value.toFixed(1) })), 2200)
  } else if (key === 'detect') {
    victimIdx.value = cycle % pops.length
    const v = pops[victimIdx.value]
    v.status = 'warning'
    pushLog('warn', t('isps.fo_log_probe_fail', { node: v.code, n: 1 }), true)
    later(() => pushLog('warn', t('isps.fo_log_probe_fail', { node: v.code, n: 2 })), 900)
    later(() => pushLog('alert', t('isps.fo_log_probe_fail', { node: v.code, n: 3 })), 1800)
  } else if (key === 'reroute') {
    if (victimIdx.value < 0) victimIdx.value = cycle % pops.length
    const v = pops[victimIdx.value]
    v.status = 'offline'
    v.load = 0
    pushLog('alert', t('isps.fo_log_withdraw', { node: v.code }), true)
    later(() => {
      let moved = 0
      origins.forEach((o, i) => {
        if (baseAssign[i] !== victimIdx.value) return
        moved++
        const ni = nearestPop(o, true)
        if (ni >= 0) {
          pops[ni].load = Math.min(94, pops[ni].load + 9)
          if (pops[ni].status === 'online') pops[ni].status = 'absorbing'
        }
      })
      pushLog('action', t('isps.fo_log_steer', { count: Math.max(moved, 1) }))
    }, 700)
    later(() => pushLog('ok', t('isps.fo_log_zero')), 2800)
  } else if (key === 'recover') {
    const v = pops[victimIdx.value]
    if (v) {
      v.status = 'online'
      v.load = Math.round(v.base * 0.4)
      pushLog('ok', t('isps.fo_log_announce', { node: v.code }))
    }
    later(() => {
      resetNetwork()
      victimIdx.value = -1
      pushLog('info', t('isps.fo_log_rebalance'))
    }, 1600)
    cycle++
  }
}

const { phaseIdx, phase, visible, reduced, setPhase, observe } = useDiagramLoop(PHASES, onEnter)

const stepperPhases = computed(() =>
  PHASES.map((p) => ({ key: p.key, label: t(`isps.fo_step_${p.key}`) })),
)

const HEADER_TEXT = {
  steady: 'isps.failover_allonline',
  detect: 'isps.failover_detecting',
  reroute: 'isps.failover_rerouting',
  recover: 'isps.failover_complete',
}
const HEADER_STYLE = {
  steady: { dot: 'bg-green-500', text: 'text-green-400/70' },
  detect: { dot: 'bg-yellow-400', text: 'text-yellow-400/80' },
  reroute: { dot: 'bg-primary', text: 'text-primary/90' },
  recover: { dot: 'bg-green-500', text: 'text-green-400/80' },
}

const victimName = computed(() =>
  victimIdx.value >= 0 ? t(`nodes.${pops[victimIdx.value].key}`) : '',
)

/* ── Query arcs: origin → nearest healthy PoP ───────────── */
function arcPath(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.hypot(dx, dy) || 1
  const trim = Math.max(0, 1 - 17 / dist)
  const ex = a.x + dx * trim
  const ey = a.y + dy * trim
  // Perpendicular bow, always toward the top of the map
  let px = dy / dist
  let py = -dx / dist
  if (py > 0) {
    px = -px
    py = -py
  }
  const off = Math.min(64, dist * 0.22)
  const mx = (a.x + ex) / 2 + px * off
  const my = (a.y + ey) / 2 + py * off
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
}

const arcs = computed(() =>
  origins
    .map((o, i) => {
      const ti = assign.value[i]
      if (ti < 0) return null
      const rerouted = ti !== baseAssign[i]
      // Anchor the latency-delta tag on the side of the origin facing away
      // from the withdrawn PoP so it never collides with its marker
      let lx = o.x + 8
      let ly = o.y - 8
      if (rerouted && victimIdx.value >= 0) {
        const v = pops[victimIdx.value]
        const ux = o.x - v.x
        const uy = o.y - v.y
        const ul = Math.hypot(ux, uy) || 1
        lx = o.x + (ux / ul) * 26
        ly = o.y + (uy / ul) * 26 + 4
      }
      return {
        i,
        key: `${i}-${ti}`,
        d: arcPath(o, pops[ti]),
        rerouted,
        dur: rerouted ? '2s' : '3.4s',
        delay: `${(-i * 0.47).toFixed(2)}s`,
        delta: 5 + ((i * 7) % 9),
        lx,
        ly,
      }
    })
    .filter(Boolean),
)

/* ── PoP visuals ── */
function ringColor(p) {
  if (p.status === 'absorbing') return 'rgba(232,97,26,0.85)'
  if (p.status === 'warning') return 'rgba(251,191,36,0.8)'
  return 'rgba(34,197,94,0.55)'
}
function coreColor(p) {
  if (p.status === 'offline') return 'rgba(239,68,68,0.3)'
  if (p.status === 'absorbing') return '#E8611A'
  if (p.status === 'warning') return '#FBBF24'
  return '#22C55E'
}
function labelColor(p) {
  if (p.status === 'offline') return 'rgba(248,113,113,0.75)'
  if (p.status === 'absorbing') return 'rgba(245,147,77,0.9)'
  return 'rgba(255,255,255,0.5)'
}

const CHIP_DOT = {
  online: 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]',
  warning: 'bg-yellow-400 shadow-[0_0_5px_rgba(251,191,36,0.6)] animate-pulse',
  offline: 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]',
  absorbing: 'bg-primary shadow-[0_0_5px_rgba(232,97,26,0.6)]',
}
const BAR_FILL = {
  online: 'bg-green-500/70',
  warning: 'bg-yellow-400/70',
  offline: 'bg-red-500/40',
  absorbing: 'bg-primary',
}

/* ── KPIs: the numbers an ISP watches ── */
const qps = ref(47.6)
const onlineCount = computed(() => pops.filter((p) => p.status !== 'offline').length)
let qpsTimer = null

watch(visible, (v) => {
  clearInterval(qpsTimer)
  if (v && !reduced) {
    qpsTimer = setInterval(() => {
      qps.value = Math.min(52, Math.max(44, qps.value + (Math.random() - 0.5) * 0.8))
    }, 600)
  }
})

const rootRef = ref(null)
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef)

onMounted(() => {
  landPath.value = pathGen(feature(landData, landData.objects.land))
  observe(rootRef.value)
})

onBeforeUnmount(() => clearInterval(qpsTimer))
</script>

<template>
  <div ref="rootRef" class="fs-root hud-panel hud-corners relative overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 px-5 sm:px-7 py-3.5 border-b border-border-glow/30">
      <div class="flex items-center gap-4 min-w-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-2 h-2 rounded-full animate-pulse shrink-0 transition-colors duration-300" :class="HEADER_STYLE[phase].dot"></span>
          <span class="text-xs font-mono uppercase tracking-wider truncate transition-colors duration-300" :class="HEADER_STYLE[phase].text">
            {{ t(HEADER_TEXT[phase]) }}
          </span>
        </div>
        <div v-if="victimIdx >= 0" class="hidden sm:flex items-center gap-2 pl-4 border-l border-border-glow/30 shrink-0">
          <span class="text-[10px] font-mono text-red-400/70">✗ {{ pops[victimIdx].code }} · {{ victimName }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="hidden sm:inline text-[10px] font-mono text-green-400/70 border border-green-500/20 bg-green-500/5 px-2 py-1">
          {{ t('isps.failover_zero') }}
        </span>
        <button
          class="w-7 h-7 border border-border-glow/50 bg-white/[0.02] text-white/40 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center cursor-pointer"
          :aria-label="isFullscreen ? t('ui.exit_fullscreen') : t('ui.fullscreen')"
          :title="isFullscreen ? t('ui.exit_fullscreen') : t('ui.fullscreen')"
          @click="toggleFullscreen"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="isFullscreen
                ? 'M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25'
                : 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15'"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Scenario stepper -->
    <div class="px-5 sm:px-7 py-3 border-b border-border-glow/30">
      <PhaseStepper :phases="stepperPhases" :current="phaseIdx" @select="setPhase" />
    </div>

    <!-- Map + ops feed -->
    <div class="fs-grow grid lg:grid-cols-[1fr_300px]">
      <div class="fs-map relative border-b lg:border-b-0 lg:border-r border-border-glow/30 overflow-hidden">
        <svg :viewBox="`0 0 ${MAP_W} ${MAP_H}`" class="w-full h-auto block" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="fo-map-dots" width="7" height="7" patternUnits="userSpaceOnUse">
              <circle cx="1.3" cy="1.3" r="1.3" fill="rgba(148,163,184,0.14)" />
            </pattern>
          </defs>

          <!-- Dotted continents -->
          <template v-if="landPath">
            <path :d="landPath" fill="rgba(26,58,92,0.14)" />
            <path :d="landPath" fill="url(#fo-map-dots)" />
          </template>

          <!-- Subscriber origins -->
          <circle v-for="(o, i) in origins" :key="'or' + i" :cx="o.x" :cy="o.y" r="2.4" fill="rgba(255,255,255,0.2)" />

          <!-- Query beams -->
          <g v-for="a in arcs" :key="a.key">
            <path
              :d="a.d"
              :stroke="a.rerouted ? 'rgba(232,97,26,0.3)' : 'rgba(148,163,184,0.22)'"
              stroke-width="1"
              fill="none"
              pathLength="100"
              :class="a.rerouted ? 'path-draw' : ''"
            />
            <g :style="{ '--dur': a.dur, '--delay': a.delay }">
              <template v-if="a.rerouted">
                <path :d="a.d" pathLength="100" fill="none" class="beam-comet layer-glow" stroke="#E8611A" />
                <path :d="a.d" pathLength="100" fill="none" class="beam-comet layer-mid" stroke="#F97316" />
                <path :d="a.d" pathLength="100" fill="none" class="beam-comet layer-core" stroke="#FFD9B0" />
              </template>
              <template v-else>
                <path :d="a.d" pathLength="100" fill="none" class="beam-comet layer-mid" stroke="rgba(232,97,26,0.85)" />
                <path :d="a.d" pathLength="100" fill="none" class="beam-comet layer-core" stroke="rgba(255,224,190,0.95)" />
              </template>
            </g>
            <!-- Honest latency delta while rerouted -->
            <text
              v-if="a.rerouted"
              :x="a.lx"
              :y="a.ly"
              text-anchor="middle"
              class="fade-rise"
              font-family="'JetBrains Mono', monospace"
              font-size="11"
              fill="rgba(251,191,36,0.9)"
              stroke="#050A18"
              stroke-width="3"
              paint-order="stroke"
            >+{{ a.delta }}ms</text>
          </g>

          <!-- PoPs -->
          <g v-for="p in pops" :key="p.key">
            <!-- absorbing ping -->
            <circle
              v-if="p.status === 'absorbing'"
              :cx="p.x" :cy="p.y" r="15"
              fill="none" stroke="rgba(232,97,26,0.5)" stroke-width="1.2"
              class="pop-ping"
            />
            <!-- degraded: rotating dashed ring -->
            <circle
              v-if="p.status === 'warning'"
              :cx="p.x" :cy="p.y" r="19"
              fill="none" stroke="rgba(251,191,36,0.5)" stroke-width="1.2"
              stroke-dasharray="5 4"
              class="pop-warn-ring"
            />
            <!-- capacity ring: track + load arc -->
            <circle :cx="p.x" :cy="p.y" :r="RING_R" fill="rgba(5,10,24,0.7)" stroke="rgba(255,255,255,0.09)" stroke-width="2.5" />
            <circle
              v-if="p.status !== 'offline'"
              :cx="p.x" :cy="p.y" :r="RING_R"
              fill="none"
              :stroke="ringColor(p)"
              stroke-width="2.5"
              stroke-linecap="round"
              :stroke-dasharray="`${((p.load / 100) * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`"
              :transform="`rotate(-90 ${p.x} ${p.y})`"
              class="ring-anim"
            />
            <circle v-if="p.status === 'offline'" :cx="p.x" :cy="p.y" :r="RING_R" fill="none" stroke="rgba(239,68,68,0.35)" stroke-width="1.2" stroke-dasharray="3 4" />
            <!-- core -->
            <circle :cx="p.x" :cy="p.y" r="4.2" :fill="coreColor(p)" style="transition: fill 0.4s" />
            <circle v-if="p.status !== 'offline'" :cx="p.x" :cy="p.y" r="1.7" fill="rgba(255,255,255,0.9)" />
            <!-- offline X -->
            <g v-if="p.status === 'offline'" stroke="rgba(239,68,68,0.9)" stroke-width="2" stroke-linecap="round">
              <line :x1="p.x - 4.5" :y1="p.y - 4.5" :x2="p.x + 4.5" :y2="p.y + 4.5" />
              <line :x1="p.x + 4.5" :y1="p.y - 4.5" :x2="p.x - 4.5" :y2="p.y + 4.5" />
            </g>
            <!-- labels -->
            <text
              :x="p.x" :y="p.y + 31" text-anchor="middle"
              font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700"
              :fill="labelColor(p)" stroke="#050A18" stroke-width="3" paint-order="stroke"
              style="transition: fill 0.4s; letter-spacing: 0.1em"
            >{{ p.code }}</text>
            <text
              :x="p.x" :y="p.y + 44" text-anchor="middle"
              font-family="'JetBrains Mono', monospace" font-size="10"
              :fill="p.status === 'offline' ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.35)'"
              stroke="#050A18" stroke-width="3" paint-order="stroke"
              style="transition: fill 0.4s"
            >{{ p.status === 'offline' ? t('isps.fo_withdrawn') : Math.round(p.load) + '%' }}</text>
          </g>
        </svg>
      </div>

      <!-- Network operations feed: absolutely positioned on lg so its content
           never drives the row height — the map alone defines it -->
      <div class="relative h-52 lg:h-auto">
        <div class="p-3 flex h-full lg:h-auto lg:absolute lg:inset-0">
          <EventLog :entries="log" :title="t('isps.fo_log_title')" class="flex-1 min-h-0" />
        </div>
      </div>
    </div>

    <!-- Per-PoP capacity chips -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-5 sm:px-7 py-4 border-t border-border-glow/30">
      <div v-for="p in pops" :key="'chip' + p.key" class="flex items-center gap-2.5 min-w-0">
        <span class="w-2 h-2 rounded-full shrink-0 transition-colors duration-300" :class="CHIP_DOT[p.status]"></span>
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-1.5">
            <span class="text-[10px] font-mono font-bold tracking-wider" :class="p.status === 'offline' ? 'text-red-400/60' : 'text-white/60'">{{ p.code }}</span>
            <span class="text-[9px] font-mono truncate" :class="p.status === 'offline' ? 'text-red-400/40' : 'text-white/30'">{{ t(`nodes.${p.key}`) }}</span>
          </div>
          <div class="mt-1 h-0.5 bg-white/5 overflow-hidden">
            <div
              class="h-full transition-all duration-700"
              :class="BAR_FILL[p.status]"
              :style="{ width: (p.status === 'offline' ? 0 : p.load) + '%' }"
            ></div>
          </div>
          <div class="mt-0.5 text-[9px] font-mono tabular-nums" :class="p.status === 'offline' ? 'text-red-400/50' : p.status === 'absorbing' ? 'text-primary/70' : 'text-cyan/40'">
            {{ p.status === 'offline' ? t('isps.failover_offline').toUpperCase() : (p.load * 0.145).toFixed(1) + 'K qps' }}
          </div>
        </div>
      </div>
    </div>

    <!-- KPI strip: what the ISP actually cares about -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-glow/30 border-t border-border-glow/30">
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('isps.fo_kpi_pops') }}</div>
        <div class="text-lg font-mono font-bold tabular-nums leading-8 transition-colors duration-300" :class="onlineCount < pops.length ? 'text-yellow-400' : 'text-white/85'">
          {{ onlineCount }}/{{ pops.length }}
        </div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('isps.fo_kpi_qps') }}</div>
        <div class="text-lg font-mono font-bold text-white/85 tabular-nums leading-8">{{ qps.toFixed(1) }}K</div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('isps.fo_kpi_answered') }}</div>
        <div class="text-lg font-mono font-bold text-green-400 tabular-nums leading-8">100.00%</div>
      </div>
      <div class="bg-[#070F1F] px-4 py-3">
        <div class="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1.5">{{ t('isps.fo_kpi_impact') }}</div>
        <div class="text-lg font-mono font-bold text-green-400 tabular-nums leading-8">0</div>
      </div>
    </div>
  </div>
</template>
