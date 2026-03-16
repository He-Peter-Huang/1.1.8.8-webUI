<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import landData from 'world-atlas/land-110m.json'

const { t } = useI18n()

// ── Map setup ──────────────────────────────────────────────
const MAP_W = 1200
const MAP_H = 520

const projection = geoNaturalEarth1().scale(215).translate([MAP_W / 2, MAP_H / 2 + 25])
const pathGen = geoPath(projection)
const landPath = ref('')

// ── Nodes ──────────────────────────────────────────────────
const geoNodes = [
  { key: 'los_angeles', lon: -118.24, lat: 34.05 },
  { key: 'new_jersey', lon: -74.17, lat: 40.73 },
  { key: 'frankfurt', lon: 8.68, lat: 50.11 },
  { key: 'singapore', lon: 103.85, lat: 1.29 },
  { key: 'tokyo', lon: 139.69, lat: 35.69 },
  { key: 'shanghai', lon: 121.47, lat: 31.23 },
].map(n => {
  const [x, y] = projection([n.lon, n.lat])
  return { ...n, x, y }
})

const nodes = reactive(geoNodes.map(n => ({
  ...n,
  status: 'online',
  qps: 6000 + Math.floor(Math.random() * 7000),
})))

// ── Clients ────────────────────────────────────────────────
const clients = [
  { lon: -122.42, lat: 37.77 },  // San Francisco
  { lon: -112.07, lat: 33.45 },  // Phoenix
  { lon: -123.11, lat: 49.28 },  // Vancouver
  { lon: -71.06, lat: 42.36 },   // Boston
  { lon: -80.19, lat: 25.76 },   // Miami
  { lon: -87.63, lat: 41.88 },   // Chicago
  { lon: -0.12, lat: 51.51 },    // London
  { lon: 2.35, lat: 48.86 },     // Paris
  { lon: 12.50, lat: 41.90 },    // Rome
  { lon: 21.01, lat: 52.23 },    // Warsaw
  { lon: 100.52, lat: 13.76 },   // Bangkok
  { lon: 106.85, lat: -6.21 },   // Jakarta
  { lon: 77.21, lat: 28.61 },    // Delhi
  { lon: 126.98, lat: 37.57 },   // Seoul
  { lon: 114.17, lat: 22.28 },   // Hong Kong
  { lon: 116.40, lat: 39.90 },   // Beijing
  { lon: -43.17, lat: -22.91 },  // Rio
  { lon: -70.65, lat: -33.45 },  // Santiago
  { lon: 151.21, lat: -33.87 },  // Sydney
  { lon: 28.05, lat: -26.20 },   // Johannesburg
].map(c => {
  const [x, y] = projection([c.lon, c.lat])
  return { x, y }
})

// ── Helpers ────────────────────────────────────────────────
function dist2(ax, ay, bx, by) {
  return (ax - bx) ** 2 + (ay - by) ** 2
}

function nearestOnlineNode(cx, cy) {
  let best = -1, bestD = Infinity
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].status === 'offline') continue
    const d = dist2(cx, cy, nodes[i].x, nodes[i].y)
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

// ── Failover state machine ─────────────────────────────────
const failingNodeIdx = ref(-1)
const phase = ref('normal')

const failingNodeName = computed(() => {
  if (failingNodeIdx.value < 0) return ''
  return t(`nodes.${nodes[failingNodeIdx.value].key}`)
})

// ── Canvas rendering ───────────────────────────────────────
const canvasRef = ref(null)
const containerRef = ref(null)

// Particle pool — plain arrays, never reactive
let pool = []       // active particles
let nextId = 0
let lastSpawn = 0
let rafId = null
let lastTime = 0
let absorberIndices = []

const SPAWN_INTERVAL = 120     // ms between spawn batches
const PARTICLE_SPEED = 0.00028 // progress per ms  (~3.5s travel)
const PARTICLE_SPEED_REROUTE = 0.0005
const MAX_PARTICLES = 300

function createParticle(cx, cy, nodeIdx, rerouted) {
  const node = nodes[nodeIdx]
  // Quadratic bezier control point — arc upward
  const mx = (cx + node.x) / 2
  const my = (cy + node.y) / 2 - 20 - Math.random() * 30
  return {
    id: nextId++,
    ox: cx, oy: cy,           // origin
    cx: mx, cy: my,           // control point
    tx: node.x, ty: node.y,   // target
    targetNode: nodeIdx,
    progress: 0,
    speed: rerouted ? PARTICLE_SPEED_REROUTE : PARTICLE_SPEED * (0.85 + Math.random() * 0.3),
    rerouted,
  }
}

function spawnBatch() {
  if (pool.length > MAX_PARTICLES) return
  const count = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const ci = Math.floor(Math.random() * clients.length)
    const c = clients[ci]
    const ni = nearestOnlineNode(c.x, c.y)
    if (ni < 0) continue
    pool.push(createParticle(
      c.x + (Math.random() - 0.5) * 6,
      c.y + (Math.random() - 0.5) * 6,
      ni,
      nodes[ni].status === 'absorbing',
    ))
  }
}

// Quadratic bezier interpolation
function bezierX(ox, cx, tx, t) {
  const u = 1 - t
  return u * u * ox + 2 * u * t * cx + t * t * tx
}
function bezierY(oy, cy, ty, t) {
  const u = 1 - t
  return u * u * oy + 2 * u * t * cy + t * t * ty
}

function drawFrame(now) {
  rafId = requestAnimationFrame(drawFrame)

  const dt = lastTime ? now - lastTime : 16
  lastTime = now

  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const cw = rect.width * dpr
  const ch = rect.height * dpr

  if (canvas.width !== Math.round(cw) || canvas.height !== Math.round(ch)) {
    canvas.width = Math.round(cw)
    canvas.height = Math.round(ch)
  }

  const sx = cw / MAP_W
  const sy = ch / MAP_H

  ctx.clearRect(0, 0, cw, ch)

  // Spawn
  if (now - lastSpawn > SPAWN_INTERVAL) {
    spawnBatch()
    lastSpawn = now
  }

  // Draw connection lines between nodes
  ctx.lineWidth = 0.6 * sx
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const dead = a.status === 'offline' || b.status === 'offline'
      ctx.strokeStyle = dead ? 'rgba(255,255,255,0.03)' : 'rgba(26,58,92,0.25)'
      if (dead) ctx.setLineDash([4 * sx, 6 * sx])
      else ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(a.x * sx, a.y * sy)
      ctx.lineTo(b.x * sx, b.y * sy)
      ctx.stroke()
    }
  }
  ctx.setLineDash([])

  // Draw client dots
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  for (const c of clients) {
    ctx.beginPath()
    ctx.arc(c.x * sx, c.y * sy, 2 * sx, 0, Math.PI * 2)
    ctx.fill()
  }

  // Update & draw particles
  let alive = 0
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]
    p.progress += p.speed * dt
    if (p.progress >= 1) continue

    const px = bezierX(p.ox, p.cx, p.tx, p.progress) * sx
    const py = bezierY(p.oy, p.cy, p.ty, p.progress) * sy
    const alpha = 0.85 - p.progress * 0.45
    const r = p.rerouted ? 3 * sx : 2 * sx

    if (p.rerouted) {
      ctx.fillStyle = `rgba(232,97,26,${alpha})`
    } else {
      ctx.fillStyle = `rgba(34,197,94,${alpha})`
    }
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()

    // Subtle glow for rerouted
    if (p.rerouted) {
      ctx.fillStyle = `rgba(232,97,26,${alpha * 0.3})`
      ctx.beginPath()
      ctx.arc(px, py, r * 2.5, 0, Math.PI * 2)
      ctx.fill()
    }

    pool[alive++] = p
  }
  pool.length = alive

  // Draw nodes on canvas too for layering
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    const nx = n.x * sx, ny = n.y * sy

    // Pulse ring
    if (n.status !== 'offline') {
      const pulsePhase = ((now / 3000 + i * 0.17) % 1)
      const pulseR = (10 + pulsePhase * 14) * sx
      const pulseAlpha = 0.5 * (1 - pulsePhase)
      ctx.strokeStyle = statusGlowRgba(n.status, pulseAlpha)
      ctx.lineWidth = 1 * sx
      ctx.beginPath()
      ctx.arc(nx, ny, pulseR, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Warning ring
    if (n.status === 'warning') {
      const rot = (now / 2000) * Math.PI * 2
      ctx.strokeStyle = 'rgba(251,191,36,0.5)'
      ctx.lineWidth = 1.5 * sx
      ctx.setLineDash([4 * sx, 3 * sx])
      ctx.save()
      ctx.translate(nx, ny)
      ctx.rotate(rot)
      ctx.beginPath()
      ctx.arc(0, 0, 18 * sx, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
      ctx.setLineDash([])
    }

    // Offline X
    if (n.status === 'offline') {
      ctx.strokeStyle = 'rgba(239,68,68,0.7)'
      ctx.lineWidth = 2 * sx
      ctx.beginPath()
      ctx.moveTo(nx - 8 * sx, ny - 8 * sy); ctx.lineTo(nx + 8 * sx, ny + 8 * sy)
      ctx.moveTo(nx + 8 * sx, ny - 8 * sy); ctx.lineTo(nx - 8 * sx, ny + 8 * sy)
      ctx.stroke()
    }

    // Outer ring
    const outerR = 8 * sx
    ctx.fillStyle = n.status === 'offline' ? 'rgba(239,68,68,0.06)' : statusFillRgba(n.status, 0.07)
    ctx.strokeStyle = n.status === 'offline' ? 'rgba(239,68,68,0.2)' : statusGlowRgba(n.status, 0.4)
    ctx.lineWidth = 0.8 * sx
    ctx.beginPath()
    ctx.arc(nx, ny, outerR, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Inner dot
    const innerR = (n.status === 'absorbing' ? 6 : 4.5) * sx
    ctx.fillStyle = n.status === 'offline' ? 'rgba(239,68,68,0.15)' : statusColorHex(n.status)
    ctx.beginPath()
    ctx.arc(nx, ny, innerR, 0, Math.PI * 2)
    ctx.fill()

    // Center white dot
    if (n.status !== 'offline') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.beginPath()
      ctx.arc(nx, ny, 2 * sx, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function statusColorHex(s) {
  switch (s) {
    case 'online': return '#22C55E'
    case 'warning': return '#FBBF24'
    case 'offline': return '#EF4444'
    case 'absorbing': return '#E8611A'
    default: return '#22C55E'
  }
}
function statusGlowRgba(s, a) {
  switch (s) {
    case 'online': return `rgba(34,197,94,${a})`
    case 'warning': return `rgba(251,191,36,${a})`
    case 'offline': return `rgba(239,68,68,${a})`
    case 'absorbing': return `rgba(232,97,26,${a})`
    default: return `rgba(34,197,94,${a})`
  }
}
function statusFillRgba(s, a) {
  return statusGlowRgba(s, a)
}

// ── Failover cycle ─────────────────────────────────────────
const timers = []
let stopped = false

function delay(ms) {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms)
    timers.push(id)
  })
}

async function runFailoverCycle() {
  if (stopped) return

  const idx = Math.floor(Math.random() * nodes.length)
  failingNodeIdx.value = idx

  // Phase 1: Warning — node degrading
  phase.value = 'failing'
  nodes[idx].status = 'warning'
  await delay(1500)
  if (stopped) return

  // Phase 2: Offline — reroute in-flight particles
  nodes[idx].status = 'offline'
  nodes[idx].qps = 0
  phase.value = 'rerouting'

  for (const p of pool) {
    if (p.targetNode === idx) {
      const curX = bezierX(p.ox, p.cx, p.tx, p.progress)
      const curY = bezierY(p.oy, p.cy, p.ty, p.progress)
      const newIdx = nearestOnlineNode(curX, curY)
      if (newIdx >= 0) {
        p.ox = curX
        p.oy = curY
        p.tx = nodes[newIdx].x
        p.ty = nodes[newIdx].y
        p.cx = (curX + p.tx) / 2
        p.cy = (curY + p.ty) / 2 - 15 - Math.random() * 20
        p.targetNode = newIdx
        p.progress = 0
        p.speed = PARTICLE_SPEED_REROUTE
        p.rerouted = true
      }
    }
  }

  // Nearest 2-3 neighbors absorb traffic
  const ranked = []
  for (let i = 0; i < nodes.length; i++) {
    if (i !== idx && nodes[i].status !== 'offline') {
      ranked.push({ i, d: dist2(nodes[i].x, nodes[i].y, nodes[idx].x, nodes[idx].y) })
    }
  }
  ranked.sort((a, b) => a.d - b.d)
  absorberIndices = ranked.slice(0, 3).map(r => r.i)
  absorberIndices.forEach(ni => {
    nodes[ni].status = 'absorbing'
    nodes[ni].qps = Math.round(nodes[ni].qps * 1.3)
  })

  await delay(3000)
  if (stopped) return

  // Phase 3: Stabilized — absorbers back to normal
  phase.value = 'recovered'
  absorberIndices.forEach(ni => { nodes[ni].status = 'online' })

  await delay(2500)
  if (stopped) return

  // Phase 4: Node back online
  nodes[idx].status = 'online'
  nodes[idx].qps = 6000 + Math.floor(Math.random() * 5000)
  phase.value = 'normal'
  failingNodeIdx.value = -1
  absorberIndices = []

  nodes.forEach(n => {
    if (n.status === 'online') {
      n.qps = 6000 + Math.floor(Math.random() * 7000)
    }
  })

  // Breathe — steady state for a beat, then next cycle
  await delay(3000)
  if (!stopped) runFailoverCycle()
}

// ── Lifecycle ──────────────────────────────────────────────
onMounted(() => {
  const land = feature(landData, landData.objects.land)
  landPath.value = pathGen(land)

  rafId = requestAnimationFrame(drawFrame)

  // Initial steady state, then start cycling
  delay(3000).then(() => {
    if (!stopped) runFailoverCycle()
  })
})

onUnmounted(() => {
  stopped = true
  if (rafId) cancelAnimationFrame(rafId)
  timers.forEach(clearTimeout)
  pool.length = 0
})
</script>

<template>
  <div class="hud-panel hud-corners p-5 sm:p-8 relative overflow-hidden">
    <!-- Header bar -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-glow/30">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="phase === 'normal' || phase === 'recovered' ? 'bg-green-500' : phase === 'failing' ? 'bg-yellow-400' : 'bg-red-500'"></span>
          <span class="text-xs font-mono uppercase tracking-wider" :class="{
            'text-green-400/60': phase === 'normal',
            'text-yellow-400/60': phase === 'failing',
            'text-primary/60': phase === 'rerouting',
            'text-green-400/70': phase === 'recovered',
          }">
            {{ phase === 'normal' ? t('isps.failover_allonline') : phase === 'failing' ? t('isps.failover_detecting') : phase === 'rerouting' ? t('isps.failover_rerouting') : t('isps.failover_complete') }}
          </span>
        </div>
        <div v-if="phase === 'rerouting' || phase === 'failing'" class="hidden sm:flex items-center gap-2 pl-4 border-l border-border-glow/30">
          <span class="text-[10px] font-mono text-red-400/60">{{ failingNodeName }}</span>
        </div>
      </div>
      <span class="text-xs font-mono text-green-400/60">{{ t('isps.failover_zero') }}</span>
    </div>

    <!-- Map + canvas layered -->
    <div ref="containerRef" class="relative w-full" style="aspect-ratio: 1200/520;">
      <!-- SVG base layer: land, grid -->
      <svg
        :viewBox="`0 0 ${MAP_W} ${MAP_H}`"
        class="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <clipPath id="foMapClip">
          <rect x="0" y="0" :width="MAP_W" :height="MAP_H" />
        </clipPath>
        <g clip-path="url(#foMapClip)">
          <line
            v-for="i in 10" :key="'gh'+i"
            :x1="0" :y1="i * (MAP_H / 11)" :x2="MAP_W" :y2="i * (MAP_H / 11)"
            stroke="rgba(26,58,92,0.12)" stroke-width="0.5"
          />
          <line
            v-for="i in 23" :key="'gv'+i"
            :x1="i * (MAP_W / 24)" :y1="0" :x2="i * (MAP_W / 24)" :y2="MAP_H"
            stroke="rgba(26,58,92,0.12)" stroke-width="0.5"
          />
          <path
            v-if="landPath"
            :d="landPath"
            fill="rgba(26,58,92,0.2)"
            stroke="rgba(26,58,92,0.4)"
            stroke-width="0.6"
          />
        </g>
      </svg>

      <!-- Canvas overlay: particles, nodes, connections -->
      <canvas
        ref="canvasRef"
        class="absolute inset-0 w-full h-full"
      />
    </div>

    <!-- Node labels (HTML for crisp text + i18n) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-3 border-t border-border-glow/30">
      <div
        v-for="n in nodes"
        :key="n.key"
        class="flex items-center gap-2.5"
      >
        <span
          class="w-2 h-2 rounded-full shrink-0"
          :class="{
            'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]': n.status === 'online',
            'bg-yellow-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]': n.status === 'warning',
            'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]': n.status === 'offline',
            'bg-primary shadow-[0_0_5px_rgba(232,97,26,0.6)]': n.status === 'absorbing',
          }"
        ></span>
        <div class="min-w-0">
          <div class="text-xs font-mono truncate leading-tight" :class="n.status === 'offline' ? 'text-red-400/50' : 'text-white/50'">{{ t(`nodes.${n.key}`) }}</div>
          <div class="text-[10px] font-mono tabular-nums leading-tight" :class="n.status === 'offline' ? 'text-red-400/40' : n.status === 'absorbing' ? 'text-primary/60' : 'text-cyan/40'">
            <template v-if="n.status === 'offline'">OFFLINE</template>
            <template v-else>{{ (n.qps / 1000).toFixed(1) }}K qps</template>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border-glow/30 text-[10px] font-mono">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        <span class="text-white/30">{{ t('isps.failover_online') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
        <span class="text-white/30">{{ t('isps.failover_absorbing') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        <span class="text-white/30">{{ t('isps.failover_offline') }}</span>
      </div>
      <div class="flex items-center gap-1.5 ml-2">
        <span class="w-1.5 h-1.5 rounded-full bg-white/15"></span>
        <span class="text-white/30">{{ t('isps.failover_users') }}</span>
      </div>
    </div>
  </div>
</template>
