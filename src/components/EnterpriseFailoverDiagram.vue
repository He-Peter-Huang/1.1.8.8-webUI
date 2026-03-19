<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Layout constants (SVG viewBox 800x400)
const W = 800, H = 400

// Nodes
const office = { x: 140, y: 200, label: 'enterprise.dia_office' }
const primary = { x: 400, y: 120, label: 'enterprise.dia_primary' }
const standby = { x: 400, y: 280, label: 'enterprise.dia_standby' }
const cloud = { x: 660, y: 200, label: 'enterprise.dia_cloud' }

const phase = ref('normal') // normal, primary_fail, failover_standby, standby_fail, failover_cloud, recovered
const canvasRef = ref(null)

let rafId = null
let lastTime = 0
let phaseTimer = null
let stopped = false

// Particles
let pool = []
let nextId = 0
let lastSpawn = 0

const SPEED = 0.0006
const SPAWN_MS = 180

function lerp(a, b, t) { return a + (b - a) * t }

function createParticle(from, to, color, speed) {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2 + (Math.random() - 0.5) * 30
  return {
    id: nextId++,
    ox: from.x + (Math.random() - 0.5) * 10,
    oy: from.y + (Math.random() - 0.5) * 10,
    cx: mx, cy: my,
    tx: to.x, ty: to.y,
    progress: 0,
    speed: speed * (0.85 + Math.random() * 0.3),
    color,
  }
}

function bezX(ox, cx, tx, t) { const u = 1-t; return u*u*ox + 2*u*t*cx + t*t*tx }
function bezY(oy, cy, ty, t) { const u = 1-t; return u*u*oy + 2*u*t*cy + t*t*ty }

function spawnBatch() {
  if (pool.length > 80) return
  const count = 2 + Math.floor(Math.random() * 2)
  for (let i = 0; i < count; i++) {
    const p = phase.value
    if (p === 'normal') {
      // Office → Primary (green)
      pool.push(createParticle(office, primary, 'green', SPEED))
    } else if (p === 'primary_fail') {
      // Some still try primary (red, will fade), some go standby
      if (Math.random() > 0.5) pool.push(createParticle(office, primary, 'red', SPEED))
      else pool.push(createParticle(office, standby, 'orange', SPEED * 1.2))
    } else if (p === 'failover_standby') {
      // Office → Standby (orange)
      pool.push(createParticle(office, standby, 'orange', SPEED))
    } else if (p === 'standby_fail') {
      // Both down, traffic goes to cloud
      pool.push(createParticle(office, cloud, 'cyan', SPEED * 0.8))
    } else if (p === 'failover_cloud') {
      // Office → Cloud (cyan)
      pool.push(createParticle(office, cloud, 'cyan', SPEED))
    } else {
      // Recovered — back to primary
      pool.push(createParticle(office, primary, 'green', SPEED))
    }
  }
  // Sync line: primary ↔ standby (always when both online)
  if (phase.value === 'normal' || phase.value === 'recovered') {
    if (Math.random() > 0.6) {
      pool.push(createParticle(primary, standby, 'dim', SPEED * 0.5))
    }
  }
  // Sync line: primary/standby → cloud
  if (phase.value === 'normal' || phase.value === 'recovered' || phase.value === 'failover_standby') {
    if (Math.random() > 0.7) {
      const src = phase.value === 'failover_standby' ? standby : primary
      pool.push(createParticle(src, cloud, 'dim', SPEED * 0.4))
    }
  }
}

const colorMap = {
  green: { fill: 'rgba(34,197,94,', glow: 'rgba(34,197,94,' },
  orange: { fill: 'rgba(232,97,26,', glow: 'rgba(232,97,26,' },
  red: { fill: 'rgba(239,68,68,', glow: 'rgba(239,68,68,' },
  cyan: { fill: 'rgba(0,240,255,', glow: 'rgba(0,240,255,' },
  dim: { fill: 'rgba(255,255,255,', glow: 'rgba(255,255,255,' },
}

function nodeStatus(node) {
  const p = phase.value
  if (node === primary) {
    if (p === 'primary_fail' || p === 'failover_standby' || p === 'standby_fail' || p === 'failover_cloud') return 'offline'
    return 'online'
  }
  if (node === standby) {
    if (p === 'standby_fail' || p === 'failover_cloud') return 'offline'
    if (p === 'failover_standby') return 'active'
    return 'standby'
  }
  if (node === cloud) {
    if (p === 'standby_fail' || p === 'failover_cloud') return 'active'
    return 'sync'
  }
  return 'source'
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
  const cw = rect.width * dpr, ch = rect.height * dpr

  if (canvas.width !== Math.round(cw) || canvas.height !== Math.round(ch)) {
    canvas.width = Math.round(cw)
    canvas.height = Math.round(ch)
  }

  const sx = cw / W, sy = ch / H
  ctx.clearRect(0, 0, cw, ch)

  // Spawn
  if (now - lastSpawn > SPAWN_MS) { spawnBatch(); lastSpawn = now }

  // Draw connection lines
  const allNodes = [office, primary, standby, cloud]
  const connections = [
    [office, primary], [office, standby], [office, cloud],
    [primary, standby], [primary, cloud], [standby, cloud],
  ]
  ctx.lineWidth = 1 * sx
  for (const [a, b] of connections) {
    const aOff = nodeStatus(a) === 'offline'
    const bOff = nodeStatus(b) === 'offline'
    if (aOff && bOff) continue
    const active = (
      (a === office && b === primary && (phase.value === 'normal' || phase.value === 'recovered')) ||
      (a === office && b === standby && (phase.value === 'failover_standby' || phase.value === 'primary_fail')) ||
      (a === office && b === cloud && (phase.value === 'standby_fail' || phase.value === 'failover_cloud'))
    )
    if (active) {
      ctx.strokeStyle = 'rgba(34,197,94,0.2)'
      ctx.setLineDash([])
    } else if (aOff || bOff) {
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.setLineDash([4 * sx, 6 * sx])
    } else {
      ctx.strokeStyle = 'rgba(26,58,92,0.2)'
      ctx.setLineDash([3 * sx, 4 * sx])
    }
    ctx.beginPath()
    ctx.moveTo(a.x * sx, a.y * sy)
    ctx.lineTo(b.x * sx, b.y * sy)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // Update & draw particles
  let alive = 0
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]
    p.progress += p.speed * dt
    if (p.progress >= 1) continue
    const px = bezX(p.ox, p.cx, p.tx, p.progress) * sx
    const py = bezY(p.oy, p.cy, p.ty, p.progress) * sy
    const alpha = p.color === 'dim' ? 0.12 - p.progress * 0.08 : 0.8 - p.progress * 0.4
    const r = p.color === 'dim' ? 1.5 * sx : 2.5 * sx
    const cm = colorMap[p.color]
    ctx.fillStyle = cm.fill + alpha + ')'
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
    if (p.color !== 'dim') {
      ctx.fillStyle = cm.glow + alpha * 0.3 + ')'
      ctx.beginPath()
      ctx.arc(px, py, r * 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
    pool[alive++] = p
  }
  pool.length = alive

  // Draw nodes
  for (const node of allNodes) {
    const nx = node.x * sx, ny = node.y * sy
    const status = nodeStatus(node)
    const isOff = status === 'offline'
    const isActive = status === 'active' || status === 'online' || status === 'source'

    // Pulse
    if (isActive) {
      const pulsePhase = ((now / 2500 + allNodes.indexOf(node) * 0.25) % 1)
      const pulseR = (14 + pulsePhase * 16) * sx
      const pulseAlpha = 0.4 * (1 - pulsePhase)
      const c = status === 'active' && node === cloud ? 'rgba(0,240,255,' : status === 'active' ? 'rgba(232,97,26,' : 'rgba(34,197,94,'
      ctx.strokeStyle = c + pulseAlpha + ')'
      ctx.lineWidth = 1 * sx
      ctx.beginPath()
      ctx.arc(nx, ny, pulseR, 0, Math.PI * 2)
      ctx.stroke()
    }

    // X for offline
    if (isOff) {
      ctx.strokeStyle = 'rgba(239,68,68,0.6)'
      ctx.lineWidth = 2.5 * sx
      ctx.beginPath()
      ctx.moveTo(nx - 10 * sx, ny - 10 * sy); ctx.lineTo(nx + 10 * sx, ny + 10 * sy)
      ctx.moveTo(nx + 10 * sx, ny - 10 * sy); ctx.lineTo(nx - 10 * sx, ny + 10 * sy)
      ctx.stroke()
    }

    // Node circle
    const outerR = 12 * sx
    if (isOff) {
      ctx.fillStyle = 'rgba(239,68,68,0.05)'
      ctx.strokeStyle = 'rgba(239,68,68,0.2)'
    } else if (status === 'sync' || status === 'standby') {
      ctx.fillStyle = 'rgba(0,240,255,0.05)'
      ctx.strokeStyle = 'rgba(0,240,255,0.2)'
    } else if (status === 'active' && node === cloud) {
      ctx.fillStyle = 'rgba(0,240,255,0.1)'
      ctx.strokeStyle = 'rgba(0,240,255,0.5)'
    } else if (status === 'active') {
      ctx.fillStyle = 'rgba(232,97,26,0.1)'
      ctx.strokeStyle = 'rgba(232,97,26,0.4)'
    } else {
      ctx.fillStyle = 'rgba(34,197,94,0.08)'
      ctx.strokeStyle = 'rgba(34,197,94,0.35)'
    }
    ctx.lineWidth = 1.2 * sx
    ctx.beginPath()
    ctx.arc(nx, ny, outerR, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Inner dot
    const innerR = 6 * sx
    if (isOff) ctx.fillStyle = 'rgba(239,68,68,0.15)'
    else if (status === 'sync' || status === 'standby') ctx.fillStyle = 'rgba(0,240,255,0.4)'
    else if (status === 'active' && node === cloud) ctx.fillStyle = '#00F0FF'
    else if (status === 'active') ctx.fillStyle = '#E8611A'
    else ctx.fillStyle = '#22C55E'
    ctx.beginPath()
    ctx.arc(nx, ny, innerR, 0, Math.PI * 2)
    ctx.fill()

    if (!isOff) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.beginPath()
      ctx.arc(nx, ny, 2.5 * sx, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// Phase cycle
async function delay(ms) {
  return new Promise(resolve => { phaseTimer = setTimeout(resolve, ms) })
}

async function runCycle() {
  if (stopped) return

  // Normal: office → primary, standby on hot-spare, cloud syncing
  phase.value = 'normal'
  await delay(4000)
  if (stopped) return

  // Primary fails
  phase.value = 'primary_fail'
  await delay(1200)
  if (stopped) return

  // Traffic shifts to standby
  phase.value = 'failover_standby'
  await delay(3500)
  if (stopped) return

  // Standby also fails (worst case demo)
  phase.value = 'standby_fail'
  await delay(1200)
  if (stopped) return

  // Cloud takes over
  phase.value = 'failover_cloud'
  await delay(3500)
  if (stopped) return

  // Everything recovers
  phase.value = 'recovered'
  await delay(3000)
  if (stopped) return

  runCycle()
}

onMounted(() => {
  rafId = requestAnimationFrame(drawFrame)
  delay(2000).then(() => { if (!stopped) runCycle() })
})

onUnmounted(() => {
  stopped = true
  if (rafId) cancelAnimationFrame(rafId)
  if (phaseTimer) clearTimeout(phaseTimer)
  pool.length = 0
})
</script>

<template>
  <div class="hud-panel hud-corners p-5 sm:p-8 relative overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-glow/30">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full animate-pulse" :class="{
          'bg-green-500': phase === 'normal' || phase === 'recovered',
          'bg-red-500': phase === 'primary_fail' || phase === 'standby_fail',
          'bg-primary': phase === 'failover_standby',
          'bg-cyan': phase === 'failover_cloud',
        }"></span>
        <span class="text-xs font-mono uppercase tracking-wider" :class="{
          'text-green-400/60': phase === 'normal' || phase === 'recovered',
          'text-red-400/60': phase === 'primary_fail' || phase === 'standby_fail',
          'text-primary/60': phase === 'failover_standby',
          'text-cyan/60': phase === 'failover_cloud',
        }">
          {{ t(`enterprise.dia_phase_${phase}`) }}
        </span>
      </div>
      <span class="text-xs font-mono text-green-400/60">{{ t('enterprise.dia_zero_downtime') }}</span>
    </div>

    <!-- Diagram -->
    <div class="relative w-full" style="aspect-ratio: 800/400;">
      <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" />
      <!-- HTML labels for crisp text -->
      <div class="absolute text-center" style="left: 12%; top: 37%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono text-white/50 uppercase tracking-wider">{{ t('enterprise.dia_office') }}</div>
        <div class="text-[9px] font-mono text-cyan/40 mt-0.5">{{ t('enterprise.dia_users') }}</div>
      </div>
      <div class="absolute text-center" style="left: 50%; top: 14%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono uppercase tracking-wider" :class="phase === 'primary_fail' || phase === 'failover_standby' || phase === 'standby_fail' || phase === 'failover_cloud' ? 'text-red-400/50' : 'text-green-400/60'">{{ t('enterprise.dia_primary') }}</div>
        <div class="text-[9px] font-mono mt-0.5" :class="phase === 'primary_fail' || phase === 'failover_standby' || phase === 'standby_fail' || phase === 'failover_cloud' ? 'text-red-400/30' : 'text-white/25'">{{ t('enterprise.dia_appliance') }} A</div>
      </div>
      <div class="absolute text-center" style="left: 50%; top: 86%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono uppercase tracking-wider" :class="phase === 'standby_fail' || phase === 'failover_cloud' ? 'text-red-400/50' : phase === 'failover_standby' ? 'text-primary/60' : 'text-cyan/40'">{{ t('enterprise.dia_standby') }}</div>
        <div class="text-[9px] font-mono mt-0.5" :class="phase === 'standby_fail' || phase === 'failover_cloud' ? 'text-red-400/30' : 'text-white/25'">{{ t('enterprise.dia_appliance') }} B</div>
      </div>
      <div class="absolute text-center" style="left: 82.5%; top: 37%; transform: translate(-50%, -50%);">
        <div class="text-[10px] font-mono uppercase tracking-wider" :class="phase === 'failover_cloud' || phase === 'standby_fail' ? 'text-cyan/70' : 'text-cyan/40'">{{ t('enterprise.dia_cloud') }}</div>
        <div class="text-[9px] font-mono text-white/25 mt-0.5">1.1.8.8</div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border-glow/30 text-[10px] font-mono">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        <span class="text-white/30">{{ t('enterprise.dia_leg_normal') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
        <span class="text-white/30">{{ t('enterprise.dia_leg_standby') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan"></span>
        <span class="text-white/30">{{ t('enterprise.dia_leg_cloud') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        <span class="text-white/30">{{ t('enterprise.dia_leg_offline') }}</span>
      </div>
    </div>
  </div>
</template>
